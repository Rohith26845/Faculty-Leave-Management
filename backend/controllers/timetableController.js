const Timetable = require("../models/timetableModel");
const Syllabus = require("../models/syllabusModel");
const User = require("../models/userModel");

/**
 * GET /api/timetable/init-data
 */
exports.getInitData = async (req, res) => {
  try {
    const { department, semester } = req.query;
    console.log("\n========== TIMETABLE INIT DATA REQUEST ==========");
    console.log("📍 Query Params:", { department, semester });

    // Step 1: Check all syllabuses in database
    console.log("\n📚 Step 1: Fetching all syllabuses...");
    const allSyllabuses = await Syllabus.find().select(
      "department currentSemester currentSemesterSubjects",
    );
    console.log(`✅ Total syllabuses in DB: ${allSyllabuses.length}`);

    allSyllabuses.forEach((syl, idx) => {
      console.log(
        `  [${idx + 1}] Department: "${syl.department}", Semester: "${syl.currentSemester}", Subjects: ${syl.currentSemesterSubjects?.length || 0}`,
      );
    });

    // Step 2: Try exact match
    console.log(
      `\n🔍 Step 2: Trying exact match - department="${department}", currentSemester="${semester}th Semester"`,
    );
    let syllabus = await Syllabus.findOne({
      department,
      currentSemester: `${semester}th Semester`,
    }).lean();

    if (syllabus) {
      console.log(`✅ Found syllabus with exact match`);
    } else {
      console.log(`❌ No exact match found`);

      // Step 3: Try partial match
      console.log(
        `\n🔍 Step 3: Trying partial match - just department="${department}"`,
      );
      syllabus = await Syllabus.findOne({ department }).lean();

      if (syllabus) {
        console.log(`✅ Found syllabus with department match`);
        console.log(
          `   - currentSemester in DB: "${syllabus.currentSemester}"`,
        );
        console.log(`   - Looking for: "${semester}th Semester"`);
      } else {
        console.log(`❌ No syllabus found for department "${department}"`);
      }
    }

    let subjects = [];

    if (syllabus && syllabus.currentSemesterSubjects) {
      console.log(`\n📖 Step 4: Extracting subjects...`);
      console.log(
        `✅ Found ${syllabus.currentSemesterSubjects.length} subjects in currentSemesterSubjects`,
      );

      subjects = syllabus.currentSemesterSubjects.map((subject) => {
        console.log(`   - ${subject.code}: ${subject.name}`);
        return {
          _id: subject._id,
          code: subject.code,
          name: subject.name,
          credits: subject.credits,
          description: subject.description,
          assignedFaculty: subject.assignedFaculty,
        };
      });
    } else {
      console.log(`\n⚠️ Step 4: No subjects found`);
      console.log(`   - Syllabus exists: ${!!syllabus}`);
      console.log(
        `   - Has currentSemesterSubjects: ${syllabus?.currentSemesterSubjects ? "Yes" : "No"}`,
      );
    }

    // Step 5: Fetch faculty
    console.log(`\n👥 Step 5: Fetching faculty...`);
    const faculty = await User.find({
      role: "faculty",
      department,
      isAvailable: true,
    }).select("_id name email designation");
    console.log(`✅ Found ${faculty.length} available faculty`);

    const defaultPeriodTimings = [
      { periodNumber: 1, startTime: "09:00", endTime: "10:00" },
      { periodNumber: 2, startTime: "10:00", endTime: "11:00" },
      { periodNumber: 3, startTime: "11:00", endTime: "12:00" },
      { periodNumber: 4, startTime: "12:00", endTime: "13:00" },
      { periodNumber: 5, startTime: "14:00", endTime: "15:00" },
      { periodNumber: 6, startTime: "15:00", endTime: "16:00" },
      { periodNumber: 7, startTime: "16:00", endTime: "17:00" },
      { periodNumber: 8, startTime: "17:00", endTime: "18:00" },
    ];

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
      "#F8B88B",
      "#ABEBC6",
      "#F5A962",
      "#A8D8EA",
      "#FF9999",
      "#FFCC99",
      "#99CCFF",
      "#99FF99",
      "#FF99CC",
      "#CCFF99",
      "#99FFCC",
      "#FFFF99",
    ];

    console.log(`\n✅ RESPONSE: Returning ${subjects.length} subjects\n`);

    return res.json({
      success: true,
      data: {
        subjects: subjects.length > 0 ? subjects : [],
        faculty: faculty.length > 0 ? faculty : [],
        defaultPeriodTimings,
        weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        colors,
        syllabusFound: !!syllabus,
        semesterInfo: {
          semester,
          department,
          subjectCount: subjects.length,
        },
      },
    });
  } catch (error) {
    console.error("❌ ERROR in getInitData:", error);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable initialization data",
      error: error.message,
    });
  }
};

/**
 * POST /api/timetable/create
 * Create new timetable with schedule
 * ✅ FIXED: Handle schedule as plain object, not Map
 */
