const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    quantity: { type: String, trim: true },
    instructions: { type: String, trim: true }
  },
  { _id: false }
);

const visitSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    notes: { type: String, trim: true, default: "" },
    diagnosis: { type: String, trim: true },
    medications: { type: [medicationSchema], default: [] },
    prescribedMedication: { type: String, trim: true },
    visitDate: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visit", visitSchema);
