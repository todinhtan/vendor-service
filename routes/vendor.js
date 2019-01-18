const router = require('express').Router();
const Vendor = require('../models/Vendor');
const Filter = require('../models/Filter');
const Coop = require('../models/Coop');
const { responseError, responseSuccess, invalidInput } = require('../utils/response');
const { fileTypeHandler, batchController } = require('../controllers/FileController');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const logger = createLogger({
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    transports: [new transports.Console()]
})

const getVendorById = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const vendor = await Vendor.findById(vendorId);
    return responseSuccess(200, vendor, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const updateVendorInfo = async (req, res) => {
  try {
    const { password, ...data } = req.body;
    const { vendorId } = req.user;
    const newVendor = await Vendor.findByIdAndUpdate(vendorId, data, {
      new: true,
    });
    return responseSuccess(200, newVendor, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};
const refactoredUploadBatchFile = (req, res) => {
    try {
        const { vendorId } = req.user;
        // const vendorId = '5bd670b7be86500af44b14a0';
        req.pipe(req.busboy);
        batchController(req.busboy, (file, type, name) => {
            logger.log({level: 'info', message: 'batching file', name});
            fileTypeHandler(file, type, name, vendorId).onError(() => invalidInput({message: 'invalid json format'},req,res))
                .toJson().onError(() => console.log("fine"))
                .produceKafkaWithKey().lastHandler(() => {
                responseSuccess(200, {message: "upload users batch successfully"}, res)
            }, err => {
                responseError(err, req, res);
            });
        });
    } catch (err) {
        return responseError(err, req, res)
    }
};

const getRecConf = async (req, res) => {
	try {
        const { vendorId } = req.user;
        const { cross } = req.query;
        let members = [];
        if (cross !== undefined) {
            const coops = await Coop.find({ memberIds : { "$in": [vendorId] } }, 'memberIds groupType'); // Get all members in all groups that vendor belong to
            coops.forEach(coop => {
                console.log({coop});
                const oCoop = coop.toObject();
                if (oCoop['groupType'] === 'multi') {
                    members = Array.from(new Set([...members, ...oCoop['memberIds']])); // [members, ...gm]
                }
            });
            members.splice(members.indexOf(vendorId),1);
        }

        const vendor = await Vendor.findById(vendorId);
        const commonFilters = await Filter.find({vendorId:"all", group: "common"});
        const filters = await Filter.find({vendorId, group: "custom"});
        const customFilters = filters.map(f => f.toObject());
        await commonFilters.map(f => f.toObject()).forEach(f => {
            const cf = customFilters.find(e => f.action === e.action);
            if (cf === undefined) {
                customFilters.push(f);
            }

        });
        return responseSuccess(200, {...vendor.toObject(), filters:customFilters, members}, res);

	} catch (err) {
        return responseError(err, req, res);
	}
};

const addFilters = async (req, res) => {
    try {
        const commonActions = ['visited', 'click'];
        const { vendorId } = req.user;
        // const vendorId = "testFilter";
        let { filters } = req.body;
        /*
        filters : [{ action:visited, resetPeriod: 60 }]
         */
        console.log({filters});
        await filters.forEach( async f => {
            const {action, resetPeriod: resetPeriodInDay} = f;
            console.log(resetPeriodInDay);
            const data = resetPeriodInDay ? {action, resetPeriodInDay, vendorId} : {action, vendorId};
            await Filter.findOneAndUpdate({vendorId, action}, data, {upsert:true, setDefaultsOnInsert:true});
            // const record = new Filter(data);
            // record.save();
        });
        return responseSuccess(200, {filters}, res);
    } catch (err) {
        return responseError(err, req, res);
    }
};

router
  .get('/self', getVendorById)
  .put('/self', updateVendorInfo)
  .get('/self/recommendation', getRecConf) // TODO: let change the name of endpoint
  .post('/self/filters', addFilters) // TODO: let change the name of endpoint
  .post('/self/batches', refactoredUploadBatchFile);

module.exports = router;
