/**
 * Timetable Generation Page - HOD Only
 * Create and manage class timetables
 * Matches app design with navbar, sidebar, etc.
 */

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Info,
  ArrowBack,
  MoreVert,
} from "@mui/icons-material";
import { useAuth } from "../context/authContext";
import { timetableService } from "../services/timetableService";
import { useNavigate } from "react-router-dom";

const TimetableGenerationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    semester: 1,
  });

  useEffect(() => {
    if (user?.department) {
      fetchTimetables();
    }
  }, [user?.department]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timetableService.getDepartmentTimetables(
        user?.department,
      );
      setTimetables(response.data || []);
    } catch (err) {
      console.error("Error fetching timetables:", err);
      setError("Failed to load timetables");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (timetable = null) => {
    if (timetable) {
      setEditingTimetable(timetable);
      setFormData({
        name: timetable.name,
        semester: timetable.semester,
      });
    } else {
      setEditingTimetable(null);
      setFormData({ name: "", semester: 1 });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTimetable(null);
    setFormData({ name: "", semester: 1 });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateTimetable = () => {
    if (!formData.name.trim()) {
      setError("Timetable name is required");
      return;
    }

    try {
      const params = new URLSearchParams({
        name: formData.name,
        semester: formData.semester,
      });
      navigate(`/timetable/editor?${params.toString()}`);
      handleCloseDialog();
    } catch (err) {
      setError("Failed to create timetable");
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (window.confirm("Are you sure you want to delete this timetable?")) {
      try {
        // You'll need to add this endpoint to your backend
        // await timetableService.deleteTimetable(id);
        setSuccess("Timetable deleted successfully");
        fetchTimetables();
      } catch (err) {
        setError("Failed to delete timetable");
      }
    }
  };

  // Check if user is HOD
  if (user?.role !== "hod") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "#f8fafc",
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          ❌ Only HOD can access timetable generation
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#f8fafc",
      }}
    >
      {/* Page Header */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e2e8f0",
          py: 3,
          sticky: 0,
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "1.2rem",
              }}
            >
              📅
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                }}
              >
                Timetable Management
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Create and manage department timetables
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ mb: 3 }}
          >
            {success}
          </Alert>
        )}

        {/* Info Card */}
        <Card
          sx={{
            mb: 4,
            background: "linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)",
            border: "1px solid #e0e7ff",
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  bgcolor: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                <Info sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#0f172a",
                    mb: 0.5,
                  }}
                >
                  How to Create a Timetable
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.9rem",
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  1. Click "Create New Timetable" button • 2. Enter timetable
                  name and select semester • 3. Edit individual cells to add
                  subjects and faculty • 4. Fix any scheduling conflicts • 5.
                  Publish when ready to make it visible
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Header with Action Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
              Department: <strong>{user?.department}</strong>
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: "#7c3aed",
              color: "white",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem",
              py: 1.2,
              px: 2.5,
              borderRadius: "8px",
              "&:hover": {
                bgcolor: "#6d28d9",
              },
              transition: "all 0.3s",
            }}
          >
            Create New Timetable
          </Button>
        </Box>

        {/* Timetables List */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 300,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography sx={{ color: "text.secondary" }}>
                Loading timetables...
              </Typography>
            </Box>
          </Box>
        ) : timetables.length === 0 ? (
          <Card
            sx={{
              borderRadius: "12px",
              border: "2px dashed #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Box sx={{ fontSize: "3rem", mb: 2 }}>📋</Box>
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  mb: 1,
                }}
              >
                No timetables yet
              </Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                  mb: 3,
                }}
              >
                Create your first timetable to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{
                  bgcolor: "#7c3aed",
                  color: "white",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#6d28d9" },
                }}
              >
                Create First Timetable
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {timetables.map((tt) => (
              <Grid item xs={12} sm={6} md={4} key={tt._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    transition: "all 0.3s",
                    "&:hover": {
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                      borderColor: "#7c3aed",
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    {/* Timetable Name */}
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "#0f172a",
                        mb: 1,
                      }}
                    >
                      {tt.name}
                    </Typography>

                    {/* Semester Info */}
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.9rem",
                        mb: 2,
                      }}
                    >
                      Semester {tt.semester}
                    </Typography>

                    {/* Status Chips */}
                    <Box
                      sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}
                    >
                      <Chip
                        label={tt.isPublished ? "✅ Published" : "📝 Draft"}
                        size="small"
                        sx={{
                          bgcolor: tt.isPublished ? "#dcfce7" : "#fef9c3",
                          color: tt.isPublished ? "#166534" : "#854d0e",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          height: 22,
                        }}
                      />
                      {tt.hasConflicts && (
                        <Tooltip
                          title={`Conflicts: ${tt.conflictDetails?.join(", ")}`}
                        >
                          <Chip
                            label="⚠️ Conflicts"
                            size="small"
                            sx={{
                              bgcolor: "#fee2e2",
                              color: "#991b1b",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              height: 22,
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>

                    {/* Meta Info */}
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: "#94a3b8",
                      }}
                    >
                      Created: {new Date(tt.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      p: 2,
                      borderTop: "1px solid #e2e8f0",
                      bgcolor: "#f8fafc",
                      borderBottomLeftRadius: "12px",
                      borderBottomRightRadius: "12px",
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => navigate(`/timetable/editor/${tt._id}`)}
                      sx={{
                        flex: 1,
                        color: "#7c3aed",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "6px",
                        border: "1px solid #7c3aed",
                        "&:hover": {
                          bgcolor: "#f0f4ff",
                        },
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteTimetable(tt._id)}
                      sx={{
                        flex: 1,
                        color: "#ef4444",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "6px",
                        border: "1px solid #ef4444",
                        "&:hover": {
                          bgcolor: "#fef2f2",
                        },
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Create Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "#0f172a",
            borderBottom: "1px solid #e2e8f0",
            py: 2,
          }}
        >
          Create New Timetable
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              label="Timetable Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g., CS Department Sem 3"
              variant="outlined"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                name="semester"
                value={formData.semester}
                onChange={handleFormChange}
                label="Semester"
                sx={{
                  borderRadius: "8px",
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: "1px solid #e2e8f0",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={handleCloseDialog}
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
            onClick={handleCreateTimetable}
            variant="contained"
            sx={{
              bgcolor: "#7c3aed",
              color: "white",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": {
                bgcolor: "#6d28d9",
              },
            }}
          >
            Create & Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimetableGenerationPage;
