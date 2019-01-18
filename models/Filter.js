
const mongoose = require('mongoose');
const { Schema } = mongoose;

var FilterSchema = new Schema({
    vendorId: String,
    action: String,
    resetPeriodInDay: {type: Number, default: 90},
    group: {enum: ["common", "custom"] ,type: String, default: "custom"},
    created_at: Date,
    updated_at: Date
});

FilterSchema.pre('save', (next) => {
    // get the current date
    const currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    // if (!this.created_at) this.created_at = currentDate;
    if (!this.created_at) this.created_at = currentDate;

    next();
});

FilterSchema.pre('update', (next) => {
    // get the current date
    const currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at) this.created_at = currentDate;

    next();
});


module.exports = mongoose.model('Filter', FilterSchema, 'filter');
