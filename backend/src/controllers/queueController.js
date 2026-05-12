const dayjs = require("dayjs");
const Patient = require("../models/Patient");
const QueueEntry = require("../models/QueueEntry");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const checkInPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.validated.body;
  const patient = await Patient.findById(patientId);

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const queueDate = dayjs().format("YYYY-MM-DD");
  const latestEntry = await QueueEntry.findOne({ queueDate }).sort({ queueNumber: -1 });
  const queueNumber = latestEntry ? latestEntry.queueNumber + 1 : 1;

  const queueEntry = await QueueEntry.create({
    patient: patient._id,
    queueDate,
    queueNumber
  });

  const populated = await queueEntry.populate("patient", "cin name phone");
  res.status(201).json({ message: "Patient added to queue", queueEntry: populated });
});

const getTodayQueue = asyncHandler(async (_req, res) => {
  const queueDate = dayjs().format("YYYY-MM-DD");
  const queue = await QueueEntry.find({ queueDate })
    .populate("patient", "cin name phone")
    .sort({ queueNumber: 1 });

  res.json({ queueDate, queue });
});

const getCurrentQueueNumber = asyncHandler(async (_req, res) => {
  const queueDate = dayjs().format("YYYY-MM-DD");
  const current = await QueueEntry.findOne({
    queueDate,
    status: { $in: ["called", "in_consultation"] }
  })
    .populate("patient", "name")
    .sort({ queueNumber: 1 });

  const waitingCount = await QueueEntry.countDocuments({
    queueDate,
    status: "waiting"
  });

  res.json({
    queueDate,
    current: current || null,
    waitingCount
  });
});

const updateQueueStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;

  const queueEntry = await QueueEntry.findById(id);
  if (!queueEntry) {
    throw new ApiError(404, "Queue entry not found");
  }

  queueEntry.status = status;
  if (status === "called") {
    queueEntry.calledAt = new Date();
  }

  await queueEntry.save();
  const populated = await queueEntry.populate("patient", "cin name phone");
  res.json({ message: "Queue entry updated", queueEntry: populated });
});

module.exports = {
  checkInPatient,
  getTodayQueue,
  getCurrentQueueNumber,
  updateQueueStatus
};
