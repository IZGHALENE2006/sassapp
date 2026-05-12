const express = require("express");
const {
  createAppointment,
  listAppointments,
  getUpcomingAppointments,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointmentController");
const validateRequest = require("../middlewares/validateRequest");
const { authorizeActions } = require("../middlewares/auth");
const { ACTIONS } = require("../constants/permissions");
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentIdParamSchema
} = require("../validators/appointmentValidators");

const router = express.Router();

router.get("/", authorizeActions(ACTIONS.APPOINTMENT_READ), listAppointments);
router.get("/upcoming", authorizeActions(ACTIONS.APPOINTMENT_READ), getUpcomingAppointments);
router.post(
  "/",
  authorizeActions(ACTIONS.APPOINTMENT_CREATE),
  validateRequest(createAppointmentSchema),
  createAppointment
);
router.put(
  "/:id",
  authorizeActions(ACTIONS.APPOINTMENT_UPDATE),
  validateRequest(updateAppointmentSchema),
  updateAppointment
);
router.delete(
  "/:id",
  authorizeActions(ACTIONS.APPOINTMENT_DELETE),
  validateRequest(appointmentIdParamSchema),
  deleteAppointment
);

module.exports = router;
