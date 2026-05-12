const mongoose = require("mongoose");

const queueEntrySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    queueDate: { type: String, required: true, index: true },
    queueNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ["waiting", "called", "in_consultation", "done", "skipped"],
      default: "waiting"
    },
    checkedInAt: { type: Date, default: Date.now },
    calledAt: { type: Date }
  },
  { timestamps: true }
);

queueEntrySchema.index({ queueDate: 1, queueNumber: 1 }, { unique: true });

module.exports = mongoose.model("QueueEntry", queueEntrySchema);
