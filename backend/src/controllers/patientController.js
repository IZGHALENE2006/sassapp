const Appointment = require("../models/Appointment");
const Counter = require("../models/Counter");
const Patient = require("../models/Patient");
const Payment = require("../models/Payment");
const QueueEntry = require("../models/QueueEntry");
const Visit = require("../models/Visit");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ACTIONS, hasPermission } = require("../constants/permissions");

const SEGMENTS = {
  REGULAR: "regular",
  LEGACY: "legacy",
  ALL: "all"
};

const normalizeSegment = (value) => {
  const segment = String(value || SEGMENTS.ALL).toLowerCase();
  if (segment === SEGMENTS.LEGACY) return SEGMENTS.LEGACY;
  if (segment === SEGMENTS.REGULAR) return SEGMENTS.REGULAR;
  return SEGMENTS.ALL;
};

const buildSegmentFilter = (segment) => {
  if (segment === SEGMENTS.LEGACY) {
    return { recordSource: SEGMENTS.LEGACY };
  }

  if (segment === SEGMENTS.REGULAR) {
    return { recordSource: { $ne: SEGMENTS.LEGACY } };
  }

  return {};
};

const createPatient = asyncHandler(async (req, res) => {
  const payload = {
    ...req.validated.body,
    recordSource: req.validated.body.recordSource || SEGMENTS.REGULAR
  };
  const patient = await Patient.create(payload);
  res.status(201).json({ message: "Patient created", patient });
});

const listPatients = asyncHandler(async (req, res) => {
  const segment = normalizeSegment(req.query?.segment);
  const filter = buildSegmentFilter(segment);
  const patients = await Patient.find(filter).sort({ patientNumber: 1, createdAt: 1 }).limit(500);
  res.json({ patients });
});

const searchPatients = asyncHandler(async (req, res) => {
  const { cin, phone, name, segment } = req.validated.query;
  const filters = [];

  if (cin) filters.push({ cin: cin.toUpperCase() });
  if (phone) filters.push({ phone: { $regex: phone, $options: "i" } });
  if (name) filters.push({ name: { $regex: name, $options: "i" } });

  const normalizedSegment = normalizeSegment(segment);
  const segmentFilter = buildSegmentFilter(normalizedSegment);
  const patients = await Patient.find({
    ...segmentFilter,
    $or: filters
  }).sort({ patientNumber: 1, createdAt: 1 });
  res.json({ patients });
});

const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.validated.params.id);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }
  res.json({ patient });
});

const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const payload = { ...req.validated.body };

  if (payload.cin) {
    payload.cin = payload.cin.toUpperCase();
  }

  const patient = await Patient.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  res.json({ message: "Patient updated successfully", patient });
});

const getPatientHistory = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;

  const patient = await Patient.findById(id);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const canReadPayments = hasPermission(req.user.role, ACTIONS.PAYMENT_READ);
  const [visits, appointments, payments] = await Promise.all([
    Visit.find({ patient: id }).populate("doctor", "name role").sort({ visitDate: -1 }),
    Appointment.find({ patient: id }).sort({ dateTime: -1 }),
    canReadPayments ? Payment.find({ patient: id }).sort({ paymentDate: -1 }) : Promise.resolve([])
  ]);

  res.json({
    patient,
    history: { visits, appointments, payments }
  });
});

const deletePatient = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const patient = await Patient.findById(id);

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const deletedPatientNumber = patient.patientNumber;

  await Promise.all([
    Visit.deleteMany({ patient: id }),
    Appointment.deleteMany({ patient: id }),
    Payment.deleteMany({ patient: id }),
    QueueEntry.deleteMany({ patient: id })
  ]);

  await patient.deleteOne();

  if (typeof deletedPatientNumber === "number") {
    await Patient.updateMany(
      { patientNumber: { $gt: deletedPatientNumber } },
      { $inc: { patientNumber: -1 } }
    );

    const maxPatient = await Patient.findOne()
      .sort({ patientNumber: -1 })
      .select("patientNumber");

    await Counter.findByIdAndUpdate(
      "patient",
      { seq: maxPatient?.patientNumber || 0 },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  res.json({ message: "Patient deleted successfully" });
});

module.exports = {
  createPatient,
  listPatients,
  searchPatients,
  getPatientById,
  updatePatient,
  getPatientHistory,
  deletePatient
};
