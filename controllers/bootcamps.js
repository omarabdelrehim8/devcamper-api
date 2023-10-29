const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const geocoder = require("../utils/geocoder");
const Bootcamp = require("../models/Bootcamp");

// These are the route handler callback functions for the bootcamps route

// @desc       Get all bootcamps
// @route      GET /api/v1/bootcamps
// @access     Public
exports.getBootcamps = asyncErrorHandler(async (req, res, next) => {
  const bootcamps = await Bootcamp.find();

  res
    .status(200)
    .send({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc       Get a single bootcamp
// @route      GET /api/v1/bootcamps/:id
// @access     Public
exports.getBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  // Fires off if the id format is right (right lenght etc.) but no bootcamp was found in the database
  if (!bootcamp) {
    // We use next() to pass the created error instance to the errorHandler. That's because when we pass any argument to next(), Express handles that argument as an error object so it will automatically ignore other middleware functions and pass that error to the errorHandler middleware.
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).send({ success: true, data: bootcamp });
});

// @desc       Create a new bootcamp
// @route      POST /api/v1/bootcamps
// @access     Private
exports.createBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).send({ success: true, data: bootcamp });
});

// @desc       Update a bootcamp
// @route      PUT /api/v1/bootcamps/:id
// @access     Private
exports.updateBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!bootcamp) {
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).send({ success: true, data: bootcamp });
});

// @desc       Delete a bootcamp
// @route      DELETE /api/v1/bootcamps/:id
// @access     Private
exports.deleteBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

  if (!bootcamp) {
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).send({ success: true, data: {} });
});

// @desc       Get bootcamps within a radius
// @route      GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access     Private
exports.getBootcampsInRadius = asyncErrorHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});
