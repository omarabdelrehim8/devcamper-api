const customError = require("../utils/customError");

const errorHandler = (err, req, res, next) => {
  // err will be equal to the error istance (argument of next()) passed by next() in the controllers files

  // Log to console for dev
  console.log(err);

  // The error passed in the next() inside of the if statement, in the controllers files, already has a message and a statusCode set, so it will be directly passed to line 33. The error passed through the next() in the catch statement or, in our case, caught by the asyncErrorHandler, can be due to multiple causes caused by user interaction so we have to test which kind of error it is and then give it a custom message and a status code, that's what the error = {} is for, to declare a variable used to build the custom error.
  let error = {};

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    const statusCode = 404;
    error = new customError(message, statusCode);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Duplicate field value entered`;
    const statusCode = 400;
    error = new customError(message, statusCode);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((value) => value.message);
    const statusCode = 400;
    error = new customError(message, statusCode);
  }

  res.status(error.statusCode || err.statusCode || 500).send({
    success: false,
    error: error.message || err.message || "Server Error",
  });
};

module.exports = errorHandler;
