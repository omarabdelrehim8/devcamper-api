const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const Course = require("../models/Course");

// @desc       Get all courses / Get all courses of a specific bootcamp
// @route      GET /api/v1/courses
// @route      GET /api/v1/bootcamps/:bootcampId/courses
// @access     Public
exports.getCourses = asyncErrorHandler(async (req, res, next) => {
  let query;

  if (req.params.bootcampId) {
    query = Course.find({ bootcamp: req.params.bootcampId });
  } else {
    query = Course.find();
  }

  const courses = await query;

  res.status(200).send({ success: true, count: courses.length, data: courses });
});
