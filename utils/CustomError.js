function CustomError(code, message) {
  this.name = 'CustomError';
  this.message = message;
  this.custom_code = code;
}

CustomError.prototype = Error.prototype;

module.exports = CustomError;
