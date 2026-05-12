const express = require("express");
const { createVisit, listVisitsByPatient } = require("../controllers/visitController");
const validateRequest = require("../middlewares/validateRequest");
const { createVisitSchema, patientVisitsSchema } = require("../validators/visitValidators");
const { authorizeActions } = require("../middlewares/auth");
const { ACTIONS } = require("../constants/permissions");

const router = express.Router();

router.post("/", authorizeActions(ACTIONS.VISIT_CREATE), validateRequest(createVisitSchema), createVisit);
router.get(
  "/patient/:patientId",
  authorizeActions(ACTIONS.VISIT_READ),
  validateRequest(patientVisitsSchema),
  listVisitsByPatient
);

module.exports = router;
