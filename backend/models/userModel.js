const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * ✅ College departments and allowed programs (course) matrix
 */
const PROGRAMS = ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."];

const DEPARTMENT_PROGRAM_MATRIX = {
  "Computer Engineering": ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."],
  "Information Technology": ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."],
  "Mechanical Engineering": ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."],
  "Electronics & Computer Science": ["B.Tech (UG)"],
  "Electronics & Telecommunication": ["B.Tech (UG)"],
  "Automobile Engineering": ["B.Tech (UG)"],
  "Electronics Engineering": ["M.Tech (PG)", "Ph.D."],
  Administration: [],
};

const DEPARTMENTS = Object.keys(DEPARTMENT_PROGRAM_MATRIX);

const ROLES = ["faculty", "admin", "hod"];

/**
 * Staff category is needed for policy distinctions:
 * - Faculty (teaching)
 * - Technical staff
 * - Administrative staff
 * - Supporting staff
 */
const STAFF_CATEGORIES = [
  "faculty",
  "technical",
  "administrative",
  "supporting",
];

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ROLES,
      default: "faculty",
      required: true,
    },

    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    /**
     * ✅ program/course (B.Tech / M.Tech / Ph.D.)
     * Keep optional because older records won’t have it.
     */
    program: {
      type: String,
      enum: PROGRAMS,
    },

    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    avatarPublicId: { type: String },

    /**
     * ✅ Policy-required HR metadata
     */
    staffCategory: {
      type: String,
      enum: STAFF_CATEGORIES,
      // Most of your users are faculty accounts
      default: "faculty",
    },

    gender: {
      type: String,
      enum: GENDERS,
      default: "prefer_not_to_say",
    },

    joinDate: {
      type: Date,
      // optional, but needed to enforce maternity eligibility policy if you want it strict
      default: null,
    },

    isOnProbation: {
      type: Boolean,
      default: false,
    },

    probationEndDate: {
      type: Date,
      default: null,
    },

    isAvailable: { type: Boolean, default: true },
    subjects: [{ type: String }],
  },
  { timestamps: true },
);

/* ─────────────────────────────────────────────────────────────
   Helpers / validation (Fat Model)
   ───────────────────────────────────────────────────────────── */

userSchema.statics.ROLES = ROLES;
userSchema.statics.PROGRAMS = PROGRAMS;
userSchema.statics.DEPARTMENTS = DEPARTMENTS;
userSchema.statics.DEPARTMENT_PROGRAM_MATRIX = DEPARTMENT_PROGRAM_MATRIX;
userSchema.statics.STAFF_CATEGORIES = STAFF_CATEGORIES;
userSchema.statics.GENDERS = GENDERS;

userSchema.statics.isProgramAllowed = function (department, program) {
  if (!department || !program) return false;
  const allowed = DEPARTMENT_PROGRAM_MATRIX[department] || [];
  return allowed.includes(program);
};

userSchema.statics.getServiceYears = function (user, asOf = new Date()) {
  if (!user?.joinDate) return null;
  const jd = new Date(user.joinDate);
  const ms = asOf - jd;
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return ms / (1000 * 60 * 60 * 24 * 365.25);
};

userSchema.methods.setSubjects = function (subjects) {
  const normalized = (subjects || [])
    .map((s) => String(s).trim())
    .filter(Boolean);

  this.subjects = Array.from(new Set(normalized));
};

/**
 * ✅ STATIC: Admin creates a user (centralized validation here)
 */
userSchema.statics.createByAdmin = async function (actorUser, payload) {
  if (!actorUser || actorUser.role !== "admin") {
    const err = new Error("Admin access required");
    err.statusCode = 403;
    throw err;
  }

  const {
    name,
    email,
    password,
    role,
    department,
    program,
    designation,
    phone,
    subjects,

    // new optional HR fields
    staffCategory,
    gender,
    joinDate,
    isOnProbation,
    probationEndDate,
  } = payload || {};

  if (!name || !email || !password || !role || !department) {
    const err = new Error("Missing required fields");
    err.statusCode = 400;
    throw err;
  }

  if (!ROLES.includes(role)) {
    const err = new Error("Invalid role");
    err.statusCode = 400;
    throw err;
  }

  // faculty/hod should have a program
  if ((role === "faculty" || role === "hod") && !program) {
    const err = new Error("Program is required for faculty/HOD");
    err.statusCode = 400;
    throw err;
  }

  if (program && !this.isProgramAllowed(department, program)) {
    const err = new Error(
      "Selected program is not available for selected department",
    );
    err.statusCode = 400;
    throw err;
  }

  if (staffCategory && !STAFF_CATEGORIES.includes(staffCategory)) {
    const err = new Error("Invalid staffCategory");
    err.statusCode = 400;
    throw err;
  }

  if (gender && !GENDERS.includes(gender)) {
    const err = new Error("Invalid gender");
    err.statusCode = 400;
    throw err;
  }

  const existing = await this.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    const err = new Error("User already exists");
    err.statusCode = 400;
    throw err;
  }

  const user = new this({
    name,
    email,
    password,
    role,
    department,
    program: program || undefined,
    designation: designation || "",
    phone: phone || "",

    staffCategory:
      staffCategory ||
      (role === "faculty" || role === "hod" ? "faculty" : "administrative"),
    gender: gender || "prefer_not_to_say",
    joinDate: joinDate ? new Date(joinDate) : null,
    isOnProbation: typeof isOnProbation === "boolean" ? isOnProbation : false,
    probationEndDate: probationEndDate ? new Date(probationEndDate) : null,

    subjects: [],
  });

  user.setSubjects(subjects || []);
  await user.save();

  return user;
};

/**
 * ✅ STATIC: HOD assigns subjects
 */
userSchema.statics.assignSubjectsByHod = async function (
  actorUser,
  teacherId,
  subjects,
) {
  if (!actorUser || actorUser.role !== "hod") {
    const err = new Error("HOD access required");
    err.statusCode = 403;
    throw err;
  }

  const teacher = await this.findById(teacherId);
  if (!teacher) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (teacher.role !== "faculty") {
    const err = new Error("Subjects can be allocated only to faculty accounts");
    err.statusCode = 400;
    throw err;
  }

  if (teacher.department !== actorUser.department) {
    const err = new Error(
      "You can only allocate subjects within your department",
    );
    err.statusCode = 403;
    throw err;
  }

  teacher.setSubjects(subjects);
  await teacher.save();
  return teacher;
};

/* ── password hashing ── */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
