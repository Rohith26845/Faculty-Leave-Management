const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.mimetype,
    );
    cb(ok ? null : new Error("Only JPEG/PNG/WEBP/GIF allowed"), ok);
  },
});

module.exports = upload;
