const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please add a valid email",
    ],
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    // When we get a user through the api we don't want it to return/show the password that's why we use select: false
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
// In mongoose 5.x, instead of calling next() manually, we can use a function that returns a promise. In particular, you can use async/await. So we don't have to call next() inside of the middleware.
UserSchema.pre("save", async function () {
  // The higher the numberof rounds the more secure is the password but the heavier it is on the system, 10 is the recommended but for stronger hashing we can increase it to 12, though this will make the process slower which may introduce a slighty bigger delay
  // Salting the pw is important because it sets a defense against hash tables
  const salt = await bcrypt.genSalt(10);
  // When we submit/save a resource, in this case a user, in the middleware we have access to it's fields so that's why we can call this.password. We have access to the document about to be saved through this. So this.password refers to the password to be saved to the database which is in req.body.password.
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JSON Web Token (JWT) and return
// Once the users register, they will get a jwt token that they will be able to use to access protected routes
// Since we are creating a method, it is going to be called on the actual user and not the schema so we have access to this._id
// The signing algorithm takes the header, the payload, and the secret to create a unique signature. Then together with the header and the payload, these signature forms the JWT, which then gets sent to the client.
UserSchema.methods.generateSignedJwtToken = function () {
  // We pass the payload, the secret and options (in this case we set the expiry)
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);