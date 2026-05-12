const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/ApiError");

const uploadDir = path.join(__dirname, "../../uploads/legacy-patients");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || "").toLowerCase();
    const uniquePart = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `legacy-${uniquePart}${safeExt}`);
  }
});

const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
    }
    return cb(null, true);
  }
});

const uploadLegacyPatientPhoto = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (!err) return next();
    if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "Image is too large. Maximum size is 5MB."));
    }
    return next(new ApiError(400, err.message || "Failed to upload image"));
  });
};

module.exports = uploadLegacyPatientPhoto;
