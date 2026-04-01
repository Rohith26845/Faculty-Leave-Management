import PredictiveInsightsCard from "../components/PredictiveInsightsCard";
import DepartmentPredictiveCard from "../components/DepartmentPredictiveCard";
import LeaveAnalytics from "../components/LeaveAnalytics";
import {
  BeachAccess,
  LocalHospital,
  Star,
  Repeat,
  AccountBalance,
  PauseCircle,
  WorkOff,
  Description,
  HourglassEmpty,
  People,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  LinearProgress,
  InputBase,
  Alert,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  EventNote,
  Search,
  FilterList,
  AutoAwesome,
  KeyboardArrowRight,
  CheckCircle,
  Warning,
  CheckCircleOutline,
  TimerOutlined,
  Done,
  Close,
  UnfoldMore,
  Info,
  BarChart,
} from "@mui/icons-material";
import { useAuth } from "../context/authContext";
import API, { getAvatarUrl } from "../api/axiosInstance";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const leaveTypeIcon = {
  casual: BeachAccess,
  medical: LocalHospital,
  earned: Star,
  compensatory: Repeat,
  onDuty: AccountBalance,
  special: PauseCircle,
  leaveWithoutPay: WorkOff,
};

const leaveTypeColor = {
  casual: "#7c3aed",
  medical: "#ef4444",
  earned: "#10b981",
  compensatory: "#0891b2",
  onDuty: "#8b5cf6",
  special: "#f59e0b",
  leaveWithoutPay: "#64748b",
};

const statusBadge = (status) =>
  ({
    pending: { label: "Pending", bg: "#fef9c3", color: "#854d0e" },
    hod_approved: { label: "HOD Approved", bg: "#dbeafe", color: "#1e40af" },
    approved: { label: "Approved", bg: "#dcfce7", color: "#166534" },
    rejected: { label: "Rejected", bg: "#fee2e2", color: "#991b1b" },
    cancelled: { label: "Cancelled", bg: "#f1f5f9", color: "#475569" },
  })[status] || { label: status, bg: "#f1f5f9", color: "#64748b" };