exports.createTimetable = async (req, res) => {
  try {
    const { name, department, semester, schedule, subjects, periodTimings } =
      req.body;
    const userId = req.user._id;

    console.log("\n========== CREATE TIMETABLE REQUEST ==========");
    console.log("📋 Name:", name);
    console.log("🏢 Department:", department);
    console.log("📚 Semester:", semester);
    console.log("📅 Schedule keys:", Object.keys(schedule || {}).length);

    // Verify user is HOD of this department
    const user = await User.findById(userId);
    if (user.role !== "hod" || user.department !== department) {
      return res.status(403).json({
        success: false,
        message: "Only HOD of this department can create timetables",
      });
    }

    console.log("✅ User verified as HOD");

    // ✅ Convert schedule object to Map, then validate
    const scheduleMap = new Map(Object.entries(schedule || {}));
    console.log(`📍 Schedule has ${scheduleMap.size} cells`);

    // Validate for conflicts
    const { hasConflicts, conflicts } =
      await validateTimetableConflicts(scheduleMap);

    console.log(`⚠️ Conflicts check - hasConflicts: ${hasConflicts}`);
    if (conflicts.length > 0) {
      console.log("Conflict details:", conflicts);
    }

    // Create timetable
    const timetable = await Timetable.create({
      name,
      department,
      semester,
      createdBy: userId,
      schedule, // ✅ Store as plain object (Mongoose handles conversion)
      subjects,
      periodTimings,
      hasConflicts,
      conflictDetails: conflicts,
    });

    console.log("✅ Timetable created:", timetable._id);

    return res.status(201).json({
      success: true,
      message: "Timetable created successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("❌ Error creating timetable:", error);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/timetable/:id
 * Get timetable details
 */
exports.getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("schedule.*.subject")
      .populate("schedule.*.faculty", "name email");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    return res.json({ success: true, data: timetable });
  } catch (error) {
    console.error("❌ Error fetching timetable:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/timetable/:id/update-cell
 * Update a single cell in timetable
 */
exports.updateTimetableCell = async (req, res) => {
  try {
    const { cellKey, subject, faculty, room } = req.body;
    const timetableId = req.params.id;

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    // Update the cell
    timetable.schedule.set(cellKey, {
      subject,
      faculty,
      room: room || "",
    });

    // Validate conflicts again
    const { hasConflicts, conflicts } = await validateTimetableConflicts(
      timetable.schedule,
    );
    timetable.hasConflicts = hasConflicts;
    timetable.conflictDetails = conflicts;

    await timetable.save();

    console.log("✅ Cell updated:", cellKey);

    return res.json({
      success: true,
      message: "Cell updated successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("❌ Error updating cell:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ✅ FIXED: Validate timetable for faculty/subject conflicts
 * Now accepts Map object properly
 */
const validateTimetableConflicts = async (schedule) => {
  try {
    const conflicts = [];

    // ✅ Handle both Map and Object
    let scheduleEntries = [];
    if (schedule instanceof Map) {
      scheduleEntries = Array.from(schedule.entries());
    } else if (typeof schedule === "object" && schedule !== null) {
      scheduleEntries = Object.entries(schedule);
    } else {
      console.warn("⚠️ Schedule is neither Map nor Object:", typeof schedule);
      return { hasConflicts: false, conflicts: [] };
    }

    console.log(
      `🔍 Validating ${scheduleEntries.length} cells for conflicts...`,
    );

    // Check for faculty teaching in multiple rooms at same time
    const facultySlots = {};

    for (const [key, value] of scheduleEntries) {
      if (!value || !value.faculty) continue;

      // Handle both string and ObjectId
      const facultyId = value.faculty?.toString
        ? value.faculty.toString()
        : value.faculty;

      if (!facultySlots[facultyId]) {
        facultySlots[facultyId] = [];
      }
      facultySlots[facultyId].push(key);
    }

    console.log(
      `👥 Found ${Object.keys(facultySlots).length} unique faculty members`,
    );

    // Analyze for conflicts
    for (const [facultyId, slots] of Object.entries(facultySlots)) {
      if (slots.length > 1) {
        // Extract time from slot (e.g., "Monday-09:00" -> "09:00")
        const times = slots.map((slot) => slot.split("-")[1]);
        const uniqueTimes = new Set(times);

        if (uniqueTimes.size < slots.length) {
          // Faculty has same time slot on multiple days (which is fine)
          // But check if they're on the same day
          const dayTimeMap = {};
          slots.forEach((slot) => {
            const [day, time] = slot.split("-");
            const key = `${day}-${time}`;
            if (dayTimeMap[key]) {
              conflicts.push(
                `Faculty ${facultyId} has overlapping class at ${key}`,
              );
            }
            dayTimeMap[key] = true;
          });
        }
      }
    }

    console.log(`⚠️ Found ${conflicts.length} conflicts`);
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  } catch (error) {
    console.error("❌ Error in validateTimetableConflicts:", error);
    return {
      hasConflicts: false,
      conflicts: [`Validation error: ${error.message}`],
    };
  }
};

/**
 * GET /api/timetable/department/:dept
 * Get all timetables for a department
 */
exports.getDepartmentTimetables = async (req, res) => {
  try {
    const { dept } = req.params;
    const timetables = await Timetable.find({
      department: dept,
      isActive: true,
    }).select("_id name semester isPublished hasConflicts createdAt");

    return res.json({ success: true, data: timetables });
  } catch (error) {
    console.error("❌ Error fetching timetables:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/timetable/:id/publish
 * Publish timetable (make it visible to students/faculty)
 */
exports.publishTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    if (timetable.hasConflicts) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish timetable with conflicts",
        conflicts: timetable.conflictDetails,
      });
    }

    timetable.isPublished = true;
    await timetable.save();

    console.log("✅ Timetable published:", timetable._id);

    return res.json({
      success: true,
      message: "Timetable published successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("❌ Error publishing timetable:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
