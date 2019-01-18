const Vendor = require('../../models/Vendor');
const { publicKey } = require('./keys');

const vendor = async (params) => {
  const defaultParams = {
    email: 'test1312@example.com',
    websites: ['http://test.com'],
    name: 'dat',
    publicKey,
  };

  const newParams = {
    ...defaultParams,
    ...params,
  };

  const newVendor = await Vendor.create(newParams);
  return newVendor;
};

module.exports = vendor;
