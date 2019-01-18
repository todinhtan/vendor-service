
const mongoose = require('mongoose');
const { Schema } = mongoose;

var schema = new Schema({
    created_at: Date,
    updated_at: Date
}, { strict: false });

schema.pre('save', (next) => {
    // get the current date
    const currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    // if (!this.created_at) this.created_at = currentDate;
    this.created_at = currentDate;

    next();
});

schema.pre('update', (next) => {
    // get the current date
    const currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at) this.created_at = currentDate;

    next();
});


const UserIndexMap = mongoose.model('UserIndexMap', schema, 'user_index_map');
const UserInfoMap = mongoose.model('UserInfoMap', schema, 'user_info_map');
const ServiceIndexMap = mongoose.model('ServiceIndexMap', schema, 'service_index_map');
const UserBookingCount = mongoose.model('UserBookingCount', schema, 'user_booking_count');
const ServiceInfoMap = mongoose.model('ServiceInfoMap', schema, 'service_info_map');
const CategoryMap = mongoose.model('CategoryMap', schema, 'category_map');
const UserServiceRating = mongoose.model('UserServiceRating', schema, 'user_service_rating');
const users = mongoose.model('users', schema, 'users');
const services = mongoose.model('services', schema, 'services');
const campaigns = mongoose.model('campaigns', schema, 'campaigns');
const bookings = mongoose.model('bookings', schema, 'bookings');
const categories = mongoose.model('categories', schema, 'categories');
const reviews = mongoose.model('reviews', schema, 'reviews');
const TSMCards = mongoose.model('TSMCards', schema, 'tsm_cards');
module.exports = { UserIndexMap, UserInfoMap, UserBookingCount,
    ServiceIndexMap, ServiceInfoMap, CategoryMap, UserServiceRating
    , users, services, campaigns, bookings, categories, reviews, TSMCards};
