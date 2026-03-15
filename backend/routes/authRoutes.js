const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const { Readable } = require("stream");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const LeaveBalance = require("../models/leaveBalanceModel");
const { protect, adminOnly } = require("../middleware/auth");

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

/* ─────────────────────────────────────────────────────────────
   Password Generation Utility
   ───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   Password Generation Utility
   ───────────────────────────────────────────────────────────── */
function generateRandomPassword(length = 12) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  const allChars = uppercase + lowercase + numbers + symbols;
  let password = "";

  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/* ─────────────────────────────────────────────────────────────
   Row Validation Utility
   ───────────────────────────────────────────────────────────── */
function validateRow(
  name,
  email,
  phone,
  department,
  designation,
  role,
  program,
) {
  // Name validation
  if (!name || name.length < 2 || name.length > 100) {
    return { valid: false, error: "Name must be 2-100 characters" };
  }

  // Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Phone validation (10 digits)
  const phoneDigits = phone?.replace(/[^0-9]/g, "");
  if (!phoneDigits || phoneDigits.length !== 10) {
    return { valid: false, error: "Phone must be 10 digits" };
  }

  // Department validation
  const validDepts = [
    "Computer Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Electronics & Computer Science",
    "Electronics & Telecommunication",
    "Automobile Engineering",
    "Electronics Engineering",
  ];
  if (!department || !validDepts.includes(department)) {
    return { valid: false, error: "Invalid department" };
  }

  // Designation validation
  if (!designation || designation.length < 2) {
    return { valid: false, error: "Invalid designation" };
  }

  // Role validation (faculty or hod only) - case insensitive
  const validRoles = ["faculty", "hod"];
  if (!role || !validRoles.includes(role)) {
    return { valid: false, error: "Role must be 'faculty' or 'hod'" };
  }

  // Program validation (if provided)
  if (program) {
    const validPrograms = ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."];
    if (!validPrograms.includes(program)) {
      return { valid: false, error: "Invalid program" };
    }
  }

  return { valid: true };
}

/* ───────────��─────────────────────────────────────────────────
   POST /api/auth/create-user
   Create individual user (existing functionality)
   ───────────────────────────────────────────────────────────── */
