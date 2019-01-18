const _ = require('lodash');
const mongoose = require('mongoose');
const { COOP_STATUSES } = require('../constants/enums');

const { Schema } = mongoose;
const array = { type: Array, default: [] };

const coopSchema = new Schema({
  adminId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  groupType: { type: String, enum: ['uni', 'multi'], default: 'multi' },
  photoUrls: array,
  memberIds: array,
  requestToJoins: array,
  invitations: array,
  unjoined: array,
  rejectedToJoins: array,
  rejectedToInvitations: array,
  created_at: Date,
  updated_at: Date,
  status: {
    type: String,
    enum: _.map(COOP_STATUSES),
    default: COOP_STATUSES.available,
  },
});

coopSchema.pre('save', (next) => {
  // get the current date
  const currentDate = new Date();

  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at) this.created_at = currentDate;

  next();
});

module.exports = mongoose.model('Coop', coopSchema, 'coops');
