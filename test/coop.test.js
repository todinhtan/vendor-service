const mongoose = require('mongoose');
const request = require('supertest');

const setup = require('./setup');

const Vendor = require('../models/Vendor');
const Coop = require('../models/Coop');

const vendorFactory = require('./factories/vendor');
const coopFactory = require('./factories/coop');
const tokenFactory = require('./factories/token');

const { COOP_STATUSES } = require('../constants/enums');

let vendor,
  token,
  coop;

beforeAll(async () => {
  await setup(global.mongoUrl);
  vendor = await vendorFactory();
  coop = await coopFactory(vendor);
  token = tokenFactory(vendor);
});

describe('COOP', () => {
  test('get all my coops', async () => {
    const anotherCoop = await coopFactory(vendor, { name: 'some coop' });

    const response = await request(global.expressApp)
      .get('/private/coops')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    const coops = response.body;
    const coopIds = coops.map(coop => coop._id.toString());
    expect(response.statusCode).toBe(200);
    expect(coops.length).toEqual(2);
    expect(coopIds).toContain(coop._id.toString());
    expect(coopIds).toContain(anotherCoop._id.toString());
  });

  test('create new coop', async () => {
    const response = await request(global.expressApp)
      .post('/private/coops')
      .send({ name: 'hello', description: 'new coop' })
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    vendor = await Vendor.findById(vendor._id);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBeDefined();
    expect(response.body.name).toBe('hello');
    expect(response.body.status).toBe(COOP_STATUSES.available);
    expect(response.body.adminId).toBe(vendor._id.toString());
    expect(response.body.memberIds).toContain(vendor._id.toString());

    expect(vendor.coopIds).toContain(response.body._id);
  });

  test('get a coop', async () => {
    const response = await request(global.expressApp)
      .get(`/private/coops/${coop._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe(coop.name);
    expect(response.body.status).toBe(COOP_STATUSES.available);
    expect(response.body.adminId).toBe(vendor._id.toString());
    expect(response.body.memberIds).toContain(vendor._id.toString());
  });
});

describe('COOP invitation', () => {
  let anotherVendor,
    anotherToken,
    anotherCoop;
  beforeAll(async () => {
    anotherVendor = await vendorFactory({ email: 'failed@test.com' });
    anotherToken = await tokenFactory(anotherVendor);
    anotherCoop = await coopFactory(vendor);
  });

  test('invite failed - not the admin', async () => {
    const response = await request(global.expressApp)
      .post(`/private/coops/${coop._id}/invite`)
      .send({ vendorId: anotherVendor._id })
      .set('jwt_token', anotherToken)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('You are not able to do this action.');
  });

  test('invite failed - already a member', async () => {
    const response = await request(global.expressApp)
      .post(`/private/coops/${coop._id}/invite`)
      .send({ vendorId: vendor._id })
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Vendor is already a member.');
  });

  test('invite success', async () => {
    const response = await request(global.expressApp)
      .post(`/private/coops/${coop._id}/invite`)
      .send({ vendorId: anotherVendor._id })
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    coop = await Coop.findById(coop._id);

    expect(coop.invitations).toContain(anotherVendor._id.toString());
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Invitation success.');
  });

  test('join failed - not invited', async () => {
    const response = await request(global.expressApp)
      .post(`/private/coops/${anotherCoop._id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('You are not invited.');
  });

  // this depends on invite success anotherVendor should be invited to coop first
  test('join success', async () => {
    const response = await request(global.expressApp)
      .post(`/private/coops/${coop._id}/join`)
      .set('Authorization', `Bearer ${anotherToken}`)
      .set('Accept', 'application/json');

    coop = await Coop.findById(coop._id);

    expect(coop.memberIds).toContain(vendor._id.toString()); // to make sure not remove existed vendor
    expect(coop.memberIds).toContain(anotherVendor._id.toString());

    expect(coop.invitations.length).toBe(0);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Join success.');
  });
});

describe('COOP members', () => {
  let anotherVendor,
    anotherToken,
    anotherCoop;

  beforeAll(async () => {
    anotherVendor = await vendorFactory({ email: 'new_mem@test.com' });
    anotherToken = await tokenFactory(anotherVendor);
    anotherCoop = await coopFactory(vendor, {
      memberIds: [vendor._id.toString(), anotherVendor._id.toString()],
    });
  });

  test('get list members failed - not authorized', async () => {
    const newVendor = await vendorFactory({ email: 'new_vendor1@test.com' });
    const newToken = tokenFactory(newVendor);

    const response = await request(global.expressApp)
      .get(`/private/coops/${anotherCoop._id}/members`)
      .set('jwt_token', newToken)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('You are not able to do this action.');
  })

  test('get list success', async () => {
    const response = await request(global.expressApp)
      .get(`/private/coops/${anotherCoop._id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toEqual(2);
    expect(response.body.map(member => member.name)).toContain(vendor.name);
    expect(response.body.map(member => member.name)).toContain(anotherVendor.name);
  })

  test('get member failed - not a member', async () => {
    const newVendor = await vendorFactory({ email: 'memberfromhell@test.com' });

    const response = await request(global.expressApp)
      .get(`/private/coops/${anotherCoop._id}/members/${newVendor._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Not a member.');
  })

  test('get member success', async () => {
    const response = await request(global.expressApp)
      .get(`/private/coops/${anotherCoop._id}/members/${anotherVendor._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toEqual(anotherVendor.name);
  })

  test('kickout failed - not the admin', async () => {
    const response = await request(global.expressApp)
      .delete(`/private/coops/${anotherCoop._id}/members/${vendor._id}`)
      .set('jwt_token', anotherToken)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('You are not able to do this action.');
  });

  test('kickout failed - not a member', async () => {
    const someOtherVendor = await vendorFactory({ email: 'new_mem2@test.com' });
    const response = await request(global.expressApp)
      .delete(`/private/coops/${anotherCoop._id}/members/${someOtherVendor._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Not a member.');
  });

  test('kickout success', async () => {
    const response = await request(global.expressApp)
      .delete(`/private/coops/${anotherCoop._id}/members/${anotherVendor._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    coop = await Coop.findById(coop._id);

    expect(coop.memberIds).toContain(vendor._id.toString());
    expect(coop.memberIds).not.toContain(anotherVendor._id.toString());
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Kick member out success.');
  });

  test('leave success', async () => {
    const newVendor = await vendorFactory({ email: 'new_vendor@test.com' });
    const newCoop = await coopFactory(newVendor, {
      memberIds: [vendor._id.toString(), newVendor._id.toString()],
    });

    const response = await request(global.expressApp)
      .delete(`/private/coops/${newCoop._id}/members/self`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    const updatedCoop = await Coop.findById(newCoop._id);

    expect(updatedCoop.memberIds).toContain(newVendor._id.toString());
    expect(updatedCoop.memberIds).not.toContain(vendor._id.toString());
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Leave group success.');
  });
});
