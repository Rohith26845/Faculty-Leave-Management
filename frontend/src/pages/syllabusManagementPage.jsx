import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CloudUpload,
  CheckCircle,
  ArrowForward,
  Edit,
  Visibility,
} from "@mui/icons-material";
import API from "../api/axiosInstance";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";

const SyllabusManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [syllabi, setSyllabi] = useState({
    "four-year": [],
    "single-semester": [],
  });
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0: Full 4-year, 1: Current semester

  // Full 4-year upload dialog
  const [uploadDialog, setUploadDialog] = useState({
    open: false,
    file: null,
    batch: new Date().getFullYear().toString(),
    uploading: false,
    error: "",
  });

  // Current semester upload dialog
  const [currentSemesterDialog, setCurrentSemesterDialog] = useState({
    open: false,
    file: null,
    currentSemester: "1st Semester",
    currentAcademicYear: "1",
    uploading: false,
    error: "",
  });

  // Semester selection dialog (for 4-year)
  const [semesterDialog, setsemesterDialog] = useState({
    open: false,
    syllabus: null,
    allSemesters: [],
    selectedSemester: null,
    selectedYear: null,
    loading: false,
    error: "",
  });

  // Faculty assignment dialog
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    syllabus: null,
    subjects: [],
    assignments: {},
    assigning: false,
    error: "",
  });

  const SEMESTERS = [
    "1st Semester",
    "2nd Semester",
    "3rd Semester",
    "4th Semester",
    "5th Semester",
    "6th Semester",
    "7th Semester",
    "8th Semester",
  ];

  const isHod = user?.role === "hod";

  useEffect(() => {
    if (isHod) {
      fetchSyllabi();
      fetchFaculty();
    }
  }, [isHod]);

  const fetchSyllabi = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(
        `/syllabus/department/${user?.department}`,
      );

      // ✅ Separate by allSemesters length
      const fourYear = data.filter((s) => s.allSemesters.length >= 8);
      const singleSem = data.filter((s) => s.allSemesters.length < 8);

      setSyllabi({
        "four-year": fourYear,
        "single-semester": singleSem,
      });
    } catch (err) {
      console.error("Fetch syllabi error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data } = await API.get("/users/faculty/department");
      setFaculty(data);
    } catch (err) {
      console.error("Fetch faculty error:", err);
    }
  };

  // ============ Full 4-Year Handlers ============

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadDialog((prev) => ({
        ...prev,
        error: "Only PDF files are allowed",
      }));
      return;
    }

    setUploadDialog((prev) => ({
      ...prev,
      file,
      error: "",
    }));
  };

  const handleUpload = async () => {
    if (!uploadDialog.file) {
      setUploadDialog((prev) => ({
        ...prev,
        error: "Please select a file",
      }));
      return;
    }

    setUploadDialog((prev) => ({ ...prev, uploading: true }));

    try {
      const formData = new FormData();
      formData.append("file", uploadDialog.file);
      formData.append("department", user?.department);
      formData.append("batch", uploadDialog.batch);

      const { data } = await API.post("/syllabus/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadDialog((prev) => ({
        ...prev,
        open: false,
        file: null,
        error: "",
        uploading: false,
      }));

      // Show semester selection dialog
      setSemesterDialog((prev) => ({
        ...prev,
        open: true,
        syllabus: data.syllabus,
        allSemesters: data.allSemesters,
        selectedSemester: null,
        selectedYear: null,
      }));

      fetchSyllabi();
    } catch (err) {
      setUploadDialog((prev) => ({
        ...prev,
        error: err.response?.data?.message || err.message,
        uploading: false,
      }));
    }
  };

  const handleSemesterSelect = async () => {
    if (!semesterDialog.selectedSemester || !semesterDialog.selectedYear) {
      setSemesterDialog((prev) => ({
        ...prev,
        error: "Please select both semester and year",
      }));
      return;
    }

    setSemesterDialog((prev) => ({ ...prev, loading: true }));

    try {
      const { data } = await API.post(
        `/syllabus/${semesterDialog.syllabus._id}/set-current-semester`,
        {
          currentSemester: semesterDialog.selectedSemester,
          currentAcademicYear: parseInt(semesterDialog.selectedYear),
        },
      );

      setSemesterDialog((prev) => ({
        ...prev,
        open: false,
        loading: false,
        error: "",
      }));

      // Open faculty assignment dialog
      setAssignDialog((prev) => ({
        ...prev,
        open: true,
        syllabus: semesterDialog.syllabus,
        subjects: data.currentSemesterSubjects,
        assignments: data.currentSemesterSubjects.reduce((acc, subj) => {
          acc[subj.code] = "";
          return acc;
        }, {}),
      }));
    } catch (err) {
      setSemesterDialog((prev) => ({
        ...prev,
        error: err.response?.data?.message || err.message,
        loading: false,
      }));
    }
  };

  // ============ Current Semester Handlers ============

  const handleCurrentSemesterFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setCurrentSemesterDialog((prev) => ({
        ...prev,
        error: "Only PDF files are allowed",
      }));
      return;
    }

    setCurrentSemesterDialog((prev) => ({
      ...prev,
      file,
      error: "",
    }));
  };

  const handleCurrentSemesterUpload = async () => {
    if (!currentSemesterDialog.file) {
      setCurrentSemesterDialog((prev) => ({
        ...prev,
        error: "Please select a file",
      }));
      return;
    }

    setCurrentSemesterDialog((prev) => ({ ...prev, uploading: true }));

    try {
      const formData = new FormData();
      formData.append("file", currentSemesterDialog.file);
      formData.append("department", user?.department);
      formData.append("currentSemester", currentSemesterDialog.currentSemester);
      formData.append(
        "currentAcademicYear",
        currentSemesterDialog.currentAcademicYear,
      );

      const { data } = await API.post(
        "/syllabus/upload-current-semester",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setCurrentSemesterDialog((prev) => ({
        ...prev,
        open: false,
        file: null,
        error: "",
        uploading: false,
      }));

      // Open faculty assignment dialog directly
      setAssignDialog((prev) => ({
        ...prev,
        open: true,
        syllabus: data.syllabus,
        subjects: data.subjects,
        assignments: data.subjects.reduce((acc, subj) => {
          acc[subj.code] = "";
          return acc;
        }, {}),
      }));

      fetchSyllabi();
    } catch (err) {
      setCurrentSemesterDialog((prev) => ({
        ...prev,
        error: err.response?.data?.message || err.message,
        uploading: false,
      }));
    }
  };

  // ============ Faculty Assignment Handlers ============

  const handleAssignmentChange = (subjectCode, facultyId) => {
    setAssignDialog((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [subjectCode]: facultyId,
      },
    }));
  };

  const handleAssignFaculty = async () => {
    const { syllabus, subjects, assignments } = assignDialog;

    // Validate all subjects have faculty assigned
    const unassigned = subjects.filter((s) => !assignments[s.code]);
    if (unassigned.length > 0) {
      setAssignDialog((prev) => ({
        ...prev,
        error: `Please assign faculty to all subjects`,
      }));
      return;
    }

    setAssignDialog((prev) => ({ ...prev, assigning: true }));

    try {
      const assignmentData = subjects.map((subject) => ({
        subjectCode: subject.code,
        facultyId: assignments[subject.code],
      }));

      await API.post(`/syllabus/${syllabus._id}/assign-faculty`, {
        assignments: assignmentData,
      });

      setAssignDialog((prev) => ({
        ...prev,
        open: false,
        assigning: false,
        error: "",
      }));

      fetchSyllabi();
    } catch (err) {
      setAssignDialog((prev) => ({
        ...prev,
        error: err.response?.data?.message || err.message,
        assigning: false,
      }));
    }
  };

  const getFacultyName = (facultyId) => {
    const fac = faculty.find((f) => f._id === facultyId);
    return fac?.name || "Unassigned";
  };

  const getYearLabel = (year) => {
    const labels = {
      1: "1st Year",
      2: "2nd Year",
      3: "3rd Year",
      4: "4th Year",
    };
    return labels[year] || `Year ${year}`;
  };

  if (!isHod) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Alert severity="warning">
          Only HOD can access syllabus management
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Syllabus Management
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
            Upload syllabus and manage faculty assignments
          </Typography>
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Card sx={{ borderRadius: "12px", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 2,
          }}
        >
          <Tab
            label={`📚 Full 4-Year Syllabus (${syllabi["four-year"].length})`}
          />
          <Tab
            label={`📄 Current Semester (${syllabi["single-semester"].length})`}
          />
        </Tabs>
      </Card>

      {/* Tab 1: Full 4-Year Syllabus */}
      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                4-Year Syllabus
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Upload complete syllabus for all 8 semesters
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() =>
                setUploadDialog((prev) => ({ ...prev, open: true }))
              }
              sx={{
                bgcolor: "#7c3aed",
                "&:hover": { bgcolor: "#6d28d9" },
              }}
            >
              Upload 4-Year Syllabus
            </Button>
          </Box>

          {/* Syllabi List - 4 Year */}
          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Card sx={{ borderRadius: "12px" }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell sx={{ fontWeight: 800 }}>Batch</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Total Semesters
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Total Subjects
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Current Semester
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {syllabi["four-year"].length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography sx={{ color: "text.secondary" }}>
                              No 4-year syllabi uploaded yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        syllabi["four-year"].map((syllabus) => (
                          <TableRow key={syllabus._id}>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {syllabus.batch}-{syllabus.batch + 4}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${
                                  syllabus.allSemesters?.length || 0
                                } Semesters`}
                                size="small"
                                sx={{
                                  bgcolor: "#f3f0ff",
                                  color: "#7c3aed",
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${
                                  syllabus.allSemesters.reduce(
                                    (sum, sem) =>
                                      sum + (sem.subjects?.length || 0),
                                    0,
                                  ) || 0
                                } Subjects`}
                                size="small"
                                sx={{
                                  bgcolor: "#dbeafe",
                                  color: "#0284c7",
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {syllabus.currentSemester ? (
                                <Typography sx={{ fontSize: "0.9rem" }}>
                                  {syllabus.currentSemester} (
                                  {getYearLabel(syllabus.currentAcademicYear)})
                                </Typography>
                              ) : (
                                <Typography
                                  sx={{
                                    fontSize: "0.9rem",
                                    color: "text.secondary",
                                  }}
                                >
                                  Not set
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {syllabus.facultyAssigned ? (
                                <Chip
                                  icon={<CheckCircle />}
                                  label="Faculty Assigned"
                                  size="small"
                                  color="success"
                                />
                              ) : (
                                <Chip
                                  label="Pending Assignment"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Visibility />}
                                  onClick={() =>
                                    navigate(`/syllabus/${syllabus._id}`)
                                  }
                                >
                                  View
                                </Button>
                                {!syllabus.facultyAssigned && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => {
                                      setSemesterDialog((prev) => ({
                                        ...prev,
                                        open: true,
                                        syllabus,
                                        allSemesters: syllabus.allSemesters,
                                      }));
                                    }}
                                  >
                                    Assign
                                  </Button>
                                )}
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
          )}
        </>
      )}

      {/* Tab 2: Current Semester Syllabus */}
      {tabValue === 1 && (
        <>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Current Semester Syllabus
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Upload syllabus for current semester only
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() =>
                setCurrentSemesterDialog((prev) => ({ ...prev, open: true }))
              }
              sx={{
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              Upload Current Semester
            </Button>
          </Box>

          {/* Syllabi List - Current Semester */}
          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Card sx={{ borderRadius: "12px" }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell sx={{ fontWeight: 800 }}>Semester</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Year</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Subjects</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Department
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {syllabi["single-semester"].length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography sx={{ color: "text.secondary" }}>
                              No current semester syllabi uploaded yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        syllabi["single-semester"].map((syllabus) => (
                          <TableRow key={syllabus._id}>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {syllabus.currentSemester}
                            </TableCell>
                            <TableCell>
                              {getYearLabel(syllabus.currentAcademicYear)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${
                                  syllabus.currentSemesterSubjects?.length || 0
                                } Subjects`}
                                size="small"
                                sx={{
                                  bgcolor: "#d1fae5",
                                  color: "#10b981",
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>
                            <TableCell>{syllabus.department}</TableCell>
                            <TableCell>
                              {syllabus.facultyAssigned ? (
                                <Chip
                                  icon={<CheckCircle />}
                                  label="Faculty Assigned"
                                  size="small"
                                  color="success"
                                />
                              ) : (
                                <Chip
                                  label="Pending Assignment"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Visibility />}
                                  onClick={() =>
                                    navigate(`/syllabus/${syllabus._id}`)
                                  }
                                >
                                  View
                                </Button>
                                {!syllabus.facultyAssigned && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() =>
                                      setAssignDialog((prev) => ({
                                        ...prev,
                                        open: true,
                                        syllabus,
                                        subjects:
                                          syllabus.currentSemesterSubjects ||
                                          [],
                                        assignments: (
                                          syllabus.currentSemesterSubjects || []
                                        ).reduce((acc, subj) => {
                                          acc[subj.code] =
                                            subj.assignedFaculty || "";
                                          return acc;
                                        }, {}),
                                      }))
                                    }
                                  >
                                    Assign
                                  </Button>
                                )}
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
          )}
        </>
      )}

      {/* ============ DIALOGS ============ */}

      {/* Upload 4-Year Dialog */}
      <Dialog
        open={uploadDialog.open}
        onClose={() =>
          setUploadDialog((prev) => ({
            ...prev,
            open: false,
            error: "",
            file: null,
          }))
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Upload 4-Year Syllabus
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {uploadDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadDialog.error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1, fontWeight: 700 }}>Department</Typography>
            <TextField
              fullWidth
              disabled
              value={user?.department || ""}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1, fontWeight: 700 }}>
              Batch Starting Year
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={uploadDialog.batch}
              onChange={(e) =>
                setUploadDialog((prev) => ({
                  ...prev,
                  batch: e.target.value,
                }))
              }
              size="small"
              placeholder="e.g., 2022"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <Typography
              sx={{ mt: 0.5, fontSize: "0.75rem", color: "text.secondary" }}
            >
              Batch Period: {uploadDialog.batch}-
              {parseInt(uploadDialog.batch) + 4}
            </Typography>
          </Box>

          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              border: "2px dashed #c4b5fd",
              borderRadius: "8px",
              cursor: "pointer",
              bgcolor: "#fafaf9",
              transition: "all 0.2s",
              "&:hover": { bgcolor: "#f5f3ff" },
            }}
            component="label"
          >
            <CloudUpload sx={{ fontSize: 40, color: "#7c3aed", mb: 1 }} />
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              {uploadDialog.file ? uploadDialog.file.name : "Choose PDF file"}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              Upload complete 4-year syllabus PDF
            </Typography>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              hidden
            />
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() =>
              setUploadDialog((prev) => ({
                ...prev,
                open: false,
                error: "",
                file: null,
              }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploadDialog.uploading || !uploadDialog.file}
            sx={{
              bgcolor: "#7c3aed",
              "&:hover": { bgcolor: "#6d28d9" },
            }}
          >
            {uploadDialog.uploading ? "Processing..." : "Upload & Extract"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Current Semester Dialog */}
      <Dialog
        open={currentSemesterDialog.open}
        onClose={() =>
          setCurrentSemesterDialog((prev) => ({
            ...prev,
            open: false,
            error: "",
            file: null,
          }))
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Upload Current Semester Syllabus
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {currentSemesterDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {currentSemesterDialog.error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1, fontWeight: 700 }}>Department</Typography>
            <TextField
              fullWidth
              disabled
              value={user?.department || ""}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography sx={{ mb: 1, fontWeight: 700 }}>Year *</Typography>
              <Select
                fullWidth
                value={currentSemesterDialog.currentAcademicYear}
                onChange={(e) =>
                  setCurrentSemesterDialog((prev) => ({
                    ...prev,
                    currentAcademicYear: e.target.value,
                  }))
                }
                size="small"
              >
                {[1, 2, 3, 4].map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {getYearLabel(year)}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ mb: 1, fontWeight: 700 }}>
                Semester *
              </Typography>
              <Select
                fullWidth
                value={currentSemesterDialog.currentSemester}
                onChange={(e) =>
                  setCurrentSemesterDialog((prev) => ({
                    ...prev,
                    currentSemester: e.target.value,
                  }))
                }
                size="small"
              >
                {SEMESTERS.map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    {sem}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>

          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              border: "2px dashed #d1fae5",
              borderRadius: "8px",
              cursor: "pointer",
              bgcolor: "#f0fdf4",
              transition: "all 0.2s",
              "&:hover": { bgcolor: "#e7fce0" },
            }}
            component="label"
          >
            <CloudUpload sx={{ fontSize: 40, color: "#10b981", mb: 1 }} />
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              {currentSemesterDialog.file
                ? currentSemesterDialog.file.name
                : "Choose PDF file"}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              Upload current semester syllabus PDF
            </Typography>
            <input
              type="file"
              accept=".pdf"
              onChange={handleCurrentSemesterFileSelect}
              hidden
            />
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() =>
              setCurrentSemesterDialog((prev) => ({
                ...prev,
                open: false,
                error: "",
                file: null,
              }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCurrentSemesterUpload}
            disabled={
              currentSemesterDialog.uploading || !currentSemesterDialog.file
            }
            sx={{
              bgcolor: "#10b981",
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            {currentSemesterDialog.uploading
              ? "Processing..."
              : "Upload & Extract"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Semester Selection Dialog (for 4-year) */}
      <Dialog
        open={semesterDialog.open}
        onClose={() =>
          setSemesterDialog((prev) => ({
            ...prev,
            open: false,
            error: "",
          }))
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Select Current Semester
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {semesterDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {semesterDialog.error}
            </Alert>
          )}

          <Typography
            sx={{ mb: 2, fontSize: "0.9rem", color: "text.secondary" }}
          >
            Choose which semester's subjects you want to assign faculty to
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <Typography
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  Academic Year *
                </Typography>
                <Select
                  value={semesterDialog.selectedYear || ""}
                  onChange={(e) =>
                    setSemesterDialog((prev) => ({
                      ...prev,
                      selectedYear: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="" disabled>
                    Select Year
                  </MenuItem>
                  {[1, 2, 3, 4].map((year) => (
                    <MenuItem key={year} value={year}>
                      {getYearLabel(year)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <Typography
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  Semester *
                </Typography>
                <Select
                  value={semesterDialog.selectedSemester || ""}
                  onChange={(e) =>
                    setSemesterDialog((prev) => ({
                      ...prev,
                      selectedSemester: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="" disabled>
                    Select Semester
                  </MenuItem>
                  {SEMESTERS.map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      {sem}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {semesterDialog.selectedYear && semesterDialog.selectedSemester && (
            <Paper
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: "8px",
              }}
            >
              {semesterDialog.allSemesters.find(
                (s) =>
                  s.year === parseInt(semesterDialog.selectedYear) &&
                  s.semester === semesterDialog.selectedSemester,
              )?.subjects.length > 0 ? (
                <Box>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>
                    Subjects Found:
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.9rem", color: "text.secondary" }}
                  >
                    {
                      semesterDialog.allSemesters.find(
                        (s) =>
                          s.year === parseInt(semesterDialog.selectedYear) &&
                          s.semester === semesterDialog.selectedSemester,
                      )?.subjects.length
                    }{" "}
                    subjects will be available for faculty assignment
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ fontSize: "0.9rem", color: "#ef4444" }}>
                  No subjects found for this semester
                </Typography>
              )}
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() =>
              setSemesterDialog((prev) => ({
                ...prev,
                open: false,
                error: "",
              }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSemesterSelect}
            disabled={
              semesterDialog.loading || !semesterDialog.selectedSemester
            }
            sx={{
              bgcolor: "#7c3aed",
              "&:hover": { bgcolor: "#6d28d9" },
            }}
          >
            {semesterDialog.loading ? "Loading..." : "Continue"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Faculty Assignment Dialog */}
      <Dialog
        open={assignDialog.open}
        onClose={() =>
          setAssignDialog((prev) => ({
            ...prev,
            open: false,
            error: "",
          }))
        }
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Assign Faculty to Subjects
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {assignDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {assignDialog.error}
            </Alert>
          )}
          {assignDialog.syllabus && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: "8px",
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography
                    sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                  >
                    Semester
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {assignDialog.syllabus.currentSemester}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    sx={{ fontSize: "0.85rem", color: "text.secondary" }}
                  >
                    Year
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {getYearLabel(assignDialog.syllabus.currentAcademicYear)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Subject Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Credits</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>
                    Assign Faculty *
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignDialog.subjects.map((subject) => (
                  <TableRow key={subject.code}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {subject.code}
                    </TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.credits || "-"}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={assignDialog.assignments[subject.code] || ""}
                          onChange={(e) =>
                            handleAssignmentChange(subject.code, e.target.value)
                          }
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Faculty
                          </MenuItem>
                          {faculty.map((fac) => (
                            <MenuItem key={fac._id} value={fac._id}>
                              {fac.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() =>
              setAssignDialog((prev) => ({
                ...prev,
                open: false,
                error: "",
              }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignFaculty}
            disabled={assignDialog.assigning}
            sx={{
              bgcolor: "#10b981",
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            {assignDialog.assigning ? "Assigning..." : "Assign Faculty"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SyllabusManagementPage;
