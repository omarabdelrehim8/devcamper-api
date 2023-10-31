// This middleware is a function that has the goal of catching the errors that have occured in async functions so that we don't have to use a try...catch statement in every route handler callbacks, like the ones in the controllers files. So it will catch the error and pass it to the error handler middleware.

const asyncErrorHandler = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch((err) => next(err));
  };
};

module.exports = asyncErrorHandler;

// Or we can simply install the npm package "express-async-handler" and use that instead of creating our own asyncErrorHandler function
