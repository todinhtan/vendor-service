const jwt = require('jsonwebtoken');
const { privateKey } = require('./keys');

const token = (vendor) => {
  const jwtToken = jwt.sign({ iss: vendor._id }, privateKey, {
    algorithm: 'RS256',
  });
  return jwtToken;
};

module.exports = token;
