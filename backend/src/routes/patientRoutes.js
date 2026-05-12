const express = require("express");
const {
  createPatient,
  listPatients,
  searchPatients,
  getPatientById,
  updatePatient,
  getPatientHistory,
  deletePatient
} = require("../controllers/patientController");
const validateRequest = require("../middlewares/validateRequest");
const { authorizeActions } = require("../middlewares/auth");
const { ACTIONS } = require("../constants/permissions");
const {
  createPatientSchema,
  searchPatientSchema,
  patientIdParamSchema,
  updatePatientSchema
} = require("../validators/patientValidators");

const router = express.Router();

router.get("/", authorizeActions(ACTIONS.PATIENT_READ), listPatients);
router.post("/", authorizeActions(ACTIONS.PATIENT_CREATE), validateRequest(createPatientSchema), createPatient);
router.get("/search", authorizeActions(ACTIONS.PATIENT_READ), validateRequest(searchPatientSchema), searchPatients);
router.get("/:id", authorizeActions(ACTIONS.PATIENT_READ), validateRequest(patientIdParamSchema), getPatientById);
router.put("/:id", authorizeActions(ACTIONS.PATIENT_UPDATE), validateRequest(updatePatientSchema), updatePatient);
router.get(
  "/:id/history",
  authorizeActions(ACTIONS.PATIENT_HISTORY),
  validateRequest(patientIdParamSchema),
  getPatientHistory
);
router.delete("/:id", authorizeActions(ACTIONS.PATIENT_DELETE), validateRequest(patientIdParamSchema), deletePatient);

module.exports = router;
