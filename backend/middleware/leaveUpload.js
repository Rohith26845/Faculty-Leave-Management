const multer = require("multer");

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(file.mimetype);
    cb(ok ? null : new Error("Only PDF/JPG/PNG/WEBP allowed"), ok);
  },
});
