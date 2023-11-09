const advancedResults = (model, populate) => async (req, res, next) => {
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

  // Finding resource / populate the bootcamp objects with their courses
  query = model.find(JSON.parse(queryStr));

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
  const total = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

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

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
