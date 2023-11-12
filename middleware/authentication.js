const jwt = require("jsonwebtoken");
const asyncErrorHandler = require("./asyncErrorHandler");
const customError = require("../utils/customError");
const User = require("../models/User");

// Protect routes
exports.protect = asyncErrorHandler(async (req, res, next) => {
  let token;

  // When a request is made by the client, for example to create a new bootcamp, in the req header we would include an authorization header with the created token which is preceded by the word "Bearer"
  // Check for the presence of auth header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // We're getting the token from the req auth header, we're removing the "Bearer" part
    token = req.headers.authorization.split(" ")[1];
  }

  // else if (req.cookies.token) {
  //   token = req.cookies.token
  // }

  // Make sure token exists
  if (!token) {
    return next(new customError("Not authorized to access this route", 401));
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log(decoded);

  // Whatever id is in that token which the user got by successfully logging in with correct credentials is going to be passed here
  req.user = await User.findById(decoded.id);

  next();
});
