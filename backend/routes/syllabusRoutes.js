const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server"); // ✅ Added official File Manager
const fs = require("fs").promises; // ✅ For temp file handling
const path = require("path");
const os = require("os");
const { protect, hodOnly } = require("../middleware/auth");
const Syllabus = require("../models/syllabusModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

/* ─────────────────────────────────────────────────────────────
   Helper: Upload PDF file to Gemini using Official SDK
   ───────────────────────────────────────────────────────────── */
async function uploadPdfToGemini(pdfBuffer, originalName) {
  // Gemini's File API requires a physical file, so we write the buffer to a temp file
  const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${originalName}`);
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY); // ✅ Initialize File Manager
  try {
    await fs.writeFile(tempFilePath, pdfBuffer);
    console.log("📤 Uploading PDF to Gemini API via FileManager...");

    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "application/pdf",
      displayName: originalName,
    });

    console.log(`📎 File uploaded to Gemini: ${uploadResult.file.uri}`);
    return uploadResult.file; // returns { name, uri, mimeType, etc. }
  } catch (error) {
    console.error("❌ PDF upload error:", error.message);
    throw error;
  } finally {
    // Always clean up the local temporary file
    await fs
      .unlink(tempFilePath)
      .catch((err) => console.error("Failed to delete temp file:", err));
  }
}

/* ─────────────────────────────────────────────────────────────
   Helper: Delete PDF from Gemini
   ───────────────────────────────────────────────────────────── */
async function deletePdfFromGemini(geminiFileName) {
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY); // ✅ Initialize File Manager
  try {
    console.log(`🗑️ Deleting file from Gemini: ${geminiFileName}`);
    await fileManager.deleteFile(geminiFileName);
    console.log("✅ File deleted from Gemini");
  } catch (error) {
    console.error("⚠️ Warning deleting file from Gemini:", error.message);
  }
}

/* ─────────────────────────────────────────────────────────────
   Helper: Parse JSON safely from Gemini response
   ───────────────────────────────────────────────────────────── */
function extractJsonFromResponse(responseText) {
  const cleanedText = responseText
    .replace(/^```json/im, "")
    .replace(/^```/im, "")
    .trim();
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

/* ─────────────────────────────────────────────────────────────
   POST /api/syllabus/upload
   Upload 4-year syllabus PDF and extract all semesters
   ───────────────────────────────────────────────────────────── */
router.post(
  "/upload",
  protect,
  hodOnly,
  upload.single("file"),
  async (req, res) => {
    let geminiFileName = null;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const { department, batch } = req.body;
      if (!department || !batch) {
        return res
          .status(400)
          .json({ message: "Department and batch year are required" });
      }

      // Upload PDF to Gemini
      const uploadedFile = await uploadPdfToGemini(
        req.file.buffer,
        req.file.originalname,
      );
      geminiFileName = uploadedFile.name; // This is the ID used for deletion

      console.log("🤖 Sending to Gemini API for 4-year semester extraction...");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
You are an expert in analyzing college syllabus documents. Extract ALL subjects from this complete 4-year syllabus document and organize them by semester.

For each subject, extract the following focusing primarily on the "Teaching Scheme" tables:
1. "code": Subject Code (e.g., FY101, CE 201). Extract from the "Course Code" column.
2. "name": Subject Name (e.g., Engineering Mathematics I). Include Labs and Workshops.
3. "credits": Total Credits. Look for the "Total" sub-column strictly under the "Credits Assigned" main column.
4. "description": A Brief Description (1-2 lines). Infer from detailed contents or subject name.

CRITICAL INSTRUCTIONS:
- IGNORE "Examination Scheme" tables completely to avoid duplicate subjects.
- Include Electives exactly as they appear (even if they have placeholder codes like "CE 3xx").
- Do not skip labs or workshops.

Respond ONLY in valid JSON format like this:
{
  "allSemesters": [
    {
      "semester": "1st Semester",
      "year": 1,
      "subjects": [ { "code": "...", "name": "...", "credits": "...", "description": "..." } ]
    }
  ]
}
Return ONLY valid JSON.
`;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadedFile.mimeType,
            fileUri: uploadedFile.uri,
          },
        },
        { text: prompt },
      ]);

      let allSemesters = [];
      try {
        const parsed = extractJsonFromResponse(result.response.text());
        allSemesters = parsed.allSemesters || [];
      } catch (parseError) {
        return res
          .status(400)
          .json({ message: "Failed to parse extracted semesters." });
      }

      if (allSemesters.length === 0) {
        return res
          .status(400)
          .json({ message: "No semesters found in the syllabus." });
      }

      const syllabus = await Syllabus.create({
        department,
        batch: parseInt(batch),
        uploadedBy: req.user._id,
        allSemesters,
        fileName: req.file.originalname,
      });

      res.json({
        success: true,
        message: "Syllabus extracted successfully",
        syllabus: {
          _id: syllabus._id,
          department: syllabus.department,
          batch: syllabus.batch,
          totalSemesters: allSemesters.length,
        },
        allSemesters,
      });
    } catch (error) {
      console.error("❌ Syllabus upload error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to process syllabus" });
    } finally {
      if (geminiFileName) await deletePdfFromGemini(geminiFileName);
    }
  },
);

