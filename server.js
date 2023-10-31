const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route Files
const bootcampsRouter = require("./routes/bootcamps");
const coursesRouter = require("./routes/courses");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

// Run server
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Mount routers
app.use("/api/v1/bootcamps", bootcampsRouter);
app.use("/api/v1/courses", coursesRouter);

// Error handling middleware
app.use(errorHandler);
