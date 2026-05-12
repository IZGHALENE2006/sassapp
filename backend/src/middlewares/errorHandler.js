const ApiError = require("../utils/ApiError");

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const payload = {
    message: err.message || "Internal Server Error"
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      details: Object.values(err.errors).map((e) => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate key error",
      details: err.keyValue
    });
  }

  return res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };
