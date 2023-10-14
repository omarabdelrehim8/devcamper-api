const express = require("express");
const dotenv = require("dotenv");

// Route files
const bootcampsRouter = require("./routes/bootcamps");

// Load env vars
dotenv.config({ path: "./config/config.env" });

const PORT = process.env.PORT || 5000;

// Run server
const app = express();
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Mount routers
app.use("/api/v1/bootcamps", bootcampsRouter);
