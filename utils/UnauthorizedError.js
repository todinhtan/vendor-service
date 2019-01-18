const CustomError = require('./CustomError');

const UnauthorizedError = new CustomError(
  401,
  'You are not able to do this action.',
);

module.exports = UnauthorizedError;
