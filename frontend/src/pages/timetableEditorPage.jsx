/**
 * Timetable Editor - Each Batch Can Have Different Subject
 */

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Box as MuiBox,
  Paper as MuiPaper,
} from "@mui/material";
import {
  Save,
  Delete,
  ArrowBack,
  Info,
  LocalCafe,
  Science,
} from "@mui/icons-material";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { timetableService } from "../services/timetableService";

const TimetableEditorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initData, setInitData] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [openCellDialog, setOpenCellDialog] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellType, setCellType] = useState("lecture");
  const [batchCount, setBatchCount] = useState(1);
  const [batchDetails, setBatchDetails] = useState([
    { batchNumber: 1, subject: "", faculty: "", room: "" },
  ]);
  const [lectureCellData, setLectureCellData] = useState({
    subject: "",
    faculty: "",
    room: "",
    duration: 1,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const department = searchParams.get("department") || user?.department;
  const semester = searchParams.get("semester") || 1;
  const timetableName = searchParams.get("name") || "New Timetable";

  const TIME_SLOTS = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    fetchInitData();
  }, [department, semester]);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching init data for:", department, semester);

      const response = await timetableService.getInitData(department, semester);
      console.log("Init data response:", response.data);

      setInitData(response.data);

      const schedule = new Map();
      DAYS.forEach((day) => {
        TIME_SLOTS.forEach((time) => {
          const key = `${day}-${time}`;
          schedule.set(key, {
            type: "empty",
            subject: "",
            faculty: "",
            room: "",
            duration: 1,
            batches: [],
          });
        });
      });

      setTimetable({
        name: timetableName,
        department,
        semester,
        schedule,
        subjects: response.data.subjects.map((s, idx) => ({
          subjectId: s._id,
          subjectCode: s.code,
          subjectName: s.name,
          color: response.data.colors[idx % response.data.colors.length],
        })),
        timings: TIME_SLOTS,
      });
    } catch (err) {
      console.error("Error fetching init data:", err);
      setError("Failed to load timetable data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (day, time) => {
    const cellKey = `${day}-${time}`;
    const cellContent = timetable.schedule.get(cellKey);

    const isBlocked = checkIfBlocked(day, time);
    if (isBlocked) {
      setError(
        "This slot is occupied by a class extending from another time slot",
      );
      return;
    }

    setSelectedCell({ day, time, key: cellKey });

    if (cellContent?.type === "break") {
      setCellType("break");
      setLectureCellData({ subject: "", faculty: "", room: "", duration: 1 });
      setBatchCount(1);
      setBatchDetails([{ batchNumber: 1, subject: "", faculty: "", room: "" }]);
    } else if (
      cellContent?.type === "practical" ||
      cellContent?.type === "tutorial"
    ) {
      setCellType(cellContent.type);
      setBatchCount(cellContent?.batches?.length || 1);
      setBatchDetails(
        cellContent?.batches?.length > 0
          ? cellContent.batches
          : [{ batchNumber: 1, subject: "", faculty: "", room: "" }],
      );
    } else if (cellContent?.type === "lecture") {
      setCellType("lecture");
      setLectureCellData({
        subject: cellContent?.subject || "",
        faculty: cellContent?.faculty || "",
        room: cellContent?.room || "",
        duration: cellContent?.duration || 1,
      });
      setBatchCount(1);
      setBatchDetails([{ batchNumber: 1, subject: "", faculty: "", room: "" }]);
    } else {
      setCellType("lecture");
      setLectureCellData({ subject: "", faculty: "", room: "", duration: 1 });
      setBatchCount(1);
      setBatchDetails([{ batchNumber: 1, subject: "", faculty: "", room: "" }]);
    }

    setOpenCellDialog(true);
  };

  const checkIfBlocked = (day, time) => {
    const cellKey = `${day}-${time}`;
    const cellContent = timetable.schedule.get(cellKey);
    return cellContent?.blocked;
  };

  const handleSaveCell = () => {
    if (cellType === "lecture") {
      if (!lectureCellData.subject || !lectureCellData.faculty) {
        setError("Please select both subject and faculty for lecture");
        return;
      }
    } else if (cellType === "practical" || cellType === "tutorial") {
      // Validate all batch details
      const validBatches = batchDetails.filter(
        (b) => b.subject && b.faculty && b.room,
      );
      if (validBatches.length !== batchCount) {
        setError(
          `Please fill in all batch details. ${validBatches.length} of ${batchCount} complete.`,
        );
        return;
      }
    }

    const updatedSchedule = new Map(timetable.schedule);
    const timeIndex = TIME_SLOTS.indexOf(selectedCell.time);
    const duration = cellType === "lecture" ? lectureCellData.duration : 1;

    for (let i = 0; i < duration; i++) {
      const futureTime = TIME_SLOTS[timeIndex + i];
      if (futureTime) {
        const futureKey = `${selectedCell.day}-${futureTime}`;

        if (cellType === "lecture") {
          updatedSchedule.set(futureKey, {
            type: "lecture",
            subject: lectureCellData.subject,
            faculty: lectureCellData.faculty,
            room: lectureCellData.room,
            duration: lectureCellData.duration,
            batches: [],
            blocked: i > 0,
          });
        } else if (cellType === "break") {
          updatedSchedule.set(futureKey, {
            type: "break",
            subject: "",
            faculty: "",
            room: "",
            duration: 1,
            batches: [],
            blocked: i > 0,
          });
        } else {
          // Practical or Tutorial
          updatedSchedule.set(futureKey, {
            type: cellType,
            subject: "", // No single subject for practicals
            faculty: "",
            room: "",
            duration: 1,
            batches: batchDetails,
            blocked: i > 0,
          });
        }
      }
    }

    setTimetable({ ...timetable, schedule: updatedSchedule });
    setError(null);
    setOpenCellDialog(false);
  };

  const handleDeleteCell = () => {
    const updatedSchedule = new Map(timetable.schedule);
    const cellContent = timetable.schedule.get(selectedCell.key);
    const duration = cellType === "lecture" ? lectureCellData.duration : 1;
    const timeIndex = TIME_SLOTS.indexOf(selectedCell.time);

    for (let i = 0; i < duration; i++) {
      const futureTime = TIME_SLOTS[timeIndex + i];
      if (futureTime) {
        const futureKey = `${selectedCell.day}-${futureTime}`;
        updatedSchedule.set(futureKey, {
          type: "empty",
          subject: "",
          faculty: "",
          room: "",
          duration: 1,
          batches: [],
        });
      }
    }

    setTimetable({ ...timetable, schedule: updatedSchedule });
    setOpenCellDialog(false);
  };

  const handleSaveTimetable = async () => {
    try {
      setSaving(true);
      const payload = {
        name: timetable.name,
        department,
        semester,
        schedule: Object.fromEntries(timetable.schedule),
        subjects: timetable.subjects,
        periodTimings: TIME_SLOTS.map((time, idx) => ({
          periodNumber: idx + 1,
          startTime: time,
          endTime: TIME_SLOTS[idx + 1] || "18:00",
        })),
      };
      await timetableService.createTimetable(payload);
      setSuccess("Timetable saved successfully!");
      setTimeout(() => navigate("/timetable"), 1500);
    } catch (err) {
      console.error("Error saving timetable:", err);
      setError("Error saving timetable.");
    } finally {
      setSaving(false);
    }
  };

  const getSubjectColor = (subjectId) => {
    const subject = timetable?.subjects.find((s) => s.subjectId === subjectId);
    return subject?.color || "#ffffff";
  };

  const getSubjectCode = (subjectId) => {
    const subject = initData?.subjects.find((s) => s._id === subjectId);
    return subject?.code || "";
  };

  const getFacultyName = (facultyId) => {
    const faculty = initData?.faculty.find((f) => f._id === facultyId);
    return faculty?.name.split(" ")[0] || "";
  };

  const formatTime = (time) => {
    const [hours, mins] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${mins} ${ampm}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography sx={{ color: "text.secondary" }}>
            Loading timetable editor...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton
          onClick={() => navigate("/timetable")}
          sx={{ color: "#7c3aed" }}
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: "#0f172a" }}>
            {timetable?.name}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
            {department} • Semester {semester}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/timetable")}
          sx={{
            color: "#64748b",
            borderColor: "#cbd5e1",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "8px",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveTimetable}
          disabled={saving}
          sx={{
            bgcolor: "#7c3aed",
            color: "white",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": { bgcolor: "#6d28d9" },
          }}
        >
          {saving ? "Saving..." : "Save Timetable"}
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      {/* Legend */}
      {initData?.subjects && initData.subjects.length > 0 && (
        <Card sx={{ mb: 4, borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <CardContent>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "#0f172a",
                mb: 2,
              }}
            >
              📌 Legend
            </Typography>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "4px",
                    bgcolor: "#dbeafe",
                    border: "2px solid #0284c7",
                  }}
                />
                <Typography sx={{ fontSize: "0.9rem", color: "#475569" }}>
                  Lecture
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Science sx={{ fontSize: "1.2rem", color: "#059669" }} />
                <Typography sx={{ fontSize: "0.9rem", color: "#475569" }}>
                  Practical (Batches)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Science sx={{ fontSize: "1.2rem", color: "#7c3aed" }} />
                <Typography sx={{ fontSize: "0.9rem", color: "#475569" }}>
                  Tutorial (Batches)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocalCafe sx={{ fontSize: "1.2rem", color: "#a855f7" }} />
                <Typography sx={{ fontSize: "0.9rem", color: "#475569" }}>
                  Break
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card
        sx={{
          mb: 4,
          background: "linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)",
          border: "1px solid #fcd34d",
          borderRadius: "12px",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Info
              sx={{ color: "#b45309", fontSize: 20, flexShrink: 0, mt: 0.3 }}
            />
            <Box>
              <Typography sx={{ fontWeight: 700, color: "#854d0e", mb: 0.5 }}>
                How to Use
              </Typography>
              <Typography
                sx={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.6 }}
              >
                • <strong>Lectures:</strong> Single subject & faculty
                <br />• <strong>Practicals/Tutorials:</strong> Each batch can
                have <strong>different subject</strong>
                <br />• Example: Batch 1 (Lab 101, Prof A, BDA) + Batch 2 (Lab
                102, Prof B, AI)
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      <Paper
        sx={{
          overflow: "auto",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <Table sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#0f172a",
                  minWidth: 100,
                  borderRight: "1px solid #e2e8f0",
                  position: "sticky",
                  left: 0,
                  bgcolor: "#f8fafc",
                  zIndex: 10,
                }}
              >
                Time
              </TableCell>
              {DAYS.map((day) => (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    color: "#0f172a",
                    minWidth: 150,
                    borderRight: "1px solid #e2e8f0",
                  }}
                >
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {TIME_SLOTS.map((time) => (
              <TableRow key={time}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#f8fafc",
                    color: "#0f172a",
                    borderRight: "1px solid #e2e8f0",
                    position: "sticky",
                    left: 0,
                    zIndex: 9,
                  }}
                >
                  {formatTime(time)}
                </TableCell>
                {DAYS.map((day) => {
                  const cellKey = `${day}-${time}`;
                  const cellContent = timetable.schedule.get(cellKey);
                  const isBlocked = cellContent?.blocked;
                  const type = cellContent?.type || "empty";
                  const batches = cellContent?.batches || [];

                  if (isBlocked) return null;

                  let displayContent = null;
                  let cellBgColor = "#ffffff";
                  let borderStyle = "1px solid #e2e8f0";

                  if (type === "break") {
                    cellBgColor = "#f3e8ff";
                    borderStyle = "2px dashed #c084fc";
                    displayContent = (
                      <Box sx={{ textAlign: "center" }}>
                        <LocalCafe
                          sx={{ color: "#a855f7", fontSize: "1.5rem", mb: 0.5 }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "#a855f7",
                          }}
                        >
                          Break
                        </Typography>
                      </Box>
                    );
                  } else if (type === "practical" || type === "tutorial") {
                    cellBgColor = "#f0fdf4";
                    displayContent = (
                      <Box sx={{ textAlign: "center" }}>
                        <Science
                          sx={{
                            color: type === "practical" ? "#059669" : "#7c3aed",
                            fontSize: "1.2rem",
                            mb: 0.3,
                          }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "#059669",
                            mb: 0.5,
                          }}
                        >
                          {type === "practical" ? "Practical" : "Tutorial"}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.3,
                          }}
                        >
                          {batches.map((batch) => {
                            const subjectCode = getSubjectCode(batch.subject);
                            const facultyName = getFacultyName(batch.faculty);
                            return (
                              <Box
                                key={batch.batchNumber}
                                sx={{ fontSize: "0.75rem" }}
                              >
                                <Typography
                                  sx={{
                                    color: "#059669",
                                    fontWeight: 700,
                                    mb: 0.1,
                                  }}
                                >
                                  Batch {batch.batchNumber}: {subjectCode}
                                </Typography>
                                <Typography
                                  sx={{ color: "#64748b", fontSize: "0.7rem" }}
                                >
                                  {facultyName} • {batch.room}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  } else if (type === "lecture") {
                    const subjectColor = getSubjectColor(cellContent?.subject);
                    cellBgColor = subjectColor;
                    const subjectCode = getSubjectCode(cellContent?.subject);
                    const facultyName = getFacultyName(cellContent?.faculty);

                    displayContent = (
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color:
                              subjectColor === "#ffffff"
                                ? "#0f172a"
                                : "#ffffff",
                            textShadow:
                              subjectColor === "#ffffff"
                                ? "none"
                                : "0 1px 3px rgba(0,0,0,0.2)",
                            mb: 0.3,
                          }}
                        >
                          {subjectCode}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            color:
                              subjectColor === "#ffffff"
                                ? "#64748b"
                                : "#ffffff",
                            textShadow:
                              subjectColor === "#ffffff"
                                ? "none"
                                : "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        >
                          {facultyName}
                        </Typography>
                      </Box>
                    );
                  }

                  return (
                    <TableCell
                      key={cellKey}
                      align="center"
                      onClick={() => !isBlocked && handleCellClick(day, time)}
                      sx={{
                        bgcolor: cellBgColor,
                        cursor: "pointer",
                        minHeight: 80,
                        p: 1,
                        border: borderStyle,
                        position: "relative",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: "inset 0 0 0 2px #7c3aed",
                          filter: "brightness(0.95)",
                        },
                      }}
                    >
                      {displayContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Cell Edit Dialog */}
      <Dialog
        open={openCellDialog}
        onClose={() => setOpenCellDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0f172a" }}>
          {selectedCell && (
            <>
              Edit: {selectedCell.day} at {formatTime(selectedCell.time)}
            </>
          )}
        </DialogTitle>
        <DialogContent
          sx={{ py: 3, display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          {/* Cell Type Selection */}
          <FormControl component="fieldset">
            <Typography sx={{ fontWeight: 700, mb: 1, fontSize: "0.9rem" }}>
              Type
            </Typography>
            <RadioGroup
              row
              value={cellType}
              onChange={(e) => {
                setCellType(e.target.value);
                if (
                  e.target.value === "practical" ||
                  e.target.value === "tutorial"
                ) {
                  setBatchCount(1);
                  setBatchDetails([
                    { batchNumber: 1, subject: "", faculty: "", room: "" },
                  ]);
                }
              }}
            >
              <FormControlLabel
                value="lecture"
                control={<Radio />}
                label="Lecture"
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="practical"
                control={<Radio />}
                label="Practical"
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="tutorial"
                control={<Radio />}
                label="Tutorial"
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="break"
                control={<Radio />}
                label="Break"
              />
            </RadioGroup>
          </FormControl>

          <Divider />

          {cellType === "lecture" && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={lectureCellData.subject}
                  onChange={(e) =>
                    setLectureCellData({
                      ...lectureCellData,
                      subject: e.target.value,
                    })
                  }
                  label="Subject"
                  sx={{ borderRadius: "8px" }}
                >
                  <MenuItem value="">None</MenuItem>
                  {initData?.subjects &&
                    initData.subjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.code} - {subject.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={lectureCellData.faculty}
                  onChange={(e) =>
                    setLectureCellData({
                      ...lectureCellData,
                      faculty: e.target.value,
                    })
                  }
                  label="Faculty"
                  sx={{ borderRadius: "8px" }}
                >
                  <MenuItem value="">None</MenuItem>
                  {initData?.faculty &&
                    initData.faculty.map((fac) => (
                      <MenuItem key={fac._id} value={fac._id}>
                        {fac.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Room (Optional)"
                value={lectureCellData.room}
                onChange={(e) =>
                  setLectureCellData({
                    ...lectureCellData,
                    room: e.target.value,
                  })
                }
                placeholder="e.g., Room-101"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Duration</InputLabel>
                <Select
                  value={lectureCellData.duration}
                  onChange={(e) =>
                    setLectureCellData({
                      ...lectureCellData,
                      duration: e.target.value,
                    })
                  }
                  label="Duration"
                  sx={{ borderRadius: "8px" }}
                >
                  <MenuItem value={1}>1 Hour</MenuItem>
                  <MenuItem value={2}>2 Hours</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {(cellType === "practical" || cellType === "tutorial") && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>Number of Batches</InputLabel>
                <Select
                  value={batchCount}
                  onChange={(e) => {
                    const numBatches = e.target.value;
                    setBatchCount(numBatches);
                    const newBatchDetails = Array.from(
                      { length: numBatches },
                      (_, i) => ({
                        batchNumber: i + 1,
                        subject: "",
                        faculty: "",
                        room: "",
                      }),
                    );
                    setBatchDetails(newBatchDetails);
                  }}
                  label="Number of Batches"
                  sx={{ borderRadius: "8px" }}
                >
                  <MenuItem value={1}>1 Batch</MenuItem>
                  <MenuItem value={2}>2 Batches</MenuItem>
                  <MenuItem value={3}>3 Batches</MenuItem>
                  <MenuItem value={4}>4 Batches</MenuItem>
                </Select>
              </FormControl>

              {/* Batch Details */}
              <Box
                sx={{
                  bgcolor: "#f8fafc",
                  p: 2,
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 2, fontSize: "0.9rem" }}>
                  Batch Configuration
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  {batchDetails.map((batch, idx) => (
                    <MuiPaper
                      key={idx}
                      sx={{
                        p: 2,
                        bgcolor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          mb: 1.5,
                          color: "#059669",
                        }}
                      >
                        Batch {batch.batchNumber}
                      </Typography>

                      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                        <InputLabel>Subject</InputLabel>
                        <Select
                          value={batch.subject}
                          onChange={(e) => {
                            const updated = [...batchDetails];
                            updated[idx].subject = e.target.value;
                            setBatchDetails(updated);
                          }}
                          label="Subject"
                          sx={{ borderRadius: "8px" }}
                        >
                          <MenuItem value="">Select Subject</MenuItem>
                          {initData?.subjects &&
                            initData.subjects.map((subject) => (
                              <MenuItem key={subject._id} value={subject._id}>
                                {subject.code} - {subject.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                        <InputLabel>Faculty</InputLabel>
                        <Select
                          value={batch.faculty}
                          onChange={(e) => {
                            const updated = [...batchDetails];
                            updated[idx].faculty = e.target.value;
                            setBatchDetails(updated);
                          }}
                          label="Faculty"
                          sx={{ borderRadius: "8px" }}
                        >
                          <MenuItem value="">Select Faculty</MenuItem>
                          {initData?.faculty &&
                            initData.faculty.map((fac) => (
                              <MenuItem key={fac._id} value={fac._id}>
                                {fac.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        size="small"
                        label="Lab/Room"
                        value={batch.room}
                        onChange={(e) => {
                          const updated = [...batchDetails];
                          updated[idx].room = e.target.value;
                          setBatchDetails(updated);
                        }}
                        placeholder="e.g., Lab-101"
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                        }}
                      />
                    </MuiPaper>
                  ))}
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, borderTop: "1px solid #e2e8f0" }}>
          <Button
            onClick={handleDeleteCell}
            startIcon={<Delete />}
            sx={{
              color: "#ef4444",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              mr: "auto",
            }}
          >
            Delete
          </Button>
          <Button
            onClick={() => setOpenCellDialog(false)}
            sx={{
              color: "#64748b",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCell}
            variant="contained"
            sx={{
              bgcolor: "#7c3aed",
              color: "white",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#6d28d9" },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimetableEditorPage;
