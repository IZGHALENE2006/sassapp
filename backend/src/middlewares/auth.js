const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { hasPermission } = require("../constants/permissions");

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized: missing token");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (_err) {
    throw new ApiError(401, "Unauthorized: invalid token");
  }

  const user = await User.findById(decoded.userId).select("-password");
  if (!user) {
    throw new ApiError(401, "Unauthorized: user no longer exists");
  }

  req.user = user;
  next();
});

const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden: insufficient permissions");
    }
    next();
  };

const authorizeActions =
  (...actions) =>
  (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const hasAllRequired = actions.every((action) => hasPermission(req.user.role, action));
    if (!hasAllRequired) {
      throw new ApiError(403, "Forbidden: insufficient action permissions");
    }

    next();
  };

module.exports = { protect, authorize, authorizeActions };