/* ─────────────────────────────────────────────────────────────
   POST /api/syllabus/upload-current-semester
   Upload current semester syllabus only
   ───────────────────────────────────────────────────────────── */
router.post(
  "/upload-current-semester",
  protect,
  hodOnly,
  upload.single("file"),
  async (req, res) => {
    let geminiFileName = null;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const { department, currentSemester, currentAcademicYear } = req.body;
      if (!department || !currentSemester || !currentAcademicYear) {
        return res.status(400).json({
          message: "Department, semester, and academic year are required",
        });
      }

      const uploadedFile = await uploadPdfToGemini(
        req.file.buffer,
        req.file.originalname,
      );
      geminiFileName = uploadedFile.name;

      console.log(
        "🤖 Sending to Gemini API for single semester subject extraction...",
      );
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
You are an expert in analyzing college syllabus documents. Extract ALL subjects from this single-semester syllabus document.

Identify the subjects focusing on the "Teaching Scheme" tables:
1. "code": Subject Code
2. "name": Subject Name
3. "credits": Total Credits (under "Credits Assigned" -> "Total")
4. "description": A Brief Description (1-2 lines)

CRITICAL INSTRUCTIONS:
- IGNORE "Examination Scheme" tables to avoid duplicate subjects.
- RESOLVE ELECTIVES: The main table contains placeholder codes like "CE 3xx" or "IL 36X". Do NOT just output the placeholders. You MUST scan the rest of the document to find the tables listing the specific elective courses (e.g., CE 312, IL 374) and list them as individual subjects. Apply the main table's credit value to these options.

Respond ONLY in valid JSON format like this, forcing the semester to "${currentSemester}" and year to ${currentAcademicYear}:
{
  "allSemesters": [
    {
      "semester": "${currentSemester}",
      "year": ${currentAcademicYear},
      "subjects": [ { "code": "...", "name": "...", "credits": "...", "description": "..." } ]
    }
  ]
}
Return ONLY valid JSON.
`;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadedFile.mimeType,
            fileUri: uploadedFile.uri,
          },
        },
        { text: prompt },
      ]);

      let allSemesters = [];
      try {
        const parsed = extractJsonFromResponse(result.response.text());
        allSemesters = parsed.allSemesters || [];
      } catch (parseError) {
        return res
          .status(400)
          .json({ message: "Failed to parse extracted subjects." });
      }

      // Because we specifically instructed the prompt to map to the requested semester/year
      const semesterData = allSemesters[0];

      if (
        !semesterData ||
        !semesterData.subjects ||
        semesterData.subjects.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "No subjects extracted from the document." });
      }
      const currentYear = new Date().getFullYear();
      const calculatedBatch = currentYear - parseInt(currentAcademicYear);
      const syllabus = await Syllabus.create({
        department,
        batch: calculatedBatch,
        uploadedBy: req.user._id,
        currentSemester,
        currentAcademicYear: parseInt(currentAcademicYear),
        currentSemesterSubjects: semesterData.subjects,
        allSemesters: [semesterData],
        fileName: req.file.originalname,
      });

      res.json({
        success: true,
        message: "Current semester syllabus extracted successfully",
        syllabus: {
          _id: syllabus._id,
          department: syllabus.department,
          currentSemester: syllabus.currentSemester,
          currentAcademicYear: syllabus.currentAcademicYear, // ✅ IMPORTANT
          totalSubjects: semesterData.subjects.length,
        },
        subjects: semesterData.subjects,
      });
    } catch (error) {
      console.error("❌ Single semester upload error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to process syllabus" });
    } finally {
      if (geminiFileName) await deletePdfFromGemini(geminiFileName);
    }
  },
);

// ... [The rest of your assignment and GET routes remain exactly the same] ...

/* ─────────────────────────────────────────────────────────────
   POST /api/syllabus/:id/set-current-semester
   Set current semester and get subjects for assignment
   HOD only
   ───────────────────────────────────────────────────────────── */
router.post("/:id/set-current-semester", protect, hodOnly, async (req, res) => {
  try {
    const { currentSemester, currentAcademicYear } = req.body;

    if (!currentSemester || !currentAcademicYear) {
      return res.status(400).json({
        message: "Current semester and academic year are required",
      });
    }

    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    // Find the semester in all semesters
    const semesterData = syllabus.allSemesters.find(
      (s) =>
        s.semester === currentSemester &&
        s.year === parseInt(currentAcademicYear),
    );

    if (!semesterData) {
      return res.status(400).json({
        message: `Semester ${currentSemester} of Year ${currentAcademicYear} not found`,
      });
    }

    // Update syllabus
    syllabus.currentSemester = currentSemester;
    syllabus.currentAcademicYear = parseInt(currentAcademicYear);
    syllabus.currentSemesterSubjects = semesterData.subjects;

    await syllabus.save();

    res.json({
      success: true,
      message: "Current semester set successfully",
      currentSemesterSubjects: semesterData.subjects,
    });
  } catch (error) {
    console.error("❌ Error setting current semester:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/syllabus/:id/assign-faculty
   Assign faculty to current semester subjects
   HOD only - can assign faculty or HOD
   ───────────────────────────────────────────────────────────── */
router.post("/:id/assign-faculty", protect, hodOnly, async (req, res) => {
  try {
    const { assignments } = req.body; // [{subjectCode, facultyId}, ...]

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ message: "Invalid assignments format" });
    }

    if (assignments.length === 0) {
      return res.status(400).json({ message: "No assignments provided" });
    }

    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    // Get unique faculty IDs from assignments
    const uniqueFacultyIds = [...new Set(assignments.map((a) => a.facultyId))];

    // Validate all faculty IDs are valid ObjectIds
    const mongoose = require("mongoose");
    const validFacultyIds = uniqueFacultyIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (validFacultyIds.length !== uniqueFacultyIds.length) {
      return res.status(400).json({
        message: "Some faculty IDs are invalid ObjectIds",
      });
    }

    // Convert to ObjectIds
    const facultyObjectIds = validFacultyIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    // Find faculty - only check unique IDs
    const faculty = await User.find({
      _id: { $in: facultyObjectIds },
      department: syllabus.department,
      role: { $in: ["faculty", "hod"] },
    }).select("_id name email role");

    // Check if all unique faculty were found
    if (faculty.length !== validFacultyIds.length) {
      const foundIds = faculty.map((f) => f._id.toString());
      const missingIds = validFacultyIds.filter(
        (id) => !foundIds.includes(id.toString()),
      );

      return res.status(400).json({
        message: `Found ${faculty.length} faculty but expected ${validFacultyIds.length}. Missing IDs: ${missingIds.join(", ")}`,
      });
    }

    // Validate all subject codes exist in currentSemesterSubjects
    const subjectCodes = syllabus.currentSemesterSubjects.map((s) => s.code);
    const assignmentCodes = assignments.map((a) => a.subjectCode);
    const invalidCodes = assignmentCodes.filter(
      (code) => !subjectCodes.includes(code),
    );

    if (invalidCodes.length > 0) {
      return res.status(400).json({
        message: `Invalid subject codes: ${invalidCodes.join(", ")}`,
      });
    }

    // Update current semester subjects with faculty assignments
    syllabus.currentSemesterSubjects = syllabus.currentSemesterSubjects.map(
      (subject) => {
        const assignment = assignments.find(
          (a) => a.subjectCode === subject.code,
        );

        return {
          ...subject,
          assignedFaculty: assignment
            ? new mongoose.Types.ObjectId(assignment.facultyId)
            : subject.assignedFaculty || null,
        };
      },
    );

    syllabus.facultyAssigned = true;
    syllabus.assignedAt = new Date();
    await syllabus.save();

    res.json({
      success: true,
      message: "Faculty assigned successfully to all subjects",
      totalAssignments: assignments.length,
      uniqueFaculty: validFacultyIds.length,
      subjects: syllabus.currentSemesterSubjects,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to assign faculty",
    });
  }
});
/* ─────────────────────────────────────────────────────────────
   GET /api/syllabus/:id
   Get syllabus details
   ───────────────────────────────────────────────────────────── */
router.get("/:id", protect, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id).populate(
      "uploadedBy",
      "name email",
    );

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/syllabus/department/:department
   Get all syllabi for a department
   HOD only
   ───────────────────────────────────────────────────────────── */
router.get("/department/:department", protect, hodOnly, async (req, res) => {
  try {
    const syllabi = await Syllabus.find({
      department: req.params.department,
    }).populate("uploadedBy", "name email");

    res.json(syllabi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/syllabus/:id/semesters
   Get all semesters data from a syllabus
   ───────────────────────────────────────────────────────────── */
router.get("/:id/semesters", protect, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .populate("allSemesters.subjects.assignedFaculty", "name email role");

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    // Determine type based on allSemesters length
    const isFourYear = syllabus.allSemesters.length >= 8;

    res.json({
      success: true,
      syllabus: {
        _id: syllabus._id,
        department: syllabus.department,
        batch: syllabus.batch,
        uploadedBy: syllabus.uploadedBy,
        fileName: syllabus.fileName,
        isFourYear,
        currentSemester: syllabus.currentSemester,
        currentAcademicYear: syllabus.currentAcademicYear,
        facultyAssigned: syllabus.facultyAssigned,
        assignedAt: syllabus.assignedAt,
      },
      allSemesters: syllabus.allSemesters.sort((a, b) => {
        // Sort by year first, then by semester number
        if (a.year !== b.year) return a.year - b.year;
        const semA = parseInt(a.semester.split(" ")[0]);
        const semB = parseInt(b.semester.split(" ")[0]);
        return semA - semB;
      }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/syllabus/:id/semester/:semesterName/:year
   Get specific semester data
   ───────────────────────────────────────────────────────────── */
router.get("/:id/semester/:semesterName/:year", protect, async (req, res) => {
  try {
    const { semesterName, year } = req.params;

    const syllabus = await Syllabus.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .populate("allSemesters.subjects.assignedFaculty", "name email role");

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    const semesterData = syllabus.allSemesters.find(
      (s) => s.semester === semesterName && s.year === parseInt(year),
    );

    if (!semesterData) {
      return res.status(404).json({ message: "Semester not found" });
    }

    res.json({
      success: true,
      semester: semesterData,
      department: syllabus.department,
      batch: syllabus.batch,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
