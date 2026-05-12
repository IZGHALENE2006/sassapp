const express = require("express");
const {
  checkInPatient,
  getTodayQueue,
  getCurrentQueueNumber,
  updateQueueStatus
} = require("../controllers/queueController");
const validateRequest = require("../middlewares/validateRequest");
const { checkInSchema, updateQueueStatusSchema } = require("../validators/queueValidators");
const { authorizeActions } = require("../middlewares/auth");
const { ACTIONS } = require("../constants/permissions");

const router = express.Router();

router.post(
  "/check-in",
  authorizeActions(ACTIONS.QUEUE_CHECKIN),
  validateRequest(checkInSchema),
  checkInPatient
);
router.get("/today", authorizeActions(ACTIONS.QUEUE_READ), getTodayQueue);
router.get("/current", authorizeActions(ACTIONS.QUEUE_READ), getCurrentQueueNumber);
router.patch(
  "/:id/status",
  authorizeActions(ACTIONS.QUEUE_UPDATE_STATUS),
  validateRequest(updateQueueStatusSchema),
  updateQueueStatus
);

module.exports = router;
