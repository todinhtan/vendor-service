const router = require('express').Router();
const { createLogger, format, transports } = require('winston');
const defaultFilter = require('../config/filter/default');
const Vendor = require('../models/Vendor');
const _ = require('lodash');
const { FILTER_TYPES } = require('../constants/enums');

const { combine, timestamp, prettyPrint } = format;
const logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint(),
  ),
  transports: [new transports.Console()],
});

const getFilterRules = async (req, res) => {
  const { vendorId } = req.params;
  const vendor = await Vendor.findOne({ accessId: vendorId })
    .catch(err => logger.error(err));
  if (vendor) {
    const doc = vendor._doc.filters ? vendor : {
      ...vendor._doc,
      filters: defaultFilter.filters,
    };
    return res.json(doc).end();
  }
  return res.status(404).send(`No vendor found by ${vendorId}`).end();
};

const updateFilterRules = async (req, res) => {
  const { vendorId } = req.params;
  const { filters } = req.body;
  // perform validation
  if (_.isObject(filters)) {
    if (_.isArray(filters.filterTypes)) {
      // only accept filterTypes in enum
      filters.filterTypes = filters.filterTypes.filter(t =>
        Object.keys(FILTER_TYPES).map(ft => FILTER_TYPES[ft]).includes(t));

      // filterTypes must not be empty
      if (filters.filterTypes.length === 0) return res.status(400).send('Invalid filterTypes').end();

      // checking config object for each type
      const errors = filters.filterTypes.filter(t => !_.isObject(filters[t]))
        .map(t => `Config object for type ${t} is missing`);

      // throw errors
      if (errors.length) return res.status(400).json({ errors }).end();

      const vendor = await Vendor.findOneAndUpdate({ accessId: vendorId }, { $set: { filters } }, { new: true })
        .catch(err => logger.error(err));
      return vendor ? res.json(vendor).end() :
        res.status(404).send(`No vendor found by ${vendorId}`).end();
    }
    return res.status(400).send('filterTypes must be an array').end();
  }
  return res.status(400).send('filters must be an object').end();
};

router
  .get('/:vendorId/filters', getFilterRules)
  .post('/:vendorId/filters', updateFilterRules);

module.exports = router;
