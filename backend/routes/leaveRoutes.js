const express = require("express");
const router = express.Router();

const Leave = require("../models/leaveModel");
const LeaveBalance = require("../models/leaveBalanceModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const Timetable = require("../models/timetableModel");
const FacultyTimetable = require("../models/facultyTimetableModel");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/leaveUpload");
const cloudinary = require("../config/cloudinary");

const {
  suggestSubstitutes,
  analyzeWorkloadImpact,
  predictLeaveRisk,
  generateRecommendations,
  detectAnomalies,
} = require("../utils/aiEngine");

/* ─── Cloudinary helper ─────────────────────────────────────── */
const uploadToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "auto" }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
      .end(fileBuffer);
  });

/* ─── constants ──────────────────────────────────────────────── */
const ADVANCE_NOTICE_EXEMPT = ["casual", "medical"];
const ADVANCE_NOTICE_DAYS = 4; // working days
const EL_ACCRUAL_FRACTION = 1 / 3;
const ML_CERTIFICATE_REQUIRED = true;

/* Leaves whose balance is tracked */
const TRACKED_LEAVE_TYPES = ["casual", "medical"];

/* helpers */
const toBool = (v) => v === true || v === "true";
const toNum = (v, fallback = 0) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  const s = v.trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
};

const workingDaysUntil = (targetDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  if (target <= today) return 0;

  let count = 0;
  const d = new Date(today);
  while (d < target) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++; // Mon–Fri
  }
  return count;
};

