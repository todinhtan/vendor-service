const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const config = require('config');
const path = require('path');
const cors = require('cors');
const logger = require('log4js').getLogger();
const busBoy = require('connect-busboy');

const router = require('./routes');
const { notFound } = require('./utils/response');

const logLevel = config.get('logLevel');

logger.level = logLevel;

const init = mongoUrl => new Promise((resolve, reject) => {
  mongoose.connect(mongoUrl);
  const app = express();
  app
    .use(cors())
    .use(busBoy())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json())
    .use(express.static(path.join(__dirname, 'public')))
    .get('/health', (req, res) => res.status(200).json({ status: 'ok' }))
    .use(router)
    .use(notFound);

  mongoose.connection.on('connected', (error) => {
    if (error) {
      reject(error);
    } else {
      resolve(app);
    }
  });
});

module.exports = { init };
