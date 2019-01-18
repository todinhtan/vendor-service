const _ = require('lodash');
const logger = require('log4js').getLogger();

const KNOWN_ERRORS = ['ValidationError', 'UnauthorizedError', 'CustomError', 'InvalidInput'];

function validationError(err, req, res) {
  const errors = _.mapValues(err.errors, error => error.message);
  const error = 'Validation Error';
  res.status(422).json({ error, errors });
}

function errorRes(statusCode, mes, err, req, res) {
  if (err && !KNOWN_ERRORS.includes(err.name)) {
    logger.error('ERROR:', err);
  }

  if (err && err.name === 'ValidationError') {
    return validationError(err, req, res);
  }
  // res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).end(JSON.stringify({ error: mes }));
}

function responseSuccess(statusCode, data, res) {
  return res.status(statusCode).json(data);
}

function responseError(err, req, res) {
  if (err && !KNOWN_ERRORS.includes(err.name)) {
    logger.error('ERROR:', err);
  }

  if (err && err.name === 'ValidationError') {
    return validationError(err, req, res);
  }

  if (err && err.name === 'CustomError') {
    return res
      .status(err.custom_code)
      .json({ status: 'failed', error: err.message });
  }

  return res
    .status(500)
    .json({ status: 'failed', error: 'Server error. Please try again later.' });
}

function notFound(req, res) {
  return errorRes(404, 'you are lost.', 'no routes', req, res);
}

function invalidInput(err, req, res) {
    return errorRes(400, err.message || 'Invalid Input', err.message, req, res);
}

module.exports = {
  notFound,
  responseError,
  responseSuccess,
  invalidInput
};
