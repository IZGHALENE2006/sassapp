const fs = require("fs");
const path = require("path");
const LegacyPatient = require("../models/LegacyPatient");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listLegacyPatients = asyncHandler(async (req, res) => {
  const { cin, name } = req.query || {};
  const filter = {};

  if (cin && String(cin).trim()) {
    filter.cin = { $regex: escapeRegex(String(cin).trim().toUpperCase()), $options: "i" };
  }
  if (name && String(name).trim()) {
    filter.name = { $regex: escapeRegex(String(name).trim()), $options: "i" };
  }

  const items = await LegacyPatient.find(filter).sort({ createdAt: -1 }).limit(1000);
  res.json({ items });
});

const createLegacyPatient = asyncHandler(async (req, res) => {
  const { cin, name } = req.validated.body;

  if (!req.file) {
    throw new ApiError(400, "Patient photo is required");
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const photoUrl = `${baseUrl}/uploads/legacy-patients/${req.file.filename}`;

  const item = await LegacyPatient.create({
    cin: String(cin).trim().toUpperCase(),
    name: name.trim(),
    photoUrl,
    photoFilename: req.file.filename
  });

  res.status(201).json({ message: "Legacy patient created", item });
});

const deleteLegacyPatient = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const item = await LegacyPatient.findById(id);

  if (!item) {
    throw new ApiError(404, "Legacy patient not found");
  }

  const photoPath = path.join(__dirname, "../../uploads/legacy-patients", item.photoFilename);
  if (fs.existsSync(photoPath)) {
    fs.unlinkSync(photoPath);
  }

  await item.deleteOne();
  res.json({ message: "Legacy patient deleted" });
});

module.exports = {
  listLegacyPatients,
  createLegacyPatient,
  deleteLegacyPatient
};
