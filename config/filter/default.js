const { FILTER_TYPES } = require('../../constants/enums');

module.exports = {
  filters: {
    filterTypes: [FILTER_TYPES.act, FILTER_TYPES.noAct],
    act: { resetPeriod: 60 },
    noAct: { days: 30, resetPeriod: 90 },
  },
};
