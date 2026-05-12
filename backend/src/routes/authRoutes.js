const express = require("express");
const { login, me, register } = require("../controllers/authController");
const validateRequest = require("../middlewares/validateRequest");
const { protect } = require("../middlewares/auth");
const { registerSchema, loginSchema } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.get("/me", protect, me);

module.exports = router;
