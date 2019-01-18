const express = require('express');

const authMiddleware = require('../utils/authMiddleware');

const authRouter = require('./auth');
const publicRouter = require('./public');
const vendorRouter = require('./vendor');
const coopRouter = require('./coop');
const filterRouter = require('./filterRule');

const router = express.Router();

router.use('/public/vendors', authRouter);
router.use('/public/vendors', publicRouter);
router.use('/private/vendors', authMiddleware, vendorRouter);
router.use('/private/coops', authMiddleware, coopRouter);
router.use('/public/rules-engine', filterRouter);

module.exports = router;
