const mongoose = require('mongoose');
const request = require('supertest');

const setup = require('./setup');
const vendorFactory = require('./factories/vendor');
const tokenFactory = require('./factories/token');

let vendor, token;

beforeAll(async () => {
  await setup(global.mongoUrl);
  vendor = await vendorFactory();
  token = tokenFactory(vendor);
});

describe('VENDOR', () => {
  test('invalid token', async () => {
    const response = await request(global.expressApp)
      .get('/private/vendors/self')
      .set('Authorization', `Bearer something`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(401);
  });

  test('invalid object ID for JWT', async () => {
    const newToken = tokenFactory({ _id: 'test' })
    const response = await request(global.expressApp)
      .get('/private/vendors/self')
      .set('Authorization', `Bearer ${newToken}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(401);
  });

  test('get vendor by ID', async () => {
    const response = await request(global.expressApp)
      .get('/private/vendors/self')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe(vendor.name);
    expect(response.body.publicKey).toBeUndefined();
  });

  test('Update vendor info', async () => {
    const response = await request(global.expressApp)
      .put('/private/vendors/self')
      .send({ name: 'tran thanh dat' })
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('tran thanh dat');
  });
});
