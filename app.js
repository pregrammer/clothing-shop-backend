const express = require("express");
const app = express();
const path = require('path');
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const errorHandler = require("./api/middlewares/errorHandler");
const verifyJWT = require("./api/middlewares/verifyJWT");
const credentials = require("./api/middlewares/credentials");
const corsOptions = require("./api/config/corsOptions");
const PORT = process.env.PORT || 3500;

// log requests info to the console
app.use(morgan("dev"));
// for setting cookie in fronend
app.use(credentials);
// Cross Origin Resource Sharing
app.use(cors(corsOptions));
// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));
// built-in middleware for json
app.use(express.json());
//middleware for cookies
app.use(cookieParser());
//serve static files
app.use("/", express.static(path.join(__dirname, "/api/public")));

// Routes which should handle requests
///////////////////////////
app.use("/auth", require("./api/routes/authRoutes"));

app.use(verifyJWT);
//protected routes

// route not found
app.all("*", (req, res) => {
  res.status(404).json({ message: "404 Not Found" });
});

// error handler
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
