const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");

// @desc       Get all courses / Get all courses of a specific bootcamp
// @route      GET /api/v1/courses
// @route      GET /api/v1/bootcamps/:bootcampId/courses
// @access     Public
exports.getCourses = asyncErrorHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    // Using populate() we add all the data of the bootcamp in the response, otherwise we will only get the ID. We can use populate("bootcamp") to get all data or use it like below to only get specific fields
    const courses = await Course.find({
      bootcamp: req.params.bootcampId,
    });

    return res
      .status(200)
      .send({ success: true, count: courses.length, data: courses });
  } else {
    res.status(200).send(res.advancedResults);
  }
});

// @desc       Get single courses
// @route      GET /api/v1/courses/:id
// @access     Public
exports.getCourse = asyncErrorHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(
      new customError(`No course with the id of ${req.params.id}`),
      404
    );
  }
  res.status(200).send({ success: true, data: course });
});

// @desc       Add course
// @route      POST /api/v1/bootcamps/:bootcampId/courses (We do this because every course is tied to a bootcamp so we have to go through the bootcamp ID to add a new course, basically we are adding a new course to a bootcamp)
// @access     Private (adding a new course is a private operation that only a logged in user should be able to do)
exports.addCourse = asyncErrorHandler(async (req, res, next) => {
  // In the req body we will get all the course fields we want to include in the new course. These fields are inputted by the user and are submitted to the Course model. Some fields though have to be added manually by us developers, like the "bootcamp" field in the Course model, which ties the course to a bootcamp through its ID.
  // The line of code below is adding the bootcampId that we are getting from the req to the "bootcamp" field in the Course model
  req.body.bootcamp = req.params.bootcampId;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new customError(`No bootcamp with the id of ${req.params.bootcampId}`),
      404
    );
  }

  const course = await Course.create(req.body);
  res.status(200).send({ success: true, data: course });
});

// @desc       Update course
// @route      PUT /api/v1/courses/:id
// @access     Private
exports.updateCourse = asyncErrorHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new customError(`No course with the id of ${req.params.id}`),
      404
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).send({ success: true, data: course });
});

// @desc       Delete course
// @route      DELETE /api/v1/courses/:id
// @access     Private
exports.deleteCourse = asyncErrorHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new customError(`No course with the id of ${req.params.id}`),
      404
    );
  }

  await course.deleteOne();
  res.status(200).send({ success: true, data: {} });
});
