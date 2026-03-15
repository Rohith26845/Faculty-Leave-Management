const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    // Timetable Metadata
    name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      enum: ["CS", "EE", "ME", "Civil", "ECE", "IT", "Computer Engineering"],
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Week Configuration
    weekDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },

    // Main Timetable Data
    // Structure: { "Monday-09:00": { type, batches: [...] }, ... }
    schedule: {
      type: Map,
      of: {
        type: {
          type: String,
          enum: ["lecture", "practical", "tutorial", "break"],
          default: "lecture",
        },
        // For lectures only
        subject: mongoose.Schema.Types.ObjectId,
        faculty: mongoose.Schema.Types.ObjectId,
        room: String,
        duration: { type: Number, default: 1 },

        // For practicals/tutorials - each batch is independent
        batches: [
          {
            batchNumber: Number, // 1, 2, 3, or 4
            subject: mongoose.Schema.Types.ObjectId, // ✅ DIFFERENT SUBJECT PER BATCH
            faculty: mongoose.Schema.Types.ObjectId,
            room: String,
          },
        ],
      },
    },

    // Subject List with Colors for Legend
    subjects: [
      {
        subjectId: mongoose.Schema.Types.ObjectId,
        subjectCode: String,
        subjectName: String,
        color: String,
      },
    ],

    // Period Timings
    periodTimings: [
      {
        periodNumber: Number,
        startTime: String,
        endTime: String,
      },
    ],

    // Status
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    hasConflicts: { type: Boolean, default: false },
    conflictDetails: [String],
  },
  { timestamps: true },
);

timetableSchema.index({ department: 1, semester: 1, isActive: 1 });

module.exports = mongoose.model("Timetable", timetableSchema);
