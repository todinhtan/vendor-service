const app = require('./app');
const config = require('config');
const logger = require('log4js').getLogger();

const mongoUrl = config.get('mongoUrl');

(async () => {
  const express = await app.init(mongoUrl);
  express.listen(9999, () =>
    logger.info('vendor service listening on port 9999...'));
})();