/* ── College Staff ID Card ───────────────────────────────── */
const CollegeStaffIDCard = ({ user }) => {
  const employeeId = user?._id?.slice(-8).toUpperCase() || "00000000";
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FA";
  const avatarUrl = getAvatarUrl(user?.avatar);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 630"
        width="100%"
        style={{ display: "block" }}
      >
        <defs>
          <filter
            id="card-shadow2"
            x="-10%"
            y="-10%"
            width="130%"
            height="130%"
          >
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="15"
              floodColor="#000000"
              floodOpacity="0.2"
            />
          </filter>
          <linearGradient
            id="lanyard-gradient2"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ff66b3" />
            <stop offset="100%" stopColor="#ff99cc" />
          </linearGradient>
          <linearGradient id="card-surface2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f2f5" />
          </linearGradient>
        </defs>

        <g filter="url(#card-shadow2)">
          <path
            d="M 35,80 L 75,80 L 90,50 L 208.4,50 L 223.4,80 L 263.4,80 A 15,15 0 0 1 278.4,95 L 278.4,575 A 25,25 0 0 1 253.4,600 L 45,600 A 25,25 0 0 1 20,575 L 20,95 A 15,15 0 0 1 35,80 Z"
            fill="#202124"
          />
          <rect x="114.2" y="60" width="70" height="10" rx="5" fill="#ffffff" />
          <rect
            x="30"
            y="90"
            width="238.4"
            height="495"
            rx="8"
            fill="url(#card-surface2)"
          />
          <rect x="15" y="280" width="25" height="120" rx="4" fill="#202124" />
          <rect
            x="258.4"
            y="280"
            width="25"
            height="120"
            rx="4"
            fill="#202124"
          />
          <rect x="15" y="570" width="20" height="15" rx="3" fill="#202124" />
          <rect
            x="263.4"
            y="570"
            width="20"
            height="15"
            rx="3"
            fill="#202124"
          />
        </g>

        <path
          d="M 124.2,0 L 174.2,0 L 174.2,55 L 124.2,55 Z"
          fill="url(#lanyard-gradient2)"
        />
        <circle
          cx="149.2"
          cy="25"
          r="6"
          fill="#e0e0e0"
          stroke="#a0a0a0"
          strokeWidth="1"
        />
        <circle cx="149.2" cy="25" r="3" fill="#c0c0c0" />
        <rect x="134.2" y="45" width="30" height="25" rx="4" fill="#111111" />
      </svg>

      <Box
        sx={{
          position: "absolute",
          top: "14.29%",
          left: "10%",
          width: "79.47%",
          height: "78.57%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            flex: "0 0 56%",
            bgcolor: "#e8eaed",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {avatarUrl ? (
            <Box
              component="img"
              src={avatarUrl}
              alt="Profile"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(160deg, #e8d5f5 0%, #d5e8f5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "clamp(2.4rem, 10vw, 4rem)",
                  fontWeight: 900,
                  color: "#7c3aed",
                  letterSpacing: 3,
                }}
              >
                {initials}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            bgcolor: "#202124",
            px: 1.5,
            py: 0.85,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontWeight: 900,
              fontSize: "clamp(0.7rem, 3.5vw, 1rem)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.name || "Faculty Member"}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            bgcolor: "white",
            px: 1.5,
            pt: 1,
            pb: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "clamp(0.6rem, 2.4vw, 0.8rem)",
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.designation ||
                (user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Faculty")}
            </Typography>
            <Typography
              sx={{
                fontSize: "clamp(0.54rem, 2vw, 0.72rem)",
                color: "#334155",
                mt: 0.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.department}
            </Typography>
          </Box>

          <Box>
            <Divider sx={{ borderColor: "#e2e8f0", mb: 0.6 }} />
            <Typography
              sx={{
                fontSize: "clamp(0.42rem, 1.6vw, 0.58rem)",
                color: "#94a3b8",
                mb: 0.5,
              }}
            >
              faculty.leaveai.edu
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  height: 36,
                  backgroundImage:
                    "repeating-linear-gradient(to right, #111 0px, #111 1.5px, #fff 1.5px, #fff 3px, #111 3px, #111 5px, #fff 5px, #fff 6px, #111 6px, #111 7px, #fff 7px, #fff 9px, #111 9px, #111 10px, #fff 10px, #fff 12px)",
                  flexShrink: 1,
                }}
              />
              <Box sx={{ flexShrink: 0, textAlign: "right", ml: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "clamp(0.42rem, 1.6vw, 0.58rem)",
                    fontWeight: 700,
                    color: "#111",
                    fontFamily: "monospace",
                    display: "block",
                    lineHeight: 1.5,
                    letterSpacing: "0.04em",
                  }}
                >
                  {initials}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "clamp(0.42rem, 1.6vw, 0.58rem)",
                    fontWeight: 700,
                    color: "#111",
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  {employeeId}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

/* ── Faculty quick-select row ────────────────────────────── */
import FilterListIcon from "@mui/icons-material/FilterList";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"; // Used as a generic department icon

const FacultyList = ({ users }) => {
  const colors = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626"];

  // Helper for mock data to fill out the UI exactly like the image
  const getMockTags = (index) => {
    const tagSets = [
      [
        { label: "Arts", color: "#8b5cf6", bg: "#ede9fe" },
        { label: "Business", color: "#d97706", bg: "#fef3c7" },
        { label: "Travel", color: "#e11d48", bg: "#ffe4e6" },
      ],
      [
        { label: "Books", color: "#8b5cf6", bg: "#ede9fe" },
        { label: "Computers", color: "#4f46e5", bg: "#e0e7ff" },
      ],
      [
        { label: "Kitchen", color: "#d97706", bg: "#fef3c7" },
        { label: "Books", color: "#374151", bg: "#f3f4f6" },
      ],
      [{ label: "Furniture", color: "#059669", bg: "#d1fae5" }],
      [
        { label: "Beauty", color: "#10b981", bg: "#d1fae5" },
        { label: "Apparel", color: "#d97706", bg: "#fef3c7" },
        { label: "Sale", color: "#e11d48", bg: "#ffe4e6" },
      ],
    ];
    return tagSets[index % tagSets.length];
  };

  const getMockProgress = (index) => {
    const widths = ["40%", "15%", "80%", "35%", "70%"];
    return widths[index % widths.length];
  };

  // Assuming getAvatarUrl is defined elsewhere in your file
  const getAvatarUrl = (avatar) => avatar;

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: 4,
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
        p: 4,
        fontFamily: "sans-serif",
        width: "100%",
        maxWidth: 1200,
        margin: "auto",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
            Your Faculty
          </Typography>
          <Chip
            label="New"
            size="small"
            sx={{
              color: "#4f46e5",
              backgroundColor: "#fff",
              border: "1px solid #4f46e5",
              fontWeight: 600,
              height: 24,
            }}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          sx={{
            borderRadius: 8,
            color: "#374151",
            borderColor: "#e5e7eb",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { borderColor: "#d1d5db", backgroundColor: "#f9fafb" },
          }}
        >
          Filter
        </Button>
      </Box>

      {/* Table Headers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
          pb: 2,
          mb: 1,
        }}
      >
        {[
          "Full Name",
          "Department",
          "Specialization",
          "Engagement Percentage",
        ].map((header, idx) => (
          <Box
            key={header}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Typography
              sx={{ fontWeight: 600, color: "#374151", fontSize: "0.875rem" }}
            >
              {header}
            </Typography>
            {(idx === 0 || idx === 3) && (
              <UnfoldMoreIcon
                sx={{ fontSize: 16, color: "#9ca3af", cursor: "pointer" }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* List / Rows */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {users.map((u, i) => (
          <Box
            key={u._id || i}
            sx={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr",
              alignItems: "center",
              py: 2.5,
              borderBottom: "1px solid #f3f4f6",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            {/* Column 1: Avatar & Name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={getAvatarUrl(u?.avatar) || undefined}
                sx={{
                  width: 44,
                  height: 44,
                  fontSize: 16,
                  fontWeight: 600,
                  background: getAvatarUrl(u?.avatar)
                    ? "none"
                    : `linear-gradient(135deg, ${colors[i % 5]}, ${colors[(i + 1) % 5]})`,
                }}
              >
                {!getAvatarUrl(u?.avatar) && u.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography
                  sx={{ fontWeight: 600, color: "#111827", fontSize: "0.9rem" }}
                >
                  {u.name || "Unknown Faculty"}
                </Typography>
                <Typography sx={{ color: "#6b7280", fontSize: "0.8rem" }}>
                  @{u.name?.toLowerCase().replace(/\s+/g, "") || "handle"}
                </Typography>
              </Box>
            </Box>

            {/* Column 2: Department (Replacing Payment Method) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AccountBalanceIcon sx={{ color: colors[i % 5], fontSize: 20 }} />
              <Typography
                sx={{ fontWeight: 500, color: "#374151", fontSize: "0.875rem" }}
              >
                {u.department || "General"} Dept.
              </Typography>
              {i % 2 !== 0 && (
                <IconButton size="small" sx={{ p: 0 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: "#d1d5db" }} />
                </IconButton>
              )}
            </Box>

            {/* Column 3: Categories / Chips */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {getMockTags(i).map((tag, tIdx) => (
                <Chip
                  key={tIdx}
                  label={tag.label}
                  size="small"
                  sx={{
                    backgroundColor: tag.bg,
                    color: tag.color,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    height: 22,
                    border: "none",
                  }}
                />
              ))}
            </Box>

            {/* Column 4: Engagement Bar (Replacing Clickthrough) */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "#e0e7ff",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: getMockProgress(i),
                    height: "100%",
                    backgroundColor: "#5a67d8",
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════════
   FACULTY DASHBOARD COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* Leave Balance Tiles */
const LeaveBalanceTiles = ({ balance }) => {
  const leaveTypes = [
    { key: "casual", label: "Casual", color: "#7c3aed", icon: BeachAccess },
    {
      key: "medical",
      label: "Medical",
      color: "#ef4444",
      icon: LocalHospital,
    },
    { key: "earned", label: "Earned", color: "#10b981", icon: Star },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 2.5 }}>
      {leaveTypes.map((type) => {
        const b = balance?.[type.key];
        if (!b || b.total === 0) return null;
        const remaining = b.total - b.used;
        const pct = (remaining / b.total) * 100;

        return (
          <Grid item xs={12} sm={6} md={4} key={type.key}>
            <Card
              sx={{
                borderRadius: "12px",
                border: `2px solid ${type.color}15`,
                backgroundColor: `${type.color}08`,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.8rem",
                    }}
                  >
                    <type.icon sx={{ fontSize: 28, color: type.color }} />
                  </Box>{" "}
                  <Chip
                    label={`${pct.toFixed(0)}%`}
                    size="small"
                    sx={{
                      bgcolor: `${type.color}20`,
                      color: type.color,
                      fontWeight: 700,
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "text.secondary",
                    mb: 0.5,
                  }}
                >
                  {type.label} Leave
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: "1.8rem",
                    color: type.color,
                    lineHeight: 1,
                  }}
                >
                  {remaining}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "text.disabled",
                    mt: 0.5,
                  }}
                >
                  of {b.total} days
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 4,
                    borderRadius: "2px",
                    bgcolor: `${type.color}20`,
                    mt: 1.5,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: type.color,
                      borderRadius: "2px",
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

/* Request Status Tracker */
const RequestStatusTracker = ({ leaves }) => {
  const pendingRequest = leaves.find((l) => l.status === "pending");
  if (!pendingRequest) return null;

  const stages = [
    {
      label: "Submitted",
      status: "pending",
      icon: TimerOutlined,
      active: true,
    },
    {
      label: "HOD Approved",
      status: "hod_approved",
      icon: CheckCircle,
      active:
        pendingRequest.status === "hod_approved" ||
        pendingRequest.status === "approved",
    },
    {
      label: "Admin Approved",
      status: "approved",
      icon: CheckCircleOutline,
      active: pendingRequest.status === "approved",
    },
  ];

  return (
    <Card sx={{ mb: 2.5, borderRadius: "12px" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 700, mb: 2, fontSize: "1rem" }}>
          Request Status
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
          {stages.map((stage, idx) => (
            <Box
              key={stage.status}
              sx={{ display: "flex", alignItems: "center", flex: 1 }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: stage.active ? "#7c3aed" : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <stage.icon
                    sx={{
                      color: stage.active ? "white" : "#9ca3af",
                      fontSize: 20,
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: stage.active ? "#7c3aed" : "#9ca3af",
                    textAlign: "center",
                  }}
                >
                  {stage.label}
                </Typography>
              </Box>
              {idx < stages.length - 1 && (
                <Box
                  sx={{
                    height: 2,
                    flex: 1,
                    bgcolor: stage.active ? "#7c3aed" : "#e5e7eb",
                    mx: 1,
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

/* Personal Leave Calendar */
const PersonalLeaveCalendar = ({ leaves }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const approvedLeaveDates = new Set();
  leaves
    .filter((l) => l.status === "approved")
    .forEach((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        approvedLeaveDates.add(d.getDate());
      }
    });

  const days = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <Card sx={{ mb: 2.5, borderRadius: "12px" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 700, mb: 2, fontSize: "1rem" }}>
          {MONTHS[currentMonth]} {currentYear}
        </Typography>
        <Grid container spacing={1}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Box
                sx={{
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "text.disabled",
                  mb: 1,
                }}
              >
                {day}
              </Box>
            </Grid>
          ))}
          {days.map((day, idx) => (
            <Grid item xs={12 / 7} key={idx}>
              <Box
                sx={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  bgcolor:
                    day && approvedLeaveDates.has(day)
                      ? "#10b98120"
                      : "transparent",
                  border:
                    day && approvedLeaveDates.has(day)
                      ? "2px solid #10b981"
                      : "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: day ? "text.primary" : "transparent",
                }}
              >
                {day}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODERN SAAS TABLES - NEW COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* Admin: All Staff Leave This Month */
const AdminLeaveMonthlyTable = ({ leaves, allUsers }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // ✅ FIXED: Filter approved leaves from current month
  const monthlyLeaves = leaves.filter((leave) => {
    if (leave.status !== "approved") return false;
    const leaveMonth = new Date(leave.startDate).getMonth();
    const leaveYear = new Date(leave.startDate).getFullYear();
    return leaveMonth === currentMonth && leaveYear === currentYear;
  });

  // Group by faculty
  const facultyLeaveStats = monthlyLeaves.reduce((acc, leave) => {
    const facultyId = leave.faculty?._id;
    if (!acc[facultyId]) {
      acc[facultyId] = {
        faculty: leave.faculty,
        department: leave.faculty?.department,
        totalDays: 0,
        leaves: [],
      };
    }
    acc[facultyId].totalDays += leave.totalDays || 0;
    acc[facultyId].leaves.push(leave);
    return acc;
  }, {});

  const tableData = Object.values(facultyLeaveStats).sort(
    (a, b) => b.totalDays - a.totalDays,
  );

  return (
    <Card
      sx={{
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
        bgcolor: "#ffffff",
        mb: 2.5,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3.5,
            py: 2.5,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              sx={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Staff Leave This Month
            </Typography>
            <Chip
              label={`${tableData.length} Active`}
              size="small"
              sx={{
                bgcolor: "#dbeafe",
                color: "#1e40af",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 24,
              }}
            />
          </Box>
          <Tooltip title="Filter">
            <IconButton
              size="small"
              sx={{
                bgcolor: "#f3f4f6",
                "&:hover": { bgcolor: "#e5e7eb" },
              }}
            >
              <FilterList sx={{ fontSize: 20, color: "#6b7280" }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Table */}
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow
                sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #f0f0f0" }}
              >
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Full Name <UnfoldMore sx={{ fontSize: 14 }} />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Department
                </TableCell>
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Leave Types
                </TableCell>
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Total Days <UnfoldMore sx={{ fontSize: 14 }} />
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 4, textAlign: "center" }}>
                    <Typography sx={{ color: "text.secondary" }}>
                      No staff on leave this month
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row, idx) => (
                  <TableRow
                    key={row.faculty?._id || idx}
                    sx={{
                      borderBottom: "1px solid #f0f0f0",
                      "&:hover": { bgcolor: "#fafbfc" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    {/* Faculty Name & Avatar */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          src={getAvatarUrl(row.faculty?.avatar)}
                          sx={{
                            width: 42,
                            height: 42,
                            fontSize: 16,
                            fontWeight: 700,
                            bgcolor: "#7c3aed",
                          }}
                        >
                          {row.faculty?.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              color: "#0f172a",
                            }}
                          >
                            {row.faculty?.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              mt: 0.25,
                            }}
                          >
                            @{row.faculty?.email?.split("@")[0] || "faculty"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Department */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Chip
                        label={row.department || "N/A"}
                        size="small"
                        sx={{
                          bgcolor: "#f0f4ff",
                          color: "#7c3aed",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                        }}
                      />
                    </TableCell>

                    {/* Leave Types */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {[...new Set(row.leaves.map((l) => l.leaveType))].map(
                          (type) => (
                            <Chip
                              key={type}
                              label={type === "leaveWithoutPay" ? "LWP" : type}
                              size="small"
                              sx={{
                                bgcolor: `${leaveTypeColor[type]}15`,
                                color: leaveTypeColor[type],
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                          ),
                        )}
                      </Box>
                    </TableCell>

                    {/* Total Days Progress */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box sx={{ minWidth: 60 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((row.totalDays / 30) * 100, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: "#7c3aed",
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "#0f172a",
                            minWidth: 35,
                          }}
                        >
                          {row.totalDays}d
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

/* HOD: Department Staff Leave This Month */
const HODLeaveMonthlyTable = ({ leaves, userDepartment }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyLeaves = leaves.filter((leave) => {
    const leaveMonth = new Date(leave.startDate).getMonth();
    const leaveYear = new Date(leave.startDate).getFullYear();
    return (
      leave.status === "approved" &&
      leaveMonth === currentMonth &&
      leaveYear === currentYear &&
      leave.faculty?.department === userDepartment
    );
  });

  const facultyLeaveStats = monthlyLeaves.reduce((acc, leave) => {
    const facultyId = leave.faculty?._id;
    if (!acc[facultyId]) {
      acc[facultyId] = {
        faculty: leave.faculty,
        department: leave.faculty?.department,
        totalDays: 0,
        leaves: [],
      };
    }
    acc[facultyId].totalDays += leave.totalDays || 0;
    acc[facultyId].leaves.push(leave);
    return acc;
  }, {});

  const tableData = Object.values(facultyLeaveStats).sort(
    (a, b) => b.totalDays - a.totalDays,
  );

  return (
    <Card
      sx={{
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
        bgcolor: "#ffffff",
        mb: 2.5,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3.5,
            py: 2.5,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              sx={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Department Leave Activity
            </Typography>
            <Chip
              label={`${tableData.length} Members`}
              size="small"
              sx={{
                bgcolor: "#fef3c7",
                color: "#92400e",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 24,
              }}
            />
          </Box>
          <Tooltip title="Filter">
            <IconButton
              size="small"
              sx={{
                bgcolor: "#f3f4f6",
                "&:hover": { bgcolor: "#e5e7eb" },
              }}
            >
              <FilterList sx={{ fontSize: 20, color: "#6b7280" }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Table */}
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow
                sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #f0f0f0" }}
              >
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Staff Name <UnfoldMore sx={{ fontSize: 14 }} />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Leave Dates
                </TableCell>
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Leave Type
                </TableCell>
                <TableCell
                  sx={{
                    px: 3.5,
                    py: 2,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Duration <UnfoldMore sx={{ fontSize: 14 }} />
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 4, textAlign: "center" }}>
                    <Typography sx={{ color: "text.secondary" }}>
                      No staff on leave this month
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row, idx) => (
                  <TableRow
                    key={row.faculty?._id || idx}
                    sx={{
                      borderBottom: "1px solid #f0f0f0",
                      "&:hover": { bgcolor: "#fafbfc" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    {/* Staff Name & Avatar */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          src={getAvatarUrl(row.faculty?.avatar)}
                          sx={{
                            width: 42,
                            height: 42,
                            fontSize: 16,
                            fontWeight: 700,
                            bgcolor: "#f59e0b",
                          }}
                        >
                          {row.faculty?.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              color: "#0f172a",
                            }}
                          >
                            {row.faculty?.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              mt: 0.25,
                            }}
                          >
                            @{row.faculty?.email?.split("@")[0] || "staff"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Leave Dates */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Box>
                        {row.leaves.slice(0, 2).map((leave, idx) => (
                          <Typography
                            key={idx}
                            sx={{
                              fontSize: "0.8rem",
                              color: "#374151",
                              fontWeight: 500,
                            }}
                          >
                            {new Date(leave.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}{" "}
                            -{" "}
                            {new Date(leave.endDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </Typography>
                        ))}
                        {row.leaves.length > 2 && (
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              mt: 0.5,
                            }}
                          >
                            +{row.leaves.length - 2} more
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Leave Type */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {[...new Set(row.leaves.map((l) => l.leaveType))].map(
                          (type) => (
                            <Chip
                              key={type}
                              label={type === "leaveWithoutPay" ? "LWP" : type}
                              size="small"
                              sx={{
                                bgcolor: `${leaveTypeColor[type]}15`,
                                color: leaveTypeColor[type],
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                          ),
                        )}
                      </Box>
                    </TableCell>

                    {/* Duration Progress */}
                    <TableCell sx={{ px: 3.5, py: 2.5 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box sx={{ minWidth: 80 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((row.totalDays / 30) * 100, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: "#f59e0b",
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                        <Tooltip title={`${row.totalDays} days total`}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "#0f172a",
                              minWidth: 40,
                            }}
                          >
                            {row.totalDays}d
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOD DASHBOARD COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* Pending Approvals List */
const PendingApprovalsListHOD = ({ leaves, userDepartment }) => {
  const pendingRequests = leaves.filter(
    (l) => l.status === "pending" && l.faculty?.department === userDepartment,
  );

  if (pendingRequests.length === 0) {
    return (
      <Alert severity="success" sx={{ mb: 2.5 }}>
        ✅ No pending approvals at the moment
      </Alert>
    );
  }

  return (
    <Card sx={{ mb: 2.5, borderRadius: "12px" }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
            Pending Approvals ({pendingRequests.length})
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Faculty
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Dates
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Type
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Reason
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                align="center"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingRequests.map((leave) => (
              <TableRow key={leave._id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={getAvatarUrl(leave.faculty?.avatar)}
                      sx={{ width: 32, height: 32, fontSize: "0.8rem" }}
                    >
                      {leave.faculty?.name?.charAt(0)}
                    </Avatar>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {leave.faculty?.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem" }}>
                  {new Date(leave.startDate).toLocaleDateString()} -{" "}
                  {new Date(leave.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={leave.leaveType}
                    size="small"
                    sx={{
                      bgcolor: `${leaveTypeColor[leave.leaveType]}20`,
                      color: leaveTypeColor[leave.leaveType],
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem", maxWidth: 200 }}>
                  {leave.reason}
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: "#10b981" }}
                    >
                      <Done sx={{ fontSize: 16 }} />
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ color: "#ef4444" }}
                    >
                      <Close sx={{ fontSize: 16 }} />
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/* Department Who's Out Calendar */
const DepartmentWhosOutCalendar = ({ leaves, userDepartment }) => {
  const departmentOnLeave = leaves.filter(
    (l) =>
      l.status === "approved" &&
      l.faculty?.department === userDepartment &&
      new Date(l.endDate) >= new Date(),
  );

  return (
    <Card sx={{ mb: 2.5, borderRadius: "12px" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 700, mb: 2, fontSize: "1rem" }}>
          Department: Who's Out <People sx={{ fontSize: 18, ml: 0.5 }} />{" "}
        </Typography>
        {departmentOnLeave.length === 0 ? (
          <Typography sx={{ color: "text.disabled", fontSize: "0.9rem" }}>
            Everyone is in the office
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {departmentOnLeave.map((leave) => (
              <Box
                key={leave._id}
                sx={{
                  p: 1.5,
                  bgcolor: "#f3f4f6",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${leaveTypeColor[leave.leaveType]}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Avatar
                    src={getAvatarUrl(leave.faculty?.avatar)}
                    sx={{ width: 28, height: 28, fontSize: "0.75rem" }}
                  >
                    {leave.faculty?.name?.charAt(0)}
                  </Avatar>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {leave.faculty?.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "#7c3aed" }}>
                    {leave.leaveType === "leaveWithoutPay"
                      ? "LWP"
                      : leave.leaveType === "compensatory"
                        ? "Compensatory"
                        : leave.leaveType === "onDuty"
                          ? "On Duty"
                          : leave.leaveType}
                  </Typography>
                </Box>
                <Typography
                  sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                >
                  {new Date(leave.startDate).toLocaleDateString()} -{" "}
                  {new Date(leave.endDate).toLocaleDateString()}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/* Overlap Alerts */
const OverlapAlertsHOD = ({ leaves, userDepartment }) => {
  const departmentLeaves = leaves.filter(
    (l) => l.status === "approved" && l.faculty?.department === userDepartment,
  );

  const dateConflicts = {};
  departmentLeaves.forEach((leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateConflicts[dateStr] = (dateConflicts[dateStr] || 0) + 1;
    }
  });

  const criticalDates = Object.entries(dateConflicts).filter(
    ([, count]) => count >= 3,
  );

  if (criticalDates.length === 0) {
    return null;
  }

  return (
    <Alert severity="warning" sx={{ mb: 2.5 }} icon={<Warning />}>
      <Box>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>
          <Warning sx={{ fontSize: 18, mr: 0.5 }} /> Overlap Alert
        </Typography>
        <Typography sx={{ fontSize: "0.9rem" }}>
          {criticalDates.length} date(s) have 3+ faculty on leave. Department
          coverage may be affected.
        </Typography>
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {criticalDates.map(([date, count]) => (
            <Chip
              key={date}
              label={`${date}: ${count} staff`}
              size="small"
              sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 600 }}
            />
          ))}
        </Box>
      </Box>
    </Alert>
  );
};

/* ══════════════════════════════════════════════���════════════
   ADMIN DASHBOARD COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* Final Approval Queue */
const FinalApprovalQueueAdmin = ({ leaves }) => {
  const hodApprovedRequests = leaves.filter((l) => l.status === "hod_approved");

  if (hodApprovedRequests.length === 0) {
    return (
      <Alert severity="success" sx={{ mb: 2.5 }}>
        ✅ All requests have been processed
      </Alert>
    );
  }

  return (
    <Card sx={{ mb: 2.5, borderRadius: "12px" }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
            Final Approval Queue ({hodApprovedRequests.length})
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Faculty
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Department
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Dates
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Type
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                HOD Status
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                align="center"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hodApprovedRequests.map((leave) => (
              <TableRow key={leave._id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={getAvatarUrl(leave.faculty?.avatar)}
                      sx={{ width: 32, height: 32, fontSize: "0.8rem" }}
                    >
                      {leave.faculty?.name?.charAt(0)}
                    </Avatar>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {leave.faculty?.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem" }}>
                  {leave.faculty?.department}
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem" }}>
                  {new Date(leave.startDate).toLocaleDateString()} -{" "}
                  {new Date(leave.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={leave.leaveType}
                    size="small"
                    sx={{
                      bgcolor: `${leaveTypeColor[leave.leaveType]}20`,
                      color: leaveTypeColor[leave.leaveType],
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                    label="HOD Approved"
                    size="small"
                    sx={{
                      bgcolor: "#dbeafe",
                      color: "#1e40af",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: "#10b981" }}
                    >
                      <Done sx={{ fontSize: 16 }} />
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ color: "#ef4444" }}
                    >
                      <Close sx={{ fontSize: 16 }} />
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/* Institutional Analytics */
const InstitutionalAnalytics = ({ leaves, allUsers }) => {
  const todaysDate = new Date();

  // ✅ Filter: Approved leaves that overlap with today
  const todayOnLeave = leaves.filter((l) => {
    if (l.status !== "approved") return false;
    const startDate = new Date(l.startDate);
    const endDate = new Date(l.endDate);
    // Check if today is within the leave period
    return startDate <= todaysDate && endDate >= todaysDate;
  }).length;

  // ✅ Department distribution - count approved leaves by department
  const departmentDistribution = {};
  leaves
    .filter((l) => l.status === "approved")
    .forEach((l) => {
      const dept = l.faculty?.department || "Unknown";
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
    });

  const sortedDepts = Object.entries(departmentDistribution).sort(
    ([, a], [, b]) => b - a,
  );

  const topDept = sortedDepts[0];

  return (
    <Grid container spacing={2} sx={{ mb: 2.5 }}>
      <Grid item xs={12} sm={6}>
        <Card sx={{ borderRadius: "12px" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}
                >
                  On Leave Today
                </Typography>
                <Typography
                  sx={{ fontWeight: 900, fontSize: "2rem", color: "#ef4444" }}
                >
                  {todayOnLeave}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.75rem", color: "text.disabled" }}
                >
                  of {allUsers?.length || 0} employees
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#fee2e210",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography sx={{ fontSize: "1.8rem" }}>👥</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Card sx={{ borderRadius: "12px" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}
                >
                  Most Active Department
                </Typography>
                <Typography
                  sx={{ fontWeight: 900, fontSize: "1.5rem", color: "#7c3aed" }}
                >
                  {topDept?.[0] || "—"}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.75rem", color: "text.disabled" }}
                >
                  {topDept?.[1] || 0} leaves
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#f5f3ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography sx={{ fontSize: "1.8rem" }}>📊</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTx, setSearchTx] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await API.get("/leaves");
      setLeaves(data);
    };

    fetchData();

    const handler = () => fetchData();
    window.addEventListener("leaves:changed", handler);
    return () => window.removeEventListener("leaves:changed", handler);
  }, []);

  useEffect(() => {
    Promise.all([
      API.get("/leaves"),
      API.get("/leaves/balance"),
      API.get("/users"),
    ])
      .then(([l, b, u]) => {
        setLeaves(l.data);
        setBalance(b.data);
        setAllUsers(u.data.filter((u2) => u2._id !== user?._id));
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
      >
        <CircularProgress sx={{ color: "#7c3aed" }} />
      </Box>
    );

  const monthlyApproved = MONTHS.map(
    (_, mi) =>
      leaves.filter(
        (l) =>
          l.status === "approved" && new Date(l.startDate).getMonth() === mi,
      ).length,
  );

  const monthlyPending = MONTHS.map(
    (_, mi) =>
      leaves.filter(
        (l) =>
          l.status === "pending" && new Date(l.startDate).getMonth() === mi,
      ).length,
  );

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
    totalDaysUsed: leaves
      .filter((l) => l.status === "approved")
      .reduce((s, l) => s + (l.totalDays || 0), 0),
  };

  const filteredLeaves = leaves.filter(
    (l) =>
      !searchTx ||
      l.faculty?.name?.toLowerCase().includes(searchTx.toLowerCase()) ||
      l.leaveType?.toLowerCase().includes(searchTx.toLowerCase()) ||
      l.reason?.toLowerCase().includes(searchTx.toLowerCase()),
  );

  // Render based on user role
  const isFaculty = user?.role === "faculty";
  const isHOD = user?.role === "hod";
  const isAdmin = user?.role === "admin";

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2.5,
        minHeight: "100%",
        alignItems: "flex-start",
      }}
    >
      {/* ── Main column ───────────────────────────────── */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* ── FACULTY DASHBOARD ── */}
        {isFaculty && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: "text.primary",
                  mb: 0.5,
                }}
              >
                Welcome, {user?.name?.split(" ")[0]}!
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                Manage your leave requests and track approvals
              </Typography>
            </Box>

            <LeaveBalanceTiles balance={balance} />
            <RequestStatusTracker leaves={leaves} />

            <LeaveAnalytics />
          </Box>
        )}

        {/* ── HOD DASHBOARD ── */}
        {isHOD && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: "text.primary",
                  mb: 0.5,
                }}
              >
                HOD Dashboard
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                Manage department leaves and handle approvals
              </Typography>
            </Box>

            <LeaveBalanceTiles balance={balance} />

            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  mb: 2,
                  color: "text.primary",
                }}
              >
                Department Management
              </Typography>

              <OverlapAlertsHOD
                leaves={leaves}
                userDepartment={user?.department}
              />
              <DepartmentPredictiveCard />
              <PendingApprovalsListHOD
                leaves={leaves}
                userDepartment={user?.department}
              />
              <HODLeaveMonthlyTable
                leaves={leaves}
                userDepartment={user?.department}
              />
              <DepartmentWhosOutCalendar
                leaves={leaves}
                userDepartment={user?.department}
              />
            </Box>
          </Box>
        )}

        {/* ── ADMIN DASHBOARD ── */}
        {isAdmin && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: "text.primary",
                  mb: 0.5,
                }}
              >
                Admin Dashboard
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                System-wide leave management and analytics
              </Typography>
            </Box>
            <LeaveAnalytics />
            <InstitutionalAnalytics leaves={leaves} allUsers={allUsers} />
            <PredictiveInsightsCard />
            <AdminLeaveMonthlyTable leaves={leaves} allUsers={allUsers} />
            <FinalApprovalQueueAdmin leaves={leaves} />
          </Box>
        )}

        {/* ── SHARED: Leave History ── */}
        <Card sx={{ borderRadius: "8px", mt: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                Leave History
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "8px",
                    px: 1.2,
                    py: 0.5,
                    "&:focus-within": { borderColor: "#c4b5fd" },
                  }}
                >
                  <Search
                    sx={{ color: "text.disabled", fontSize: 14, mr: 0.5 }}
                  />
                  <InputBase
                    placeholder="Search leave..."
                    value={searchTx}
                    onChange={(e) => setSearchTx(e.target.value)}
                    sx={{
                      fontSize: "0.8rem",
                      width: 130,
                      color: "text.primary",
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                    <Checkbox size="small" sx={{ color: "text.disabled" }} />
                  </TableCell>
                  {[
                    "ID",
                    "Leave Type",
                    "Date Applied",
                    "Duration",
                    "Status",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        color: "text.disabled",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        py: 1.2,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {h.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeaves.slice(0, 7).map((leave) => {
                  const badge = statusBadge(leave.status);
                  const lColor = leaveTypeColor[leave.leaveType] || "#7c3aed";
                  const IconComponent = leaveTypeIcon[leave.leaveType];

                  return (
                    <TableRow
                      key={leave._id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "rgba(124,58,237,0.025)" },
                        cursor: "pointer",
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                        <Checkbox
                          size="small"
                          sx={{ color: "text.disabled" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "0.73rem", color: "text.disabled" }}
                          >
                            <Description sx={{ fontSize: 16 }} />
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          >
                            LV_{leave._id?.slice(-6).toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "8px",
                              bgcolor: lColor + "15",
                              border: `1px solid ${lColor}25`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {IconComponent ? (
                              <IconComponent
                                sx={{ fontSize: 16, color: lColor }}
                              />
                            ) : (
                              "📋"
                            )}
                          </Box>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.81rem",
                                color: "text.primary",
                                textTransform: "capitalize",
                              }}
                            >
                              {leave.leaveType === "leaveWithoutPay"
                                ? "LWP"
                                : leave.leaveType === "compensatory"
                                  ? "Compensatory"
                                  : leave.leaveType === "onDuty"
                                    ? "On Duty"
                                    : leave.leaveType}{" "}
                              Leave
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                fontSize: "0.71rem",
                              }}
                            >
                              {leave.faculty?.name || user?.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontSize: "0.77rem" }}
                        >
                          {new Date(leave.startDate).toLocaleDateString(
                            "en-US",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.83rem",
                            color: "text.primary",
                          }}
                        >
                          {leave.totalDays}d
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            bgcolor: badge.bg,
                            px: 1,
                            py: 0.25,
                            borderRadius: "8px",
                          }}
                        >
                          {leave.status === "approved" && (
                            <CheckCircle
                              sx={{ fontSize: 10, color: badge.color }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: badge.color,
                              fontSize: "0.71rem",
                            }}
                          >
                            {badge.label}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLeaves.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 5, color: "text.disabled" }}
                    >
                      No leave records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>

      {/* ── Right sidebar ─────────────────────────────── */}
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* SVG ID Card */}
        <CollegeStaffIDCard user={user} />

        {/* Leave balance */}
        <Card
          sx={{ bgcolor: "#1e1b4b", borderRadius: "8px", overflow: "hidden" }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.8,
              }}
            >
              <Typography
                sx={{ fontWeight: 700, color: "white", fontSize: "0.87rem" }}
              >
                Leave Balance
              </Typography>
              <Chip
                label={new Date().getFullYear()}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.67rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
              />
            </Box>
            {balance &&
              [
                "casual",
                "medical",
                "earned",
                "compensatory",
                "onDuty",
                "special",
                "leaveWithoutPay",
              ].map((type) => {
                const b = balance[type];
                if (!b || b.total === 0) return null;
                const pct = (b.used / b.total) * 100;
                const remaining = b.total - b.used;
                const color = leaveTypeColor[type] || "#7c3aed";
                return (
                  <Box key={type} sx={{ mb: 1.4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.35,
                      }}
                    >
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: "0.72rem",
                          textTransform: "capitalize",
                        }}
                      >
                        {type === "leaveWithoutPay"
                          ? "LWP"
                          : type === "compensatory"
                            ? "Comp"
                            : type === "onDuty"
                              ? "On Duty"
                              : type}
                      </Typography>
                      <Typography
                        sx={{
                          color: "white",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {remaining}/{b.total}d
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 3,
                        borderRadius: "2px",
                        bgcolor: "rgba(255,255,255,0.1)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: "2px",
                          bgcolor:
                            pct > 80 ? "#f87171" : pct > 50 ? "#fbbf24" : color,
                        },
                      }}
                    />
                  </Box>
                );
              })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card sx={{ borderRadius: "8px" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.8,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Quick Actions
              </Typography>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AutoAwesome sx={{ color: "white", fontSize: 12 }} />
              </Box>
            </Box>

            {isFaculty && (
              <>
                {[
                  {
                    icon: HourglassEmpty,
                    title: `${stats.pending} Pending`,
                    sub: "Needs Approval",
                    subColor: "#f59e0b",
                    dark: true,
                    arrow: true,
                  },
                  {
                    icon: CheckCircle,
                    title: `${stats.approved} Approved`,
                    sub: "Processed",
                    subColor: "#10b981",
                    dark: false,
                    arrow: false,
                  },
                  {
                    icon: Repeat,
                    title: `${allUsers.filter((u) => u.isAvailable).length} Available`,
                    sub: "Substitutes Ready",
                    subColor: "#7c3aed",
                    dark: false,
                    arrow: false,
                  },
                ].map((item, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.4,
                      borderRadius: "8px",
                      bgcolor: item.dark ? "#0f172a" : "background.default",
                      mb: i < 2 ? 1 : 0,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.88 },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: item.subColor + (item.dark ? "30" : "15"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      <item.icon sx={{ fontSize: 18, color: item.subColor }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.81rem",
                          color: item.dark ? "white" : "text.primary",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: item.subColor,
                          fontWeight: 600,
                          fontSize: "0.69rem",
                        }}
                      >
                        {item.sub}
                      </Typography>
                    </Box>
                    {item.arrow && (
                      <KeyboardArrowRight
                        sx={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}
                      />
                    )}
                  </Box>
                ))}

                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.4,
                    bgcolor: "#f5f3ff",
                    borderRadius: "8px",
                    border: "1px solid #e0d7ff",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#6d28d9",
                      fontWeight: 700,
                      fontSize: "0.74rem",
                      mb: 0.2,
                    }}
                  >
                    {user?.department}
                  </Typography>
                  <Typography sx={{ color: "#7c3aed", fontSize: "0.69rem" }}>
                    {stats.total} total requests this year
                  </Typography>
                </Box>
              </>
            )}

            {isHOD && (
              <>
                {[
                  {
                    icon: TimerOutlined,
                    title: `${leaves.filter((l) => l.status === "pending" && l.faculty?.department === user?.department).length} Pending`,
                    sub: "Awaiting Your Approval",
                    subColor: "#f59e0b",
                    dark: true,
                  },
                  {
                    icon: People,
                    title: `${leaves.filter((l) => l.status === "approved" && l.faculty?.department === user?.department && new Date(l.endDate) >= new Date()).length} Out`,
                    sub: "Currently on Leave",
                    subColor: "#10b981",
                    dark: false,
                  },
                  {
                    icon: Description,
                    title: "Manage Team",
                    sub: "View Department",
                    subColor: "#7c3aed",
                    dark: false,
                  },
                ].map((item, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.4,
                      borderRadius: "8px",
                      bgcolor: item.dark ? "#0f172a" : "background.default",
                      mb: i < 2 ? 1 : 0,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.88 },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: item.subColor + (item.dark ? "30" : "15"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      <item.icon sx={{ fontSize: 18, color: item.subColor }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.81rem",
                          color: item.dark ? "white" : "text.primary",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: item.subColor,
                          fontWeight: 600,
                          fontSize: "0.69rem",
                        }}
                      >
                        {item.sub}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.4,
                    bgcolor: "#fef9c3",
                    borderRadius: "8px",
                    border: "1px solid #fcd34d",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#854d0e",
                      fontWeight: 700,
                      fontSize: "0.74rem",
                      mb: 0.2,
                    }}
                  >
                    {user?.department} Department
                  </Typography>
                  <Typography sx={{ color: "#d97706", fontSize: "0.69rem" }}>
                    Manage approvals and team availability
                  </Typography>
                </Box>
              </>
            )}

            {isAdmin && (
              <>
                {[
                  {
                    icon: TimerOutlined,
                    title: `${leaves.filter((l) => l.status === "hod_approved").length} Pending`,
                    sub: "Final Approvals",
                    subColor: "#f59e0b",
                    dark: true,
                  },
                  {
                    icon: People,
                    title: `${leaves.filter((l) => l.status === "approved" && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length} On Leave`,
                    sub: "Today",
                    subColor: "#ef4444",
                    dark: false,
                  },
                  {
                    icon: BarChart,
                    title: "Analytics",
                    sub: "View Reports",
                    subColor: "#7c3aed",
                    dark: false,
                  },
                ].map((item, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.4,
                      borderRadius: "8px",
                      bgcolor: item.dark ? "#0f172a" : "background.default",
                      mb: i < 2 ? 1 : 0,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.88 },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: item.subColor + (item.dark ? "30" : "15"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      <item.icon sx={{ fontSize: 18, color: item.subColor }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.81rem",
                          color: item.dark ? "white" : "text.primary",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: item.subColor,
                          fontWeight: 600,
                          fontSize: "0.69rem",
                        }}
                      >
                        {item.sub}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.4,
                    bgcolor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#166534",
                      fontWeight: 700,
                      fontSize: "0.74rem",
                      mb: 0.2,
                    }}
                  >
                    System Overview
                  </Typography>
                  <Typography sx={{ color: "#10b981", fontSize: "0.69rem" }}>
                    Monitor all leave requests across departments
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* User Role Badge */}
        <Card sx={{ borderRadius: "8px", bgcolor: "#f5f3ff" }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: isFaculty
                    ? "#7c3aed"
                    : isHOD
                      ? "#f59e0b"
                      : "#10b981",
                }}
              />
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "text.disabled",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Your Role
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  {isFaculty
                    ? "Faculty Member"
                    : isHOD
                      ? "Head of Department"
                      : "Administrator"}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardPage;
