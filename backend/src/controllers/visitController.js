const Patient = require("../models/Patient");
const Visit = require("../models/Visit");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const createVisit = asyncHandler(async (req, res) => {
  const { patientId, notes, diagnosis, prescribedMedication, medications, visitDate } = req.validated.body;

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const normalizedMedications = Array.isArray(medications)
    ? medications
        .map((item) => ({
          name: item.name?.trim(),
          dosage: item.dosage?.trim() || "",
          frequency: item.frequency?.trim() || "",
          duration: item.duration?.trim() || "",
          quantity: item.quantity?.trim() || "",
          instructions: item.instructions?.trim() || ""
        }))
        .filter((item) => item.name)
    : [];

  const legacyMedicationText =
    typeof prescribedMedication === "string" && prescribedMedication.trim()
      ? prescribedMedication.trim()
      : normalizedMedications.map((item) => item.name).join(", ");

  const visit = await Visit.create({
    patient: patientId,
    doctor: req.user._id,
    notes: typeof notes === "string" ? notes.trim() : "",
    diagnosis: typeof diagnosis === "string" ? diagnosis.trim() : "",
    medications: normalizedMedications,
    prescribedMedication: legacyMedicationText,
    visitDate: visitDate ? new Date(visitDate) : new Date()
  });

  const populated = await visit.populate([
    { path: "patient", select: "cin name phone" },
    { path: "doctor", select: "name role" }
  ]);

  res.status(201).json({ message: "Visit created", visit: populated });
});

const listVisitsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.validated.params;
  const visits = await Visit.find({ patient: patientId })
    .populate("doctor", "name role")
    .sort({ visitDate: -1 });

  res.json({ visits });
});

module.exports = { createVisit, listVisitsByPatient };
