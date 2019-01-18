const request = require('supertest');
const mongoose = require('mongoose');
const setup = require('./setup');
const vendorFactory = require('./factories/vendor');
const { publicKey } = require('./factories/keys');

beforeAll(async () => {
  await setup(global.mongoUrl);
});

describe('AUTH', () => {
  test('sign up - fail validation', async () => {
    const response = await request(global.expressApp)
      .post('/public/vendors')
      .send({
        email: 'test'
      })
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(422);
    expect(response.body.errors.name).toBeDefined();
    expect(response.body.errors.email).toBeDefined();
    expect(response.body.errors.publicKey).toBeDefined();
  });

  test('sign up - success', async () => {
    const response = await request(global.expressApp)
      .post('/public/vendors')
      .send({
        email: 'test@example.com',
        websites: [ 'http://test.com' ],
        name: 'dat',
        publicKey
      })
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(201);
    expect(response.body._id).toBeDefined();
  });

  test('get public key - not found', async () => {
    const id = new mongoose.Types.ObjectId();
    const response = await request(global.expressApp)
      .get(`/public/vendors/${id}/public-key`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(400);
  });

  test('get public key - success', async () => {
    const someVendor = await vendorFactory({ email: 'test@auth-vendor.com' });
    const response = await request(global.expressApp)
      .get(`/public/vendors/${someVendor._id}/public-key`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.publicKey).toBe(publicKey);
  });
});
