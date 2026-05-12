const mongoose = require("mongoose");

const legacyPatientSchema = new mongoose.Schema(
  {
    cin: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    photoUrl: { type: String, required: true, trim: true },
    photoFilename: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LegacyPatient", legacyPatientSchema);