router.post("/create-user", protect, async (req, res) => {
  try {
    const created = await User.createByAdmin(req.user, req.body);

    // create leave balance record for any staff account
    await LeaveBalance.create({ faculty: created._id });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        _id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
        department: created.department,
        program: created.program,
        designation: created.designation,
        phone: created.phone,
        subjects: created.subjects,
        avatar: created.avatar,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/import-csv
   Bulk import faculty and HOD via CSV
   Admin only
   ───────────────────────────────────────────────────────────── */
router.post(
  "/import-csv",
  protect,
  adminOnly,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const results = [];
      const created = [];
      const skipped = [];

      const stream = Readable.from([req.file.buffer.toString()]);

      stream
        .pipe(csv())
        .on("data", (row) => {
          const hasData = row.name?.trim() || row.email?.trim();
          if (hasData) {
            results.push(row);
          }
        })
        .on("end", async () => {
          console.log(`📊 Processing ${results.length} rows...`);

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNum = i + 2;

            let name = (row.name || "").trim();
            let email = (row.email || "").trim().toLowerCase();
            let phone = (row.phone || "").trim();
            let department = (row.department || "").trim();
            let designation = (row.designation || "").trim();
            let role = (row.role || "").trim().toLowerCase();
            let program = (row.program || "").trim() || null;

            if (!name && !email) {
              continue;
            }

            const validation = validateRow(
              name,
              email,
              phone,
              department,
              designation,
              role,
              program,
            );

            if (!validation.valid) {
              skipped.push({
                status: "error",
                row: rowNum,
                name: name || "N/A",
                email: email || "N/A",
                reason: validation.error,
              });
              continue;
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
              skipped.push({
                status: "duplicate",
                row: rowNum,
                name,
                email,
                reason: "Email already exists",
              });
              continue;
            }

            try {
              // ✅ Generate plain password - this will be hashed by pre-save hook
              const tempPassword = generateRandomPassword(12);

              console.log(
                `🔐 Creating user with plain password: ${tempPassword}`,
              );

              // ✅ Pass plain password - it will be hashed automatically by pre-save hook
              const newUser = await User.create({
                name,
                email,
                phone,
                department,
                designation,
                role,
                program: program || undefined,
                password: tempPassword, // ✅ Plain password - will be hashed
                isAvailable: true,
              });

              console.log(
                `✅ User created with hashed password for: ${newUser.email}`,
              );

              // Create leave balance record
              const currentYear = new Date().getFullYear();
              await LeaveBalance.create({
                faculty: newUser._id,
                academicYear: currentYear,
              });

              created.push({
                status: "success",
                row: rowNum,
                name,
                email,
                role,
                department,
                designation,
                password: tempPassword, // ✅ Store plain password for display to admin
              });
            } catch (err) {
              console.error(
                `❌ Error creating user row ${rowNum}:`,
                err.message,
              );
              skipped.push({
                status: "error",
                row: rowNum,
                name,
                email,
                reason: err.message,
              });
            }
          }

          const allResults = [...created, ...skipped];

          console.log(`\n📈 Import Summary:`);
          console.log(`✅ Created: ${created.length}`);
          console.log(`❌ Failed: ${skipped.length}`);
          console.log(`📊 Total: ${results.length}\n`);

          res.json({
            success: true,
            summary: {
              total: results.length,
              created: created.length,
              failed: skipped.length,
            },
            results: allResults,
          });
        })
        .on("error", (err) => {
          console.error("❌ CSV parsing error:", err);
          res.status(400).json({
            success: false,
            message: `CSV parsing error: ${err.message}`,
          });
        });
    } catch (error) {
      console.error("❌ Import error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/login
   User login
   ───────────────────────────────────────────────────────────── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    console.log("🔐 Login attempt for email:", email);

    // ✅ IMPORTANT: Use select("+password") to include password field
    const user = await User.findOne({
      email: String(email).toLowerCase(),
    }).select("+password");

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    console.log("✅ User found:", user.email);

    // ✅ Compare passwords using the method
    const isPasswordValid = await user.matchPassword(password);

    console.log("🔑 Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Password mismatch for user:", email);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ✅ Login successful
    console.log("✨ Login successful for:", user.email);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      program: user.program,
      designation: user.designation,
      phone: user.phone,
      subjects: user.subjects,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/export-passwords", protect, adminOnly, (req, res) => {
  try {
    // console.log("=== Export Passwords Request ==="); // ← Comment out logging
    // console.log("Body:", req.body);

    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: "No data to export" });
    }

    const successfulImports = results.filter((r) => r.status === "success");

    if (successfulImports.length === 0) {
      return res
        .status(400)
        .json({ message: "No successful imports to export" });
    }

    const csvLines = ["Name,Email,Role,Department,Designation,Password"];

    successfulImports.forEach((item) => {
      const line = [
        escapeCSVField(item.name || ""),
        escapeCSVField(item.email || ""),
        escapeCSVField(item.role || ""),
        escapeCSVField(item.department || ""),
        escapeCSVField(item.designation || ""),
        escapeCSVField(item.password || ""),
      ].join(",");

      csvLines.push(line);
    });

    const csvContent = csvLines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Length", Buffer.byteLength(csvContent));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="faculty-passwords-${new Date().toISOString().split("T")[0]}.csv"`,
    );

    res.end(csvContent, "utf8");
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   Helper: Escape CSV field values
   ───────────────────────────────────────────────────────────── */
function escapeCSVField(field) {
  try {
    // Convert to string and trim
    let str = String(field).trim();

    // If field contains comma, newline, or double quote, wrap in quotes
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      // Escape double quotes by doubling them
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    }

    return str;
  } catch (e) {
    console.error("Error escaping field:", field, e);
    return String(field);
  }
}
/* ─────────────────────────────────────────────────────────────
   GET /api/auth/me
   Get current user profile
   ───────────────────────────────────────────────────────────── */
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  return res.json(user);
});

module.exports = router;
