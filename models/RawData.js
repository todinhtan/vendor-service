
const mongoose = require('mongoose');
const { Schema } = mongoose;

var rawSchema = new Schema({
        created_at: Date,
        updated_at: Date
    }, { strict: false });

rawSchema.pre('save', (next) => {
    // get the current date
    const currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at) this.created_at = currentDate;

    next();
});

module.exports = mongoose.model('RawData', rawSchema, 'rawData');
