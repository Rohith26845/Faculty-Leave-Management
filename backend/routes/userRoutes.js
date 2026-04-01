const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
      .end(fileBuffer);
  });

router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // delete old avatar in Cloudinary
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (e) {
        console.warn("Cloudinary delete failed (avatar):", e.message);
      }
    }

    const result = await uploadToCloudinary(req.file.buffer, "faculty-avatars");

    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    return res.json({
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({ message: error.message || "Upload failed" });
  }
});

router.delete("/avatar", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (e) {
        console.warn("Cloudinary delete failed (avatar):", e.message);
      }
    }

    user.avatar = null;
    user.avatarPublicId = null;
    await user.save();

    return res.json({ message: "Avatar removed successfully" });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return res.status(500).json({ message: error.message || "Delete failed" });
  }
});

module.exports = router;
