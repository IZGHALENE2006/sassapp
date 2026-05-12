const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const env = require("./config/env");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.use("/api/v1", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
