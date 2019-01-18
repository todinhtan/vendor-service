const router = require('express').Router();

const Vendor = require('../models/Vendor');
const { responseSuccess, responseError } = require('../utils/response');
const CustomError = require('../utils/CustomError');

const signUp = async (req, res) => {
  const { email } = req.body;
  try {
    const existedVendor = await Vendor.findOne({ email }, '_id');
    if (existedVendor) {
      throw new CustomError(400, 'Email already taken');
    }

    const data = {
      ...req.body,
    };

    const newVendor = new Vendor(data);
    await newVendor.save();

    return responseSuccess(201, { _id: newVendor._id }, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const getPublicKey = async (req, res) => {
  const { _id } = req.params;
  try {
    const vendor = await Vendor.findById(_id);
    if (!vendor) {
      throw new CustomError(400, 'Vendor not found');
    }

    return responseSuccess(200, { publicKey: vendor.publicKey }, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

router
  .post('/', signUp)
  .get('/:_id/public-key', getPublicKey);

module.exports = router;
