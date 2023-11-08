const path = require("path");
const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const geocoder = require("../utils/geocoder");
const Bootcamp = require("../models/Bootcamp");

// These are the route handler callback functions for the bootcamps route

// @desc       Get all bootcamps
// @route      GET /api/v1/bootcamps
// @access     Public
exports.getBootcamps = asyncErrorHandler(async (req, res, next) => {
  res.status(200).send(res.advancedResults);
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
  // We can't use findByIdAndDelete() because it won't trigger the Cascade delete middleware in the Bootcamp model, so we just find the bootcamp by using findById() and then call bootcamp.deleteOne(), this will ensure that all courses pertaining to the bootcamp are deleted before the deletion of the bootcamp itself
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  bootcamp.deleteOne();

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

// @desc       Upload photo for bootcamp
// @route      PUT /api/v1/bootcamps/:id/photo
// @access     Private
exports.bootcampPhotoUpload = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  if (!req.files) {
    return next(new customError(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Validation: Make sure that image is a photo
  if (!file.mimetype.startsWith("image")) {
    return next(new customError(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new customError(
        `Please upload an image file that is less than ${Math.ceil(
          process.env.MAX_FILE_UPLOAD / 1024 / 1024
        )} MB`,
        400
      )
    );
  }

  // Create custom filename. We do this because we want unique names for each photo, that's because the image that the client sends will be saved inside of a specific directory and if they, or another client, send another image with the same name then the one already in the directory will be overwritten. ${path.parse(file.name).ext} is to get the extension so .png, .jpg etc.
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  // Upload the file
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new customError(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).send({ success: true, data: file.name });
  });
});
