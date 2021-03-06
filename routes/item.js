const router = require('express').Router()
, Item = require('../models/Item')
, Coop = require('../models/Coop')
, mongoose = require('mongoose')
, { errorRes, successRes, notFound, errResult } = require('../utils/response')

router
// get all item from vendor
.get('/all_from_vendor', (req, res) => {
	const {vendorId} = req.user
	return Item.find({ vendorId }, errResult('cannot find items', req, res))
})

// get all items from vendor belongs groups
.get('/all_vendors_items_from_groups', (req, res) => {
	const {vendorId} = req.user
	return Coop.find({members: vendorId}, "members -_id", (err, data) => {
		const allMembers = Array.from(
			new Set( // get unrepeated members array
				data.map(d => d.members).reduce((a,b) => a.concat(b))
			)
		)
		Item.find(
			{ vendorId: {$in: allMembers} }, 
			errResult('unable to get all item from all coop group', req, res)
		)
	})
})

// get single item
.get('/:_id', (req, res) => {
	const {vendorId} = req.user
	const {_id} = req.params
	return Item.findOne({vendorId, _id}, errResult('cannot find item', req, res))
})

// add new item
.post('/add', (req, res) => {
	const {vendorId} = req.user
	const newItem = new Item({
		_id: new mongoose.Types.ObjectId(), 
		vendorId, 
		...req.body
	})
	return newItem.save(
		errResult('unable to add item, try again', req, res)
	)
})

// update item
.put('/', (req, res) => {
	const {_id, vendorId} = req.user
	return Item.update({_id, vendorId}, req.body, {multi: false},
		errResult('unable to update, try again', req, res)
	)
})

// delete item
.delete('/:_id', (req, res) => {
	const {vendorId} = req.user
	return Item.update({_id, vendorId}, {active: false}, {multi: false},
		errResult('unable to delete, try again', req, res)
	)
})

.use(notFound)

module.exports = router
