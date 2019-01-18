const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

const { Schema } = mongoose;
const array = { type: Array, default: [] };

const vendorSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, 'invalid email'],
    },
    websites: array,
    publicKey: { type: String, required: true },
    // legal_name: { type: String, required: true },
    // description: { type: String, required: true },
    get_in_touch: {
      email: String,
      website: String,
      sms: { type: String },
      phone: String,
      address: String, // todo refine the details here!
    },
    //   contacts: array,
    industry: String,
    accessId: String,
    addresses: array,
    active: Boolean,
    agency_code: array,
    qr_code: array,
    actionMethods: array,
    created_at: Date,
    updated_at: Date,
    coopIds: array,
  },
  { strict: false },
);

vendorSchema.pre('save', (next) => {
  // get the current date
  const currentDate = new Date();

  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at) this.created_at = currentDate;

  next();
});

vendorSchema.set('toJSON', {
  transform(doc, ret) {
    return _.omitBy(ret, (value, key) => ['publicKey', '__v'].includes(key));
  },
});

module.exports = mongoose.model('Vendor', vendorSchema, 'vendors');
