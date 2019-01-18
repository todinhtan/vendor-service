const mongoose = require('mongoose');
const { Schema } = mongoose;
const array = { type: Array, default: [] };

const itemSchema = new Schema({
  ownerId: String,
  vendorKey: String,
  vendorId: String,
  images_summarization: String,
  imageSummary: String,
  dealType: String,
  title: String,
  imageUri: String,
  uri: { type: String, unique: true },
  agencyCode: String,
  launchDate: Date,
  duration: Number,
  // location: Location,
  description: String,
  specialFeatures: [
    {
      category: String,
      subcategory: {
        name: String,
        description: String,
      },
    },
  ],
  product: {
    category: String,
    description: String,
    imageUrl: String,
    vendorId: String,
  },
  // stats: {// todo this data is for recsys
  //   interested: 3,
  //   shared: 3
  // },
  establishmentType: String,
  callToAction: array,
  // acceptActionMethods: array,
  channels: array,
  created_at: Date,
  updated_at: Date,
});

itemSchema.pre('save', (next) => {
  // get the current date
  const currentDate = new Date();

  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at) this.created_at = currentDate;

  next();
});

itemSchema.pre('update', (next) => {
  // get the current date
  const currentDate = new Date();

  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at) this.created_at = currentDate;

  next();
});

module.exports = mongoose.model('Item', itemSchema, 'items');
