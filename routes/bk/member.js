// const router = require('express').Router(),
//   Coop = require('../models/Coop'),
//   {
//     errorRes, successRes, notFound, errResult,
//   } = require('../utils/response');
//
// router
//
//   .use((req, res, next) => {
//     const { _id } = req.body;
//     const { vendorId } = req.user;
//     // console.log('_id', _id)
//     Coop.findById(req.body._id, 'members -_id', (err, { members }) => {
//       if (err) return errorRes(500, 'group does not exist', err, req, res);
//
//       const membersVal = members.map(obj => obj.vendorId);
//       if (!membersVal.includes(vendorId)) { return errorRes(401, 'unauthorized', err, req, res); }
//       next();
//     });
//   })
//
//   .delete('/unjoin', (req, res) => {
//     const { _id } = req.body;
//     const { vendorId } = req.user;
//     return Coop.update(
//       { _id },
//       {
//         $pull: { members: { vendorId } },
//         $push: { unjoined: { vendorId } },
//       },
//       errResult('unable to unjoin, try again', req, res),
//     );
//   })
//
//   .use(notFound);
//
// module.exports = router;
