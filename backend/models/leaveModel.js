const mongoose = require("mongoose");

/* ─────────────────────────────────────────────────────────────
   Pillai College of Engineering — Leave Model (Policy-aligned)
   - Supports ML certificate uploads
   - Supports CL half-day and max 3 continuous CL
   ───────────────────────────────────────────────────────────── */

const LEAVE_TYPES = [
  "casual", // CL
  "medical", // ML
  "earned", // EL
  "compensatory", // CO
  "onDuty", // OD
  "special", // SP
  "leaveWithoutPay", // LWP
  "maternity", // MA
];

/* Map leaveType → leaveBalanceModel field name (keep existing keys too) */
const BALANCE_KEY_MAP = {
  casual: "casual",
  medical: "medical",
  earned: "earned",
  compensatory: "compensatory",
  onDuty: "onDuty",
  special: "special",
  leaveWithoutPay: "leaveWithoutPay",
  maternity: "maternity",
};

const leaveSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    leaveType: {
      type: String,
      enum: LEAVE_TYPES,
      required: true,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    /**
     * totalDays: calendar days inclusive (includes "sandwiched" weekend/holiday days)
     * workingDays: Mon–Sat excluding Sundays (your current rule)
     */
    totalDays: { type: Number, required: true },
    workingDays: { type: Number, default: 0 },

    /**
     * Policy: holidays/weekend "sandwiched" in CL are counted as CL.
     * We use calendar days as sandwichCountedDays. (Holiday calendar can be added later.)
     */
    sandwichCountedDays: { type: Number, default: 0 },

    /**
     * Half-day allowed for CL only.
     * dayType affects how leave balance should be deducted on approval (0.5 vs 1 day).
     */
    dayType: { type: String, enum: ["FULL", "HALF"], default: "FULL" },
    halfSession: { type: String, enum: ["FN", "AN", null], default: null },

    reason: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "hod_approved", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    hodApproval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvalDate: { type: Date },
      remarks: { type: String },
    },
    principalApproval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvalDate: { type: Date },
      remarks: { type: String },
    },

    rejectionReason: { type: String },

    advanceNoticeDays: { type: Number, default: 0 },
    treatAsLWP: { type: Boolean, default: false },

    substituteRequested: { type: String, default: "" },
    substituteAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    substituteConfirmed: { type: Boolean, default: false },

    /* ML specifics */
    mlCertificateRequired: { type: Boolean, default: false },
    mlCertificateReceived: { type: Boolean, default: false },

    // ✅ NEW: uploaded file path (pdf/image)
    mlCertificateAttachment: { type: String, default: null },
    mlCertificatePublicId: { type: String, default: null },

    // Policy: ML >= 3 days => also provide fitness certificate on return (tracked as requirement flag)
    fitnessCertificateRequired: { type: Boolean, default: false },

    /* EL specifics */
    elDetentionDays: { type: Number, default: 0 },

    /* CO specifics */
    coHolidaysWorked: { type: Number, default: 0 },

    /* Academic context */
    affectedClasses: [{ type: String }],
    isDuringExamPeriod: { type: Boolean, default: false },
    isDuringTeaching: { type: Boolean, default: false },

    /* LWP document tracking (optional policy hook) */
    documentsSubmitted: { type: Boolean, default: true },

    /* AI */
    aiPredictionScore: { type: Number },
    isUrgent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/* ── Static helpers ── */
leaveSchema.statics.LEAVE_TYPES = LEAVE_TYPES;
leaveSchema.statics.BALANCE_KEY_MAP = BALANCE_KEY_MAP;

leaveSchema.statics.calcCalendarDays = function (startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
};

leaveSchema.statics.calcWorkingDays = function (startDate, endDate) {
  let count = 0;
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    if (cur.getDay() !== 0) count++; // exclude Sunday
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

leaveSchema.statics.validateCasualMaxContinuous = function (
  startDate,
  endDate,
  dayType = "FULL",
) {
  // Policy: not more than 3 CLs in continuation (sandwich days count)
  // Half-day CL is only for a single day, so it is always valid here.
  if (dayType === "HALF") return;

  const days = this.calcCalendarDays(startDate, endDate);
  if (days > 3) {
    const err = new Error("Casual Leave cannot exceed 3 continuous days.");
    err.statusCode = 400;
    throw err;
  }
};

module.exports = mongoose.model("Leave", leaveSchema);
