const express = require("express");
const validateRequest = require("../middlewares/validateRequest");
const { authorizeActions } = require("../middlewares/auth");
const { ACTIONS } = require("../constants/permissions");
const uploadLegacyPatientPhoto = require("../middlewares/uploadLegacyPatientPhoto");
const {
  listLegacyPatients,
  createLegacyPatient,
  deleteLegacyPatient
} = require("../controllers/legacyPatientController");
const {
  createLegacyPatientSchema,
  legacyPatientIdParamSchema
} = require("../validators/legacyPatientValidators");

const router = express.Router();

router.get("/", authorizeActions(ACTIONS.PATIENT_READ), listLegacyPatients);
router.post(
  "/",
  authorizeActions(ACTIONS.PATIENT_CREATE),
  uploadLegacyPatientPhoto,
  validateRequest(createLegacyPatientSchema),
  createLegacyPatient
);
router.delete(
  "/:id",
  authorizeActions(ACTIONS.PATIENT_DELETE),
  validateRequest(legacyPatientIdParamSchema),
  deleteLegacyPatient
);

module.exports = router;
