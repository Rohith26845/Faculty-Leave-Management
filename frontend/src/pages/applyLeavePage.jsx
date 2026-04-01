import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
} from "@mui/material";
import dayjs from "dayjs";
import API from "../api/axiosInstance";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";

const LEAVE_TYPES = [
  { key: "casual", label: "Casual Leave (CL)" },
  { key: "medical", label: "Medical Leave (ML)" },
  { key: "earned", label: "Earned Leave (EL)" },
  { key: "onDuty", label: "On Duty (OD)" },
  { key: "special", label: "Special Leave (SP - No Pay)" },
  { key: "leaveWithoutPay", label: "Leave Without Pay (LWP)" },
];

const ApplyLeavePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFaculty = user?.role === "faculty";

  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [dayType, setDayType] = useState("FULL"); // FULL | HALF (CL only)
  const [halfSession, setHalfSession] = useState("FN");

  const [reason, setReason] = useState("");

  const [substituteOptions, setSubstituteOptions] = useState([]);
  const [substitute, setSubstitute] = useState(null);

  const [attachment, setAttachment] = useState(null);

  const [loadingSubs, setLoadingSubs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isML = leaveType === "medical";
  const isCL = leaveType === "casual";

  const durationDays = useMemo(() => {
    const s = dayjs(startDate);
    const e = dayjs(endDate);
    if (!s.isValid() || !e.isValid()) return 0;
    const diff = e.diff(s, "day") + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isFaculty) return;

    const loadSubstitutes = async () => {
      setLoadingSubs(true);
      setError("");
      try {
        const { data } = await API.get("/leaves/substitutes");
        setSubstituteOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        setSubstituteOptions([]);
        setError(e?.response?.data?.message || "Failed to load substitutes.");
      } finally {
        setLoadingSubs(false);
      }
    };

    loadSubstitutes();
  }, [isFaculty]);

  useEffect(() => {
    // If not CL, force FULL
    if (!isCL && dayType === "HALF") setDayType("FULL");
    // For HALF, endDate must equal startDate
    if (dayType === "HALF") setEndDate(startDate);
  }, [isCL, dayType, startDate]);

  const validate = () => {
    setError("");
    setSuccess("");

    if (!leaveType) return "Please select a leave type.";
    if (!startDate || !dayjs(startDate).isValid())
      return "Please select a valid start date.";
    if (!endDate || !dayjs(endDate).isValid())
      return "Please select a valid end date.";
    if (dayjs(endDate).isBefore(dayjs(startDate), "day"))
      return "End date cannot be before start date.";

    if (!reason || reason.trim().length < 10)
      return "Please enter a valid reason (min 10 characters).";
    if (!substitute?.name)
      return "Please select a proposed substitute from the list.";

    // Policy: max 3 CL continuous (sandwich counted)
    if (leaveType === "casual" && dayType === "FULL" && durationDays > 3) {
      return "Casual Leave cannot exceed 3 continuous days.";
    }

    // Half-day only for CL and same date
    if (dayType === "HALF") {
      if (leaveType !== "casual")
        return "Half-day is allowed only for Casual Leave.";
      if (startDate !== endDate)
        return "Half-day leave must be for a single date.";
    }

    // ML attachment required (your backend enforces it)
    if (isML && !attachment)
      return "Medical leave requires uploading a certificate (attachment).";

    return "";
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (attachment) {
        const fd = new FormData();
        fd.append("leaveType", leaveType);
        fd.append("startDate", startDate);
        fd.append("endDate", endDate);
        fd.append("reason", reason.trim());
        fd.append("substituteRequested", substitute.name);
        fd.append("dayType", dayType);
        if (dayType === "HALF") fd.append("halfSession", halfSession);
        fd.append("affectedClasses", JSON.stringify([]));
        fd.append("isUrgent", "false");
        fd.append("isDuringExamPeriod", "false");
        fd.append("isDuringTeaching", "false");
        fd.append("attachment", attachment); // matches backend upload.single("attachment")

        await API.post("/leaves", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/leaves", {
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
          substituteRequested: substitute.name,
          dayType,
          halfSession: dayType === "HALF" ? halfSession : null,
          affectedClasses: [],
          isUrgent: false,
          isDuringExamPeriod: false,
          isDuringTeaching: false,
        });
      }

      setSuccess("Leave application submitted successfully.");
      setLeaveType("");
      setDayType("FULL");
      setHalfSession("FN");
      setReason("");
      setSubstitute(null);
      setAttachment(null);
      navigate("/dashboard");
      window.dispatchEvent(new Event("leaves:changed"));
    } catch (e) {
      setError(
        e?.response?.data?.message || "Failed to submit leave application.",
      );
      console.error(
        "Leave submit error:",
        e?.response?.status,
        e?.response?.data,
        e,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isFaculty) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Alert severity="warning">Only Faculty can apply for leave.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 950, mx: "auto" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Apply Leave
        </Typography>
        <Typography
          sx={{ color: "text.secondary", mt: 0.3, fontSize: "0.9rem" }}
        >
          Leaves during teaching/examination periods are discouraged. Approvals
          depend on substitute availability.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: "14px" }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Typography
            sx={{
              fontWeight: 900,
              mb: 1,
              fontSize: "0.85rem",
              color: "text.secondary",
            }}
          >
            Leave Type *
          </Typography>

          <ToggleButtonGroup
            value={leaveType}
            exclusive
            onChange={(e, v) => v && setLeaveType(v)}
            sx={{
              mb: 2.5,
              bgcolor: "background.default",
              p: 0.6,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              flexWrap: "wrap",
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                px: 1.6,
                py: 0.9,
              },
              "& .Mui-selected": {
                bgcolor: "#ffffff !important",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              },
            }}
          >
            {LEAVE_TYPES.map((t) => (
              <ToggleButton key={t.key} value={t.key}>
                {t.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Grid container spacing={2} sx={{ mb: 2.2 }}>
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontWeight: 900,
                  mb: 0.8,
                  fontSize: "0.85rem",
                  color: "text.secondary",
                }}
              >
                Start Date *
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontWeight: 900,
                  mb: 0.8,
                  fontSize: "0.85rem",
                  color: "text.secondary",
                }}
              >
                End Date *
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                disabled={dayType === "HALF"}
              />
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              mb: 2.2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={`Duration: ${durationDays} day${durationDays === 1 ? "" : "s"}`}
            />

            <ToggleButtonGroup
              value={dayType}
              exclusive
              onChange={(e, v) => v && setDayType(v)}
              size="small"
              sx={{
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "10px",
                "& .MuiToggleButton-root": {
                  border: "none",
                  fontWeight: 800,
                  textTransform: "none",
                },
                "& .Mui-selected": { bgcolor: "#ffffff !important" },
              }}
            >
              <ToggleButton value="FULL">Full day</ToggleButton>
              <ToggleButton value="HALF" disabled={!isCL}>
                Half day (CL only)
              </ToggleButton>
            </ToggleButtonGroup>

            {dayType === "HALF" && (
              <ToggleButtonGroup
                value={halfSession}
                exclusive
                onChange={(e, v) => v && setHalfSession(v)}
                size="small"
                sx={{
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "10px",
                  "& .MuiToggleButton-root": {
                    border: "none",
                    fontWeight: 800,
                    textTransform: "none",
                  },
                  "& .Mui-selected": { bgcolor: "#ffffff !important" },
                }}
              >
                <ToggleButton value="FN">FN</ToggleButton>
                <ToggleButton value="AN">AN</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          <Typography
            sx={{
              fontWeight: 900,
              mb: 0.8,
              fontSize: "0.85rem",
              color: "text.secondary",
            }}
          >
            Reason for Leave *
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain the reason for leave"
            size="small"
            sx={{ mb: 2.5 }}
          />

          <Divider sx={{ mb: 2.2 }} />

          <Typography
            sx={{
              fontWeight: 900,
              mb: 0.8,
              fontSize: "0.85rem",
              color: "text.secondary",
            }}
          >
            Proposed Substitute *
          </Typography>

          {loadingSubs ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
                mb: 2.5,
              }}
            >
              <CircularProgress size={18} />
              <Typography sx={{ fontSize: "0.9rem" }}>
                Loading substitutes...
              </Typography>
            </Box>
          ) : (
            <Autocomplete
              options={substituteOptions}
              value={substitute}
              onChange={(e, v) => setSubstitute(v)}
              getOptionLabel={(opt) =>
                opt?.name ? `${opt.name} (${opt.email})` : ""
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select substitute faculty"
                  size="small"
                />
              )}
              isOptionEqualToValue={(opt, val) => opt?._id === val?._id}
              sx={{ mb: 1 }}
            />
          )}

          <Typography
            sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 2.2 }}
          >
            Required for teaching periods — approvals depend on substitute
            availability.
          </Typography>

          {isML && (
            <>
              <Divider sx={{ mb: 2.2 }} />
              <Typography
                sx={{
                  fontWeight: 900,
                  mb: 0.8,
                  fontSize: "0.85rem",
                  color: "text.secondary",
                }}
              >
                Medical Certificate (Attachment) *
              </Typography>

              <Button
                variant="outlined"
                component="label"
                sx={{ borderRadius: "10px", mb: 1 }}
              >
                Choose file (PDF/JPG/PNG/WEBP)
                <input
                  type="file"
                  hidden
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                />
              </Button>

              {attachment && (
                <Typography
                  sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1.5 }}
                >
                  Selected: <strong>{attachment.name}</strong>
                </Typography>
              )}
            </>
          )}

          <Divider sx={{ my: 2.2 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.2 }}>
            <Button
              onClick={() => {
                setError("");
                setSuccess("");
                setLeaveType("");
                setDayType("FULL");
                setHalfSession("FN");
                setReason("");
                setSubstitute(null);
                setAttachment(null);
              }}
              sx={{ borderRadius: "10px" }}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                borderRadius: "10px",
                px: 2.6,
                fontWeight: 900,
                bgcolor: "#7c3aed",
                "&:hover": { bgcolor: "#6d28d9" },
                boxShadow: "none",
              }}
            >
              {submitting ? "Submitting..." : "Submit Leave Application"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApplyLeavePage;
