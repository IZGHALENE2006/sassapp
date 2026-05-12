const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const { getPermissionsByRole, resolveRole } = require("../constants/permissions");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validated.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({ name, email, password, role });
  const effectiveRole = resolveRole(user.role);
  const token = signToken({ userId: user._id, role: effectiveRole });
  const permissions = getPermissionsByRole(effectiveRole);

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
      permissions
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const effectiveRole = resolveRole(user.role);
  if (user.role !== effectiveRole) {
    user.role = effectiveRole;
    await user.save();
  }

  const token = signToken({ userId: user._id, role: effectiveRole });
  const permissions = getPermissionsByRole(effectiveRole);
  res.json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
      permissions
    }
  });
});

const me = asyncHandler(async (req, res) => {
  const effectiveRole = resolveRole(req.user.role);
  const permissions = getPermissionsByRole(effectiveRole);
  res.json({
    user: {
      ...req.user.toObject(),
      role: effectiveRole,
      permissions
    }
  });
});

module.exports = { register, login, me };
