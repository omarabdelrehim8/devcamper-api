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
    // Using populate() we add all the data of the bootcamp in the response, otherwise we will only get the ID. We can use populate("bootcamp") to get all data or use it like below to only get specific fields
    query = Course.find({ bootcamp: req.params.bootcampId }).populate({
      path: "bootcamp",
      select: "name description",
    });
  } else {
    query = Course.find().populate({
      path: "bootcamp",
      select: "name description",
    });
  }

  const courses = await query;

  res.status(200).send({ success: true, count: courses.length, data: courses });
});
