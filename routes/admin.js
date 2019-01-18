const router = require('express').Router()
, Coop = require('../models/Coop')
, ObjectId = require('mongoose').Types.ObjectId
, { errorRes, successRes, errResult, notFound } = require('../utils/response')

router
.use(
	(req, res, next) => {
		Coop.findById(req.body._id, 'adminId -_id', (err, {adminId}) => {
			console.log('adminId', adminId)
			if (err)
				return errorRes(500, 'group does not exist', err, req, res)
			if (adminId !== req.user.vendorId)
				return errorRes(401, 'unauthorized', err, req, res)
			next()
		})
})
// every request below this will check if the group exist and the request owner has been authenticated as admin

// admin invite new vendor to the group
.post('/invite', (req, res) => {
	const { _id, vendorId, expiryDate } = req.body
	Coop.update(
		{ _id, 'members.vendorId': { $ne: vendorId } },
		{ $addToSet: { members: {vendorId, expiryDate} } },
		errResult('update failed', req, res)
	)
})

// admin response for vendor request to join
.post('/join_response', (req, res) => {
	const { _id, vendorId, response } = req.body
	if (response) {
		Coop.update(
			{ _id },
			{
				$pull: { requestToJoins: { vendorId } },
			  $addToSet: { members: { vendorId } }
			},
			errResult('unable to join, try again', req, res)
		)
	} else {
		Coop.update(
			{ _id },
			{
				$pull: { requestToJoins: { vendorId } },
			  $push: { rejectedToJoins: { vendorId } }
			},
			errResult('unable to update, try again', req, res)
		)
	}
})

// admin kick out vendor
.delete('/kick_out', (req, res) => {
	const { _id, vendorId } = req.body
	Coop.update(
		{ _id },
		{
			$pull: { members: { vendorId } },
			$push: { unjoined: { vendorId } }
		},
		errResult('unable to unjoin, try again', req, res)
	)
})

.use(notFound)

module.exports = router
