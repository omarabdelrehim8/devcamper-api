const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route Files
const bootcampsRouter = require("./routes/bootcamps");
const coursesRouter = require("./routes/courses");
const authRouter = require("./routes/authentication");
const usersRouter = require("./routes/users");
const reviewsRouter = require("./routes/reviews");

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

// Cookie parser
app.use(cookieParser());

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// File uploading
app.use(fileupload());

// Sanitize Data and prevent NoSQL Injection
app.use(mongoSanitize());

// Set static folder. By making it a static folder we can access the files inside uploads directly by typing in the browser http://localhost:5000/uploads/photo_5d725a1b7b292f5f8ceff788.jpg (which is the image name). So basically we don't have to include /api/v1
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/bootcamps", bootcampsRouter);
app.use("/api/v1/courses", coursesRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/reviews", reviewsRouter);

// Error handling middleware
app.use(errorHandler);
