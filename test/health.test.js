const mongoose = require('mongoose');
const request = require('supertest');
const { Mockgoose } = require('mockgoose');

const app = require('../app');
const mockgoose = new Mockgoose(mongoose);

describe('HEALTH', () => {
  test('Health return 200', async () => {
    const response = await request(global.expressApp).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
