const customError = require("../utils/customError");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const geocoder = require("../utils/geocoder");
const Bootcamp = require("../models/Bootcamp");

// These are the route handler callback functions for the bootcamps route

// @desc       Get all bootcamps
// @route      GET /api/v1/bootcamps
// @access     Public
exports.getBootcamps = asyncErrorHandler(async (req, res, next) => {
  let query;

  // Copy the object given by req.query
  const reqQuery = { ...req.query };

  // Fields to exclude. Any param we put in this array will be removed from reqQuery. Basically we don't want to match these fields with a field inside the document since there is no such field and it will give us an error, we only want to be able to use them
  const removeFields = ["select", "sort", "page", "limit"];

  // Loop over removeFields elements and delete them from reqQuery. We are removing them because reqQuery is going to be used in Bootcamp.find() for advanced filtering and since "select" and "sort" are not fields present inside the Bootcamp model, if we don't remove them, we will get an error since it will try to search and match them with fields inside of the model
  removeFields.forEach((param) => delete reqQuery[param]);

  //Advanced filtering: req.query gives us an object that contains the URL's query string keys and values, we need to convert that object into a string to be able to manipulate it and add a $ before the mongoose operators gt|gte|lt|lte|in (greater than, greater than or equal .. etc.), we need to add it to be able to use it inside of mongoose methods like "find". After, we convert it back to an object to use it inside of the mongoose "find" method. To filter the results we add "?key=value&key=value" to the URL. For example "?housing=false&averageCost[lt]=10000" this will give us the bootcamps that satisfy those parameters.
  let queryStr = JSON.stringify(reqQuery);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  query = Bootcamp.find(JSON.parse(queryStr));

  // Select fields to get: we can add "?select=value, value..etc" in the URL to only obtain the specific fields we want inside of the json objects we get as response. For example "?select= name, description". We use an if statement to make sure that the query string has a "select" param.
  if (req.query.select) {
    // To select fields using mongoose, query.select, the fields should have a space in the middle so, for example, "name description" and not "name, description", that's why we split the string at the comma into an array and then join the array elements back into a string adding a space between them
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort by fields
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    // Default sort in descending order (-) by date (createdAt) if there isn't a specified sort in the URL's query string
    query = query.sort("-createdAt");
  }

  // Pagination: page and limit numbers comes as a string so we have to convert them into numbers using parseInt. We also set a default if page and limit numbers aren't specified.
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  // As a response from the api we get an array of objects (documents from the DB), startIndex is the index of the first object we get inside of the array. For example, If we have a total of 6 objects and we set a limit of 2 then we will distribute the 6 objects into 3 pages, each page containing 2 objects(documents). In this case, the startIndex for the first object in page 1 is 0, the first object in page 2 will have a startIndex of 2 and the  the first object in page 3 will have a startIndex of 4. The endIndex is equal to (the index of the last object in the page + 1).
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  // Number of documents in the DB
  const total = await Bootcamp.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const bootcamps = await query;

  // Pagination result
  const pagination = {};
  // If endIndex < total then we know we have a next page
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  // If startIndex = 0 then we don't have a previous page but if startIndex > 0 then we know we have a previous page
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).send({
    success: true,
    count: bootcamps.length,
    pagination,
    data: bootcamps,
  });
});

// @desc       Get a single bootcamp
// @route      GET /api/v1/bootcamps/:id
// @access     Public
exports.getBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  // Fires off if the id format is right (right lenght etc.) but no bootcamp was found in the database
  if (!bootcamp) {
    // We use next() to pass the created error instance to the errorHandler. That's because when we pass any argument to next(), Express handles that argument as an error object so it will automatically ignore other middleware functions and pass that error to the errorHandler middleware.
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).send({ success: true, data: bootcamp });
});

// @desc       Create a new bootcamp
// @route      POST /api/v1/bootcamps
// @access     Private
exports.createBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).send({ success: true, data: bootcamp });
});

// @desc       Update a bootcamp
// @route      PUT /api/v1/bootcamps/:id
// @access     Private
exports.updateBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!bootcamp) {
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).send({ success: true, data: bootcamp });
});

// @desc       Delete a bootcamp
// @route      DELETE /api/v1/bootcamps/:id
// @access     Private
exports.deleteBootcamp = asyncErrorHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

  if (!bootcamp) {
    return next(
      new customError(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).send({ success: true, data: {} });
});

// @desc       Get bootcamps within a radius
// @route      GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access     Private
exports.getBootcampsInRadius = asyncErrorHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});
