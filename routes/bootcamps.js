const express = require("express");
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require("../controllers/bootcamps");
const Bootcamp = require("../models/Bootcamp");

// Include other resource routers
const coursesRouter = require("./courses");

const router = express.Router();

const advancedResults = require("../middleware/advancedResults");
// We add the protect function as a first parameter before the method in the routes we want to be protected. Wherever we put protect the user has to be logged in.
const { protect, authorize } = require("../middleware/authentication");

// Re-route into other resource routers
router.use("/:bootcampId/courses", coursesRouter);

// Route handlers
router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

router
  .route("/:id/photo")
  .put(protect, authorize("publisher", "admin"), bootcampPhotoUpload);

router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), getBootcamps)
  .post(protect, authorize("publisher", "admin"), createBootcamp);

router
  .route("/:id")
  .get(getBootcamp)
  .put(protect, authorize("publisher", "admin"), updateBootcamp)
  .delete(protect, authorize("publisher", "admin"), deleteBootcamp);

module.exports = router;
