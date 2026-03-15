const express = require("express");
const router = express.Router();
const {
  getInitData,
  createTimetable,
  getTimetable,
  updateTimetableCell,
  getDepartmentTimetables,
  publishTimetable,
} = require("../controllers/timetableController");
const { protect, hodOnly } = require("../middleware/auth");

// Public routes
router.get("/init-data", protect, getInitData);
router.get("/department/:dept", protect, getDepartmentTimetables);
router.get("/:id", protect, getTimetable);

// HOD only routes
router.post("/create", protect, hodOnly, createTimetable);
router.put("/:id/update-cell", protect, hodOnly, updateTimetableCell);
router.post("/:id/publish", protect, hodOnly, publishTimetable);

module.exports = router;
