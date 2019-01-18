const { MongoMemoryServer } = require('mongodb-memory-server'); // eslint-disable-line
const NodeEnvironment = require('jest-environment-node');

const app = require('./app');

class CustomTestEnvironment extends NodeEnvironment {
  async setup() {
    this.global.mongod = new MongoMemoryServer();
    const uri = await this.global.mongod.getConnectionString();
    this.global.mongoUrl = uri;
    this.global.expressApp = await app.init(uri);
    await super.setup();
  }

  async teardown() {
    await this.global.mongod.stop();
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = CustomTestEnvironment;
