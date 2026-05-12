const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema(
  {
    patientNumber: { type: Number, unique: true, index: true, sparse: true },
    recordSource: { type: String, enum: ["regular", "legacy"], default: "regular", index: true },
    cin: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String, trim: true }
  },
  { timestamps: true }
);

patientSchema.pre("save", async function preSave(next) {
  if (!this.isNew || this.patientNumber) {
    return next();
  }

  const counter = await Counter.findByIdAndUpdate(
    "patient",
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  this.patientNumber = counter.seq;
  return next();
});

module.exports = mongoose.model("Patient", patientSchema);