const getDeductionDays = (leave) => {
  // Policy: CL can be half-day; deduct 0.5 in that case.
  if (leave.leaveType === "casual" && leave.dayType === "HALF") return 0.5;
  // Default: deduct workingDays if present, else totalDays
  return leave.workingDays || leave.totalDays;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const enumerateDaysInclusive = (startDate, endDate) => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const days = [];
  const cur = new Date(s);
  while (cur <= e) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const extractFacultySlotsFromTimetables = (
  timetables,
  facultyId,
  dayNameSet,
) => {
  const fid = facultyId?.toString?.()
    ? facultyId.toString()
    : String(facultyId);
  const slots = new Set();

  for (const tt of timetables) {
    const schedule = tt?.schedule;
    if (!schedule) continue;

    // Mongoose Map supports forEach
    schedule.forEach((cell, key) => {
      const day = String(key).split("-")[0];
      if (!dayNameSet.has(day)) return;

      if (!cell) return;
      const cellFaculty = cell.faculty?.toString?.()
        ? cell.faculty.toString()
        : cell.faculty
          ? String(cell.faculty)
          : null;

      if (cellFaculty && cellFaculty === fid) {
        slots.add(String(key));
        return;
      }

      const batches = Array.isArray(cell.batches) ? cell.batches : [];
      for (const b of batches) {
        const bf = b?.faculty?.toString?.()
          ? b.faculty.toString()
          : b?.faculty
            ? String(b.faculty)
            : null;
        if (bf && bf === fid) {
          slots.add(String(key));
          return;
        }
      }
    });
  }

  return slots;
};

const extractBusySlotsForCandidate = (timetables, candidateId, dayNameSet) => {
  return extractFacultySlotsFromTimetables(timetables, candidateId, dayNameSet);
};

const computeLeaveAffectedSlotsFromFacultyUpload = async (
  facultyId,
  sd,
  ed,
) => {
  const tt = await FacultyTimetable.findOne({ faculty: facultyId }).lean();
  const busy = new Set((tt?.busySlots || []).map((s) => String(s)));
  if (busy.size === 0) return new Set();

  const dayNamesInRange = new Set(
    enumerateDaysInclusive(sd, ed)
      .map((d) => DAY_NAMES[d.getDay()])
      .filter((n) => n !== "Sunday"),
  );

  const affected = new Set();
  for (const slot of busy) {
    const day = slot.split("-")[0];
    if (dayNamesInRange.has(day)) affected.add(slot);
  }
  return affected;
};

/* ─────────────────────────────────────────────────────────────
   GET /api/leaves
   Faculty: own leaves | HOD/Admin: all leaves
   ───────────────────────────────────────────────────────────── */
router.get("/", protect, async (req, res) => {
  try {
    const query = req.user.role === "faculty" ? { faculty: req.user._id } : {};
    const leaves = await Leave.find(query)
      .populate("faculty", "name email department designation role")
      .populate("hodApproval.approvedBy", "name email")
      .populate("principalApproval.approvedBy", "name email")
      .populate("substituteAssigned", "name email department")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/leaves/balance
   ───────────────────────────────────────────────────────────── */
router.get("/balance", protect, async (req, res) => {
  try {
    const balance = await LeaveBalance.getOrCreateForUser(req.user._id);
    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/leaves/ai-insights
   ──────────────���────────────────────────────────────────────── */
router.get("/ai-insights", protect, async (req, res) => {
  try {
    const leaveHistory = await Leave.find({
      faculty: req.user._id,
      status: { $in: ["approved", "rejected"] },
    });
    const currentLeaves = await Leave.find({ status: "pending" });
    const allLeaves = await Leave.find({ status: "approved" });

    res.json({
      riskScore: predictLeaveRisk(leaveHistory),
      recommendations: generateRecommendations(
        req.user,
        leaveHistory,
        currentLeaves,
      ),
      anomalies: detectAnomalies(leaveHistory),
      workloadImpact: analyzeWorkloadImpact(allLeaves, req.user.department),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/leaves/substitutes
   ───────────────────────────────────────────────────────────── */
router.get("/substitutes", protect, async (req, res) => {
  try {
    const available = await User.find({ isAvailable: true, role: "faculty" });
    res.json(suggestSubstitutes(available, req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/leaves — Apply for leave (JSON or multipart)
   attachment field: "attachment"
   ───────────────────────────────────────────────────────────── */
router.post("/", protect, upload.single("attachment"), async (req, res) => {
  try {
    const leaveType = req.body.leaveType;
    const startDateRaw = req.body.startDate;
    const endDateRaw = req.body.endDate;
    const reason = req.body.reason;

    const dayType = req.body.dayType || "FULL";
    const halfSession =
      dayType === "HALF" ? req.body.halfSession || "FN" : null;

    const substituteRequested = req.body.substituteRequested || "";
    const affectedClasses = toArray(req.body.affectedClasses);

    const isUrgent = toBool(req.body.isUrgent);
    const elDetentionDays = toNum(req.body.elDetentionDays, 0);
    const coHolidaysWorked = toNum(req.body.coHolidaysWorked, 0);
    const isDuringExamPeriod = toBool(req.body.isDuringExamPeriod);
    const isDuringTeaching = toBool(req.body.isDuringTeaching);

    if (!leaveType || !startDateRaw || !endDateRaw || !reason) {
      return res.status(400).json({
        message: "leaveType, startDate, endDate and reason are required.",
      });
    }

    if (!Leave.LEAVE_TYPES.includes(leaveType)) {
      return res.status(400).json({
        message: `Invalid leaveType. Allowed: ${Leave.LEAVE_TYPES.join(", ")}`,
      });
    }

    const sd = new Date(startDateRaw);
    const ed = new Date(endDateRaw);
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
      return res.status(400).json({ message: "Invalid startDate or endDate." });
    }
    if (ed < sd) {
      return res
        .status(400)
        .json({ message: "endDate cannot be before startDate." });
    }

    // CO restriction (you already had)
    const adminOnly = ["compensatory"];
    if (adminOnly.includes(leaveType) && req.user.role === "faculty") {
      return res.status(400).json({
        message:
          "Compensatory Leave is only applicable to administrative and supporting staff.",
      });
    }

    // Half-day only CL and same date
    if (dayType === "HALF") {
      if (leaveType !== "casual") {
        return res
          .status(400)
          .json({ message: "Half-day is allowed only for Casual Leave." });
      }
      if (sd.toDateString() !== ed.toDateString()) {
        return res
          .status(400)
          .json({ message: "Half-day leave must be for a single date." });
      }
    }

    // CL max 3 continuous (sandwich counted)
    if (leaveType === "casual") {
      Leave.validateCasualMaxContinuous(sd, ed, dayType);
    }

    // advance notice -> treat as LWP except CL/ML
    const advanceDays = workingDaysUntil(sd);
    const treatAsLWP =
      !ADVANCE_NOTICE_EXEMPT.includes(leaveType) &&
      advanceDays < ADVANCE_NOTICE_DAYS;

    const totalDays = Leave.calcCalendarDays(sd, ed);
    const workingDays = Leave.calcWorkingDays(sd, ed);

    // ML certificate rules
    const mlCertificateRequired =
      leaveType === "medical" && ML_CERTIFICATE_REQUIRED;
    const fitnessCertificateRequired =
      leaveType === "medical" && totalDays >= 3;

    if (req.file && leaveType !== "medical") {
      return res.status(400).json({
        message: "Attachment upload is only allowed for medical leave.",
      });
    }
    if (mlCertificateRequired && !req.file) {
      return res.status(400).json({
        message: "Medical leave requires uploading a certificate (attachment).",
      });
    }

    // balance check for tracked leave
    if (TRACKED_LEAVE_TYPES.includes(leaveType)) {
      const balance = await LeaveBalance.getOrCreateForUser(req.user._id);
      const balKey = Leave.BALANCE_KEY_MAP[leaveType];

      const requested =
        leaveType === "casual" && dayType === "HALF" ? 0.5 : workingDays;
      const remaining = balance?.[balKey]
        ? balance[balKey].total - balance[balKey].used
        : null;

      if (remaining !== null && requested > remaining) {
        return res.status(400).json({
          message:
            `Insufficient ${leaveType} leave. Available: ${remaining} day(s). ` +
            `Excess days may be treated as Leave Without Pay.`,
          remaining,
        });
      }
    }

    // ✅ Substitute auto-suggest using timetable availability (AI + schedule constraints)
    const department = req.user.department;
    const timetables = await Timetable.find({
      department,
      isActive: true,
    }).select("schedule department");

    const dayNamesInRange = new Set(
      enumerateDaysInclusive(sd, ed)
        .map((d) => DAY_NAMES[d.getDay()])
        .filter((n) => n !== "Sunday"),
    );

    // Find which timetable slots the requesting faculty actually teaches during the leave days
    const affectedSlotsFromTimetable = extractFacultySlotsFromTimetables(
      timetables,
      req.user._id,
      dayNamesInRange,
    );

    // If UI provided affectedClasses, merge them (optional)
    const affectedSlots = new Set([
      ...Array.from(affectedSlotsFromTimetable),
      ...(affectedClasses || []),
    ]);

    const availableFaculty = await User.find({
      isAvailable: true,
      role: "faculty",
      department,
    }).select("_id name email department subjects isAvailable");

    const timetableFiltered = availableFaculty.filter((candidate) => {
      if (candidate._id.toString() === req.user._id.toString()) return false;
      if (affectedSlots.size === 0) return true; // nothing to check
      const busy = extractBusySlotsForCandidate(
        timetables,
        candidate._id,
        dayNamesInRange,
      );
      for (const slot of affectedSlots) {
        if (busy.has(String(slot))) return false;
      }
      return true;
    });

    const autoSub =
      suggestSubstitutes(timetableFiltered, req.user)[0]?._id || null;
    const history = await Leave.find({ faculty: req.user._id });

    /* Upload attachment to Cloudinary if present */
    let attachmentUrl = null;
    let attachmentPublicId = null;
    if (req.file) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "leave-certificates",
      );
      attachmentUrl = uploaded.secure_url;
      attachmentPublicId = uploaded.public_id;
    }

    const leave = await Leave.create({
      faculty: req.user._id,
      leaveType,

      startDate: sd,
      endDate: ed,

      totalDays,
      workingDays,
      sandwichCountedDays: totalDays,

      dayType,
      halfSession,

      reason,
      treatAsLWP,
      advanceNoticeDays: advanceDays,

      substituteRequested,
      substituteAssigned: autoSub,

      affectedClasses: Array.from(affectedSlots),
      isUrgent: isUrgent || false,
      isDuringExamPeriod: isDuringExamPeriod || false,
      isDuringTeaching: isDuringTeaching || false,

      elDetentionDays: elDetentionDays || 0,
      coHolidaysWorked: coHolidaysWorked || 0,

      mlCertificateRequired,
      mlCertificateReceived: false,
      mlCertificateAttachment: attachmentUrl,
      mlCertificatePublicId: attachmentPublicId,
      fitnessCertificateRequired,

      aiPredictionScore: predictLeaveRisk(history),
    });

    const admins = await User.find({ role: { $in: ["admin", "hod"] } });
    const lwpNote = treatAsLWP
      ? " ⚠ Notice < 4 working days — may be treated as LWP."
      : "";
    await Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        sender: req.user._id,
        type: "leave_applied",
        message:
          `${req.user.name} applied for ${leaveType} leave ` +
          `(${sd.toDateString()} → ${ed.toDateString()}, ${totalDays} day(s)).${lwpNote}`,
        relatedLeave: leave._id,
      })),
    );

    const populated = await Leave.findById(leave._id)
      .populate("faculty", "name email department designation")
      .populate("substituteAssigned", "name email department");

    res.status(201).json(populated);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/leaves/:id/hod-approve
   ───────────────────────────────────────────────────────────── */
router.put("/:id/hod-approve", protect, async (req, res) => {
  try {
    if (req.user.role !== "hod" && req.user.role !== "admin")
      return res.status(403).json({ message: "HOD access required" });

    const leave = await Leave.findById(req.params.id).populate("faculty");
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "pending")
      return res.status(400).json({ message: "Leave is not in pending state" });

    leave.status = "hod_approved";
    leave.hodApproval = {
      approvedBy: req.user._id,
      approvalDate: new Date(),
      remarks: req.body.remarks || "",
    };
    await leave.save();

    const principals = await User.find({ role: "admin" });
    await Notification.insertMany(
      principals.map((p) => ({
        recipient: p._id,
        sender: req.user._id,
        type: "leave_applied",
        message: `HOD ${req.user.name} approved ${leave.faculty.name}'s ${leave.leaveType} leave. Awaiting principal approval.`,
        relatedLeave: leave._id,
      })),
    );

    await Notification.create({
      recipient: leave.faculty._id,
      sender: req.user._id,
      type: "leave_approved",
      message: `Your ${leave.leaveType} leave has been approved by HOD ${req.user.name}. Awaiting principal/management approval.`,
      relatedLeave: leave._id,
    });

    res.json({ message: "HOD approval granted", leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/leaves/:id/approve (Principal/Admin final)
   Deduct leave balance here (policy)
   ───────────────────────────────────────────────────────────── */
router.put("/:id/approve", protect, async (req, res) => {
  try {
    if (req.user.role === "faculty")
      return res.status(403).json({ message: "Not authorized" });

    const leave = await Leave.findById(req.params.id).populate("faculty");
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.status !== "hod_approved" && leave.status !== "pending") {
      return res.status(400).json({
        message: "Leave must be HOD-approved before principal approval",
      });
    }

    leave.status = "approved";
    leave.principalApproval = {
      approvedBy: req.user._id,
      approvalDate: new Date(),
      remarks: req.body.remarks || "",
    };
    await leave.save();

    // ✅ On approval: assign substitute using uploaded faculty timetables (same department)
    try {
      if (!leave.substituteAssigned && leave.faculty?.department) {
        const sd = new Date(leave.startDate);
        const ed = new Date(leave.endDate);

        // slots the requesting faculty is busy on those days (from their uploaded weekly timetable)
        const affectedSlots = await computeLeaveAffectedSlotsFromFacultyUpload(
          leave.faculty._id,
          sd,
          ed,
        );

        const candidates = await User.find({
          role: "faculty",
          isAvailable: true,
          department: leave.faculty.department, // ✅ same department only
          _id: { $ne: leave.faculty._id },
        }).select("_id name email department subjects isAvailable");

        let filtered = candidates;
        if (affectedSlots.size > 0) {
          const candidateIds = candidates.map((c) => c._id);
          const tts = await FacultyTimetable.find({
            faculty: { $in: candidateIds },
          })
            .select("faculty busySlots")
            .lean();
          const byFaculty = new Map(
            tts.map((t) => [
              String(t.faculty),
              new Set((t.busySlots || []).map(String)),
            ]),
          );

          // If a candidate has no uploaded timetable, we treat them as "unknown availability" and allow them.
          filtered = candidates.filter((c) => {
            const busy = byFaculty.get(String(c._id));
            if (!busy) return true;
            for (const slot of affectedSlots) {
              if (busy.has(String(slot))) return false;
            }
            return true;
          });
        }

        const best =
          suggestSubstitutes(filtered, leave.faculty)[0]?._id || null;

        if (best) {
          leave.substituteAssigned = best;
          await leave.save();

          await Notification.insertMany([
            {
              recipient: best,
              sender: req.user._id,
              type: "substitute_assigned",
              message: `You have been assigned as a substitute for ${leave.faculty.name}'s leave (${new Date(
                leave.startDate,
              ).toDateString()} → ${new Date(leave.endDate).toDateString()}).`,
              relatedLeave: leave._id,
            },
            {
              recipient: leave.faculty._id,
              sender: req.user._id,
              type: "substitute_assigned",
              message:
                "A substitute has been assigned for your approved leave.",
              relatedLeave: leave._id,
            },
          ]);
        }
      }
    } catch (e) {
      // Keep approval successful even if assignment fails
      console.error("Substitute auto-assign on approval failed:", e);
    }

    // ✅ Deduct balance for tracked leave types
    const balKey = Leave.BALANCE_KEY_MAP[leave.leaveType];
    if (balKey && TRACKED_LEAVE_TYPES.includes(leave.leaveType)) {
      const balance = await LeaveBalance.getOrCreateForUser(leave.faculty._id);
      const deduction = getDeductionDays(leave);

      if (balance?.[balKey]) {
        balance[balKey].used += deduction;
        await balance.save();
      }
    }

    const lwpNote = leave.treatAsLWP
      ? " Note: Notice < 4 working days — this may be processed as Leave Without Pay."
      : "";

    await Notification.create({
      recipient: leave.faculty._id,
      sender: req.user._id,
      type: "leave_approved",
      message: `Your ${leave.leaveType} leave has been fully approved by ${req.user.name}.${lwpNote}`,
      relatedLeave: leave._id,
    });

    res.json({ message: "Leave approved", leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
