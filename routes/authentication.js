const express = require("express");
const { register, login, getMe } = require("../controllers/authentication");

const router = express.Router();

const { protect } = require("../middleware/authentication");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/me").get(protect, getMe);

module.exports = router;
