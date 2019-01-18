const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Vendor = require('../models/Vendor');
const UnauthorizedError = require('../utils/UnauthorizedError');
const { responseError } = require('../utils/response');

const secKey = 'Lorem31415926535897932384626433832795028PI84197169399375105820974944592307816406286';

const authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization || '';
    const prefix = auth.indexOf('Bearer') > -1 ? 'Bearer ' : 'NogNog ';
    const token = auth.split(prefix)[1];
  if (token) {
    const data = jwt.decode(token);
    if (data) {
      let { iss: vendorId } = data;
      let matched = false;
      let vendor = null;
      if (vendorId.length < 13) {
          vendor = await Vendor.findOne({accessId: vendorId}, '_id publicKey');
      } else {
          vendor = await Vendor.findById(vendorId); // can be cached here
      }
      if (vendor !== null) {
          try {
              vendorId = vendor.toObject()['_id'].toString();
              if(prefix === 'Bearer ') {
                  const {publicKey} = vendor;
                  matched = jwt.verify(token, "-----BEGIN PUBLIC KEY-----\n" + publicKey + "\n-----END PUBLIC KEY-----", {
                      algorithms: ['RS256'],
                  });
              } else {
                  matched = jwt.verify(token, secKey);
              }
              if (matched) {
                  req.user = { vendorId };
                  return next();
              }
          }
          catch (e) {
              console.log(e);
              return next(e);
          }
          finally {
              // always runs
          }
      } else {
          return next(new Error("vendor does not exists"));
      }
    }
  }

  return responseError(UnauthorizedError, req, res);
};

module.exports = authMiddleware;
