const express = require("express");
const { register } = require("../controllers/authentication");

const router = express.Router();

router.route("/register").post(register);

module.exports = router;
