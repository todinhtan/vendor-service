const Coop = require('../../models/Coop');
const Vendor = require('../../models/Vendor');

const coop = async (vendor, params) => {
  const defaultParams = {
    name: 'test group',
    description: 'just a group',
    adminId: vendor._id.toString(),
    memberIds: [vendor._id.toString()],
  };

  const newParams = {
    ...defaultParams,
    ...params,
  };

  const newCoop = await Coop.create(newParams);
  await Vendor.findByIdAndUpdate(vendor._id, {
    $addToSet: { coopIds: newCoop._id.toString() },
  });
  return newCoop;
};

module.exports = coop;
