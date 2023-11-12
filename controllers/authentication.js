const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
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

// Get token from model, create cookie and send response. So basically we are sending a cookie with the token in it which is more secure than sending the token directly and storing it in local storage. Cookies are stored in files on the user's device, and the browser automatically manages sending them with each HTTP request to the associated domain.
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
