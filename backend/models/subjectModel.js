const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    syllabus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Syllabus",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subject", subjectSchema);
