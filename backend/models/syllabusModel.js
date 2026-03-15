const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
    },
    batch: {
      type: Number,
      required: true,
      description: "Starting year of the batch (e.g., 2022 for 2022-2026)",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: String,

    // ✅ Store all subjects organized by semester
    allSemesters: [
      {
        semester: String, // "1st Semester", "2nd Semester", etc.
        year: Number, // 1, 2, 3, 4 (academic year)
        subjects: [
          {
            code: String,
            name: String,
            credits: String,
            description: String,
          },
        ],
      },
    ],

    // ✅ Store only current semester subjects with faculty assignments
    currentSemesterSubjects: [
      {
        code: String,
        name: String,
        credits: String,
        description: String,
        assignedFaculty: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    currentSemester: String, // e.g., "3rd Semester"
    currentAcademicYear: Number, // e.g., 2

    facultyAssigned: {
      type: Boolean,
      default: false,
    },
    assignedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Syllabus", syllabusSchema);
