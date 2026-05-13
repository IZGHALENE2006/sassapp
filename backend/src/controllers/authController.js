const User = require("../models/User");
const roles = require("../constants/roles");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const { getPermissionsByRole, resolveRole } = require("../constants/permissions");

const ROLE_LOGIN_CONFIG = {
  [roles.ADMIN]: {
    password: env.doctorPassword,
    defaultName: "Doctor",
    defaultEmail: env.doctorLoginEmail
  },
  [roles.RECEPTIONIST]: {
    password: env.receptionPassword,
    defaultName: "Reception",
    defaultEmail: env.receptionLoginEmail
  }
};

const findUserByRole = async (normalizedRole, rawRole) => {
  let user = await User.findOne({ role: normalizedRole });

  // Backward compatibility for legacy role names saved before normalization.
  if (!user && rawRole && rawRole !== normalizedRole) {
    user = await User.findOne({ role: rawRole });
  }

  return user;
};

const createRoleUser = async (normalizedRole, password) => {
  const roleConfig = ROLE_LOGIN_CONFIG[normalizedRole] || {};
  let email = roleConfig.defaultEmail || `${normalizedRole}@clinic.local`;

  const existingByEmail = await User.findOne({ email });
  if (existingByEmail && existingByEmail.role !== normalizedRole) {
    email = `${normalizedRole}.${Date.now()}@clinic.local`;
  }

  return User.create({
    name: roleConfig.defaultName || normalizedRole,
    email,
    password,
    role: normalizedRole
  });
};

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
  const { email, password, role, code } = req.validated.body;
  const normalizedRole = role ? resolveRole(role) : null;
  const secret = password || code;

  let user;
  let invalidCredentialMessage = "Invalid email or password";

  if (normalizedRole) {
    invalidCredentialMessage = "Invalid role or password";
    const roleConfig = ROLE_LOGIN_CONFIG[normalizedRole];

    if (roleConfig?.password) {
      if (secret !== roleConfig.password) {
        throw new ApiError(401, invalidCredentialMessage);
      }

      user = await findUserByRole(normalizedRole, role);
      if (!user) {
        user = await createRoleUser(normalizedRole, roleConfig.password);
      }
    } else {
      user = await findUserByRole(normalizedRole, role);
      if (!user) {
        throw new ApiError(401, invalidCredentialMessage);
      }

      const isValid = await user.comparePassword(secret);
      if (!isValid) {
        throw new ApiError(401, invalidCredentialMessage);
      }
    }
  } else {
    user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, invalidCredentialMessage);
    }

    const isValid = await user.comparePassword(secret);
    if (!isValid) {
      throw new ApiError(401, invalidCredentialMessage);
    }
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
