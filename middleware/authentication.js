const jwt = require("jsonwebtoken");
const asyncErrorHandler = require("./asyncErrorHandler");
const customError = require("../utils/customError");
const User = require("../models/User");

// Protect routes
exports.protect = asyncErrorHandler(async (req, res, next) => {
  let token;

  // When a request is made by the client, for example to create a new bootcamp, in the req header we would include an authorization header with the created token which is preceded by the word "Bearer"
  // Check for the presence of authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header.
    // We're getting the token from the req auth header, we're removing the "Bearer" part
    token = req.headers.authorization.split(" ")[1];

    // Set token from cookie.
    // If it is not in the header, check the cookies.
  } // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(new customError("Not authorized to access this route", 401));
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Whatever id is in that token which the user got by successfully logging in with correct credentials is going to be passed here
  req.user = await User.findById(decoded.id);

  next();
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  // roles will be a variable containing an array of values that we pass in the function
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new customError(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
