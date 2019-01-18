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

describe('PUBLIC', () => {
  test('get owner ID by website URL', async () => {
    const response = await request(global.expressApp)
      .get('/public/vendors/by-url?url=http://test.com')
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toEqual(vendor._id.toString());
  });
});
