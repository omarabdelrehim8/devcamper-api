const crypto = require("crypto");
const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

// @desc       Register user
// @route      POST /api/v1/auth/register
// @access     Public
exports.register = asyncErrorHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

// @desc       Login user
// @route      POST /api/v1/auth/login
// @access     Public
exports.login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new customError("Please provide an email and a password", 400));
  }

  // Check for user
  // We want the password to be included when we find the user because we need to validate it for login but in the model we set select: false, so we add select("+password") to bypass that
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new customError("Invalid credentials", 401));
  }

  // Check if password matches
  // the result is going to be true or false
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new customError("Invalid credentials", 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc       Get current logged in user
// @route      GET /api/v1/auth/me
// @access     Private
exports.getMe = asyncErrorHandler(async (req, res, next) => {
  // Since we apply the protect middleware to the getMe route, we will have access to req.user inside of the req object which gives us the current logged in user
  const user = req.user;
  res.status(200).send({
    success: true,
    data: user,
  });
});

// @desc       Update user details
// @route      PUT /api/v1/auth/updatedetails
// @access     Private
exports.updateDetails = asyncErrorHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).send({
    success: true,
    data: user,
  });
});

// @desc       Update password
// @route      PUT /api/v1/auth/updatepassword
// @access     Private
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // The user will pass the current password and the new password
  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new customError("Password is incorrect", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  // If they change the password, we want a token to be sent back, just like when they reset the password
  sendTokenResponse(user, 200, res);
});

// @desc       Forgot password
// @route      POST /api/v1/auth/forgotpassword
// @access     Public
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  // Users will send a request to reset their passwords, in the req.body we should find the email that they sent. We want to get the user by that email.
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new customError("There is no user with that email", 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  // Save the resetPasswordToken and resetPasswordExpire fields to DB. By default, documents are automatically validated before they are saved to the database. This is to prevent saving an invalid document. If we want to handle validation manually and be able to save objects which don't pass validation, we can set validateBeforeSave to false. Here, we do not need to validate since we are programmatically generating the resetPasswordToken and it isn't a user input.
  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res.status(200).send({ success: true, data: "Email sent" });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new customError("Email could not be sent", 500));
  }
});

// @desc       Reset password
// @route      PUT /api/v1/auth/resetpassword/:resettoken
// @access     Public
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    // this field's time should be greater than the current time, meaning that the token still hasn't expired
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new customError("Invalid token", 400));
  }

  // Set the new password. Since the password is being modified, it should be automatically encrypted thanks to the "Encrypt password using bcrypt" middleware present in the User.js file. When we set a field to undefined it disappears from the document.
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // We send back a token so basically they will be logged in
  sendTokenResponse(user, 200, res);
});

// Get token from model
// Create cookie and send response. So basically we are sending a cookie with the token in it which is more secure than sending the token directly and storing it in local storage. Cookies are stored in files on the user's device, and the browser automatically manages sending them with each HTTP request to the associated domain.
// In this case, the server would send an HTTP cookie with the JWT as its value, and the browser automatically includes this cookie in subsequent requests to the same domain.
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.generateSignedJwtToken();

  const options = {
    // We can't specify 30d directly like we did for the jwt token so we need to do some calculations. This should give us 30 days.
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    // We don't want the cookie to be accessed through the client side script so we set this. This is particularly important for security reasons because it helps mitigate the risk of Cross-Site Scripting (XSS) attacks. This is a security flag.
    httpOnly: true,
  };

  // When we are in production we want to set the secure flag to true so that the cookie is only sent over https connections, providing an additional layer of security. It's important to note that using the Secure flag is particularly relevant for cookies that contain sensitive information, like authentication tokens or session identifiers. By ensuring that these cookies are only sent over secure connections, you reduce the risk of interception and unauthorized access.However, it's crucial to remember that simply setting the Secure flag does not make the entire website or web application secure. The entire application should be configured to use HTTPS, and other security measures should be in place to protect against various types of attacks.
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  // cookie(cookieName/key, cookieValue/value, options)
  res
    .status(statusCode)
    .cookie("token", token, options)
    .send({ success: true, token });
};
