const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const assertTimeSlotAvailable = async (dateTime, excludeAppointmentId = null) => {
  const filter = { dateTime };
  if (excludeAppointmentId) {
    filter._id = { $ne: excludeAppointmentId };
  }

  const existingAppointment = await Appointment.findOne(filter).select("_id dateTime");
  if (existingAppointment) {
    throw new ApiError(
      409,
      "This appointment time is already reserved. Choose another time or delete the existing appointment."
    );
  }
};

const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorName, reason, dateTime } = req.validated.body;
  const appointmentDate = new Date(dateTime);

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  await assertTimeSlotAvailable(appointmentDate);

  const appointment = await Appointment.create({
    patient: patientId,
    doctorName,
    reason,
    dateTime: appointmentDate,
    createdBy: req.user._id
  });

  const populated = await appointment.populate("patient", "cin name phone");
  res.status(201).json({ message: "Appointment created", appointment: populated });
});

const listAppointments = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.dateTime = {};
    if (from) filter.dateTime.$gte = new Date(from);
    if (to) filter.dateTime.$lte = new Date(to);
  }

  const appointments = await Appointment.find(filter)
    .populate("patient", "cin name phone")
    .sort({ dateTime: 1 });

  res.json({ appointments });
});

const getUpcomingAppointments = asyncHandler(async (_req, res) => {
  const appointments = await Appointment.find({
    dateTime: { $gte: new Date() },
    status: "scheduled"
  })
    .populate("patient", "cin name phone")
    .sort({ dateTime: 1 })
    .limit(50);

  res.json({ appointments });
});

const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const payload = { ...req.validated.body };

  if (payload.dateTime) {
    payload.dateTime = new Date(payload.dateTime);
    await assertTimeSlotAvailable(payload.dateTime, id);
  }

  const appointment = await Appointment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  }).populate("patient", "cin name phone");

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  res.json({ message: "Appointment updated", appointment });
});

const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const deleted = await Appointment.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Appointment not found");
  }
  res.json({ message: "Appointment deleted" });
});

module.exports = {
  createAppointment,
  listAppointments,
  getUpcomingAppointments,
  updateAppointment,
  deleteAppointment
};
