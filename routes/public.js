const router = require('express').Router();
const logger = require('log4js').getLogger();
const rp = require('request-promise');
const config = require('config');

const Item = require('../models/Item');
const Vendor = require('../models/Vendor');
const { responseSuccess, responseError } = require('../utils/response');

const scrapeUrl = config.get('scrapeUrl');

const getVendorByUrl = async (req, res) => {
  try {
    const { url } = req.query;
    const vendor = await Vendor.findOne({ websites: url }, '_id');
    return responseSuccess(200, vendor, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const scrape = async (req, res) => {
  const { images_summarization: imageSummary, ...newBody } = req.body;
  const data = {
    channels: ['web'],
    imageSummary,
    ...newBody,
  };
  logger.debug('data', JSON.stringify(data, null, 2));

  try {
    const item = await Item.update({ uri: req.body.uri }, data, {
      upsert: true,
    });

    const options = {
      method: 'POST',
      uri: scrapeUrl,
      body: data,
      json: true,
    };
    const response = await rp(options);
    logger.debug('data', response);

    return responseSuccess(200, item, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

router.get('/by-url', getVendorByUrl).post('/scrape', scrape);

module.exports = router;
