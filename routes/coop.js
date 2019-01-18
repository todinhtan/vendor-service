const router = require('express').Router();
const Coop = require('../models/Coop');
const Vendor = require('../models/Vendor');

const { responseError, responseSuccess } = require('../utils/response');
const CustomError = require('../utils/CustomError');
const UnauthorizedError = require('../utils/UnauthorizedError');

const createCoop = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { vendorId } = req.user;
    const newCoop = Coop({
      adminId: vendorId,
      memberIds: [vendorId],
      name,
      description,
    });
    await newCoop.save();
    await Vendor.findByIdAndUpdate(vendorId, {
      $addToSet: { coopIds: newCoop._id.toString() },
    });

    return responseSuccess(200, newCoop, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const getCoop = async (req, res) => {
  try {
    const { _id } = req.params;
    const coop = await Coop.findById(
      _id,
      'name adminId description memberIds status',
    );
    return responseSuccess(200, coop, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const getCoops = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const vendor = await Vendor.findById(vendorId, 'coopIds');
    const coop = await Coop.find(
      { _id: vendor.coopIds },
      'name adminId description memberIds status',
    );
    return responseSuccess(200, coop, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const invite = async (req, res) => {
  try {
    const { vendorId: currentVendorId } = req.user;
    const { _id } = req.params;
    let { vendorId } = req.body;
    if (vendorId.length < 13) {
        const vendor = await Vendor.findOne({accessId: vendorId}, '_id');
        vendorId = vendor.toObject()['_id'].toString();
    }
    const coop = await Coop.findById(_id);

    if (!coop || coop.adminId !== currentVendorId) {
      throw UnauthorizedError;
    }

    if (coop.memberIds.indexOf(vendorId) > -1) {
      throw new CustomError(400, 'Vendor is already a member.');
    }
    await coop.update({ $addToSet: { invitations: vendorId } });
    return responseSuccess(201, { message: 'Invitation success.' }, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const joinThroughInvite = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const { _id } = req.params;
    const coop = await Coop.findById(_id);

    if (!coop) {
      throw new CustomError(400, 'No coop found.');
    }

    if (coop.invitations.indexOf(vendorId) < 0) {
      throw new CustomError(400, 'You are not invited.');
    }

    await coop.update({
      $pull: { invitations: vendorId },
      $addToSet: { memberIds: vendorId },
    });

    return responseSuccess(200, { message: 'Join success.' }, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const kickOut = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const { _id, memberId } = req.params;
    const coop = await Coop.findById(_id);

    if (!coop) {
      throw new CustomError(400, 'No coop found.');
    }

    if (!coop || coop.adminId !== vendorId) {
      throw UnauthorizedError;
    }

    if (coop.memberIds.indexOf(memberId) < 0) {
      throw new CustomError(400, 'Not a member.');
    }

    await coop.update({
      $pull: { memberIds: memberId },
    });

    return responseSuccess(200, { message: 'Kick member out success.' }, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const leaveCoop = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const { _id } = req.params;
    const coop = await Coop.findById(_id);

    if (!coop) {
      throw new CustomError(400, 'No coop found.');
    }

    if (coop.memberIds.indexOf(vendorId) < 0) {
      throw new CustomError(400, 'Not a member.');
    }

    await coop.update({
      $pull: { memberIds: vendorId.toString() },
    });

    return responseSuccess(200, { message: 'Leave group success.' }, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const getlistMember = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const { _id } = req.params;
    const coop = await Coop.findById(_id);

    if (!coop || coop.memberIds.indexOf(vendorId) < 0) {
      throw UnauthorizedError;
    }

    const members = await Vendor.find({ _id: coop.memberIds });

    return responseSuccess(200, members, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

const getMemberDetail = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const { _id, memberId } = req.params;
    const coop = await Coop.findById(_id);

    if (!coop || coop.memberIds.indexOf(vendorId) < 0) {
      throw UnauthorizedError;
    }

    if (coop.memberIds.indexOf(memberId) < 0) {
      throw new CustomError(400, 'Not a member.');
    }

    const member = await Vendor.findById(memberId);
    return responseSuccess(200, member, res);
  } catch (err) {
    return responseError(err, req, res);
  }
};

router
  .post('/', createCoop)
  .get('/', getCoops)
  .get('/:_id', getCoop)
  .post('/:_id/invite', invite)
  .post('/:_id/join', joinThroughInvite)
  .get('/:_id/members', getlistMember)
  .get('/:_id/members/:memberId', getMemberDetail)
  .delete('/:_id/members/self', leaveCoop)
  .delete('/:_id/members/:memberId', kickOut);

module.exports = router;
