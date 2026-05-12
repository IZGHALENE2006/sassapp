const express = require("express");
const authRoutes = require("./authRoutes");
const patientRoutes = require("./patientRoutes");
const queueRoutes = require("./queueRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const visitRoutes = require("./visitRoutes");
const paymentRoutes = require("./paymentRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const legacyPatientRoutes = require("./legacyPatientRoutes");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "clinic-api" });
});

router.use("/auth", authRoutes);
router.use("/patients", protect, patientRoutes);
router.use("/queue", protect, queueRoutes);
router.use("/appointments", protect, appointmentRoutes);
router.use("/visits", protect, visitRoutes);
router.use("/payments", protect, paymentRoutes);
router.use("/dashboard", protect, dashboardRoutes);
router.use("/legacy-patients", protect, legacyPatientRoutes);

module.exports = router;
