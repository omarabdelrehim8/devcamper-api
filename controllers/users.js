const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const User = require("../models/User");

// ONLY ACCESSIBLE TO ADMINS

// @desc       Get all users
// @route      GET /api/v1/users
// @access     Private/Admin
exports.getUsers = asyncErrorHandler(async (req, res, next) => {
  res.status(200).send(res.advancedResults);
});

// @desc       Get single user
// @route      GET /api/v1/users/:id
// @access     Private/Admin
exports.getUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).send({
    success: true,
    data: user,
  });
});

// @desc       Create user
// @route      POST /api/v1/users
// @access     Private/Admin
exports.createUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).send({
    success: true,
    data: user,
  });
});

// @desc       Update user
// @route      PUT /api/v1/users/:id
// @access     Private/Admin
exports.updateUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).send({
    success: true,
    data: user,
  });
});

// @desc       Delete user
// @route      DELETE /api/v1/users/:id
// @access     Private/Admin
exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).send({
    success: true,
    data: {},
  });
});
