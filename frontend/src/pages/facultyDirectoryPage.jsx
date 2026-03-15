import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Avatar,
  InputBase,
  Menu,
  MenuItem,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormHelperText,
  Select,
  TableContainer,
} from "@mui/material";
import {
  Search,
  MoreVert,
  Tune,
  CheckCircle,
  PersonAddAlt1,
  Close,
  CloudUpload,
  ErrorOutline,
  ContentCopy,
  CloudDownload, // ✅ ADD THIS
} from "@mui/icons-material";

import API, { getAvatarUrl } from "../api/axiosInstance";
import { useAuth } from "../context/authContext";

const uniq = (arr) => Array.from(new Set(arr));

const COURSE_OPTIONS = ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."];

const DEPARTMENT_COURSE_MATRIX = {
  "Computer Engineering": ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."],
  "Information Technology": ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."],
  "Mechanical Engineering": ["B.Tech (UG)", "M.Tech (PG)", "Ph.D."],
  "Electronics & Computer Science": ["B.Tech (UG)"],
  "Electronics & Telecommunication": ["B.Tech (UG)"],
  "Automobile Engineering": ["B.Tech (UG)"],
  "Electronics Engineering": ["M.Tech (PG)", "Ph.D."],
};

const DEPARTMENTS = Object.keys(DEPARTMENT_COURSE_MATRIX);

const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lab Assistant",
  "Administrative Staff",
  "Lecturer",
];

const FacultyDirectoryPage = () => {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTx, setSearchTx] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeRow, setActiveRow] = useState(null);

  const [editDlg, setEditDlg] = useState({
    open: false,
    row: null,
    subjectsText: "",
  });
  const [savingSubjects, setSavingSubjects] = useState(false);

  /* Create dialog (admin-only) */
  const [createDlg, setCreateDlg] = useState({
    open: false,
    name: "",
    email: "",
    password: "",
    department: "",
    course: "",
    designation: "",
    phone: "",
    role: "faculty",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  /* CSV Import Dialog */
  const [csvDialog, setCsvDialog] = useState({
    open: false,
    file: null,
    preview: [],
    loading: false,
    results: null,
  });
  const [copied, setCopied] = useState(null);

  const isAdmin = user?.role === "admin";
  const isHod = user?.role === "hod";

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = isAdmin ? "/users/faculty/all" : "/users/faculty/department";
      const params = {};
      if (isAdmin && deptFilter !== "all") params.department = deptFilter;

      const { data } = await API.get(url, { params });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptFilter]);

  const departmentsFromData = useMemo(() => {
    return ["all", ...uniq(rows.map((r) => r.department).filter(Boolean))];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = searchTx.trim().toLowerCase();
    return rows.filter((r) => {
      if (!q) return true;
      return (
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.designation?.toLowerCase().includes(q) ||
        r.program?.toLowerCase().includes(q) ||
        (r.subjects || []).join(", ").toLowerCase().includes(q)
      );
    });
  }, [rows, searchTx]);

  const allChecked =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r._id));

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allChecked) {
      filtered.forEach((r) => next.delete(r._id));
    } else {
      filtered.forEach((r) => next.add(r._id));
    }
    setSelectedIds(next);
  };

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const openMenu = (e, row) => {
    setMenuAnchor(e.currentTarget);
    setActiveRow(row);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setActiveRow(null);
  };

  const openEditSubjects = (row) => {
    setEditDlg({
      open: true,
      row,
      subjectsText: (row.subjects || []).join(", "),
    });
    closeMenu();
  };

  const saveSubjects = async () => {
    if (!editDlg.row) return;
    setSavingSubjects(true);
    try {
      const subjects = editDlg.subjectsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await API.put(`/users/${editDlg.row._id}/subjects`, { subjects });

      setEditDlg({ open: false, row: null, subjectsText: "" });
      await fetchData();
    } catch {
      // ignore; backend error handling can be added later
    } finally {
      setSavingSubjects(false);
    }
  };

  /* Admin Create Individual Faculty */
  const openCreate = () => {
    setCreateError("");
    setCreateDlg({
      open: true,
      name: "",
      email: "",
      password: "",
      department: "",
      course: "",
      designation: "",
      phone: "",
      role: "faculty",
    });
  };

  const closeCreate = () => {
    setCreateDlg((d) => ({ ...d, open: false }));
    setCreateError("");
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;

    setCreateDlg((d) => {
      if (name === "department") {
        const allowed = DEPARTMENT_COURSE_MATRIX[value] || [];
        const nextCourse = allowed.includes(d.course) ? d.course : "";
        return { ...d, department: value, course: nextCourse };
      }
      return { ...d, [name]: value };
    });

    setCreateError("");
  };

  const allowedCoursesForSelectedDept =
    DEPARTMENT_COURSE_MATRIX[createDlg.department] || [];

  const submitCreate = async () => {
    if (!isAdmin) return;
    setCreateError("");

    const { name, email, password, department, course, role } = createDlg;
    if (!name || !email || !password || !department || !course || !role) {
      setCreateError(
        "Please fill all required fields (name, email, password, department, course, role).",
      );
      return;
    }

    if (!allowedCoursesForSelectedDept.includes(course)) {
      setCreateError(
        "Selected course is not available for the selected department.",
      );
      return;
    }

    setCreating(true);
    try {
      await API.post("/auth/create-user", {
        name: createDlg.name,
        email: createDlg.email,
        password: createDlg.password,
        role: createDlg.role,
        department: createDlg.department,
        program: createDlg.course,
        designation: createDlg.designation,
        phone: createDlg.phone,
        subjects: [],
      });

      closeCreate();
      await fetchData();
    } catch (err) {
      console.error(
        "Create user error:",
        err?.response?.status,
        err?.response?.data,
        err,
      );
      setCreateError(
        err?.response?.data?.message ||
          `Failed to create faculty (status ${err?.response?.status || "?"}).`,
      );
    } finally {
      setCreating(false);
    }
  };

  /* CSV Import Handlers */
  const handleCsvFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    setCsvDialog((prev) => ({
      ...prev,
      file,
      loading: true,
    }));

    try {
      const text = await file.text();

      // Split by newline and filter out empty lines
      let lines = text
        .split("\n")
        .map((line) => line.trim()) // Trim each line first
        .filter((line) => line.length > 0); // Remove completely empty lines

      if (lines.length < 2) {
        alert("CSV file must have a header row and at least one data row");
        setCsvDialog((prev) => ({
          ...prev,
          loading: false,
          file: null,
        }));
        return;
      }

      // Get headers from first row
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      // Preview: show first 5 data rows (skip header)
      const previewLines = lines.slice(1, 6);

      const preview = previewLines
        .map((line) => {
          // Split by comma and trim each value
          const values = line.split(",").map((v) => v.trim());

          // Create object with headers
          return headers.reduce((obj, header, idx) => {
            obj[header] = values[idx] || ""; // Handle missing columns
            return obj;
          }, {});
        })
        .filter((row) => {
          // Filter out rows where all values are empty
          return Object.values(row).some((val) => val.length > 0);
        });

      if (preview.length === 0) {
        alert("CSV file has no valid data rows");
        setCsvDialog((prev) => ({
          ...prev,
          loading: false,
          file: null,
        }));
        return;
      }

      setCsvDialog((prev) => ({
        ...prev,
        preview,
        loading: false,
        open: true,
      }));
    } catch (err) {
      alert(`Error reading file: ${err.message}`);
      setCsvDialog((prev) => ({
        ...prev,
        loading: false,
        file: null,
      }));
    }
  };

  const handleCsvImport = async () => {
    if (!csvDialog.file) return;

    setCsvDialog((prev) => ({ ...prev, loading: true }));

    try {
      const formData = new FormData();
      formData.append("file", csvDialog.file);

      const { data } = await API.post("/auth/import-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCsvDialog((prev) => ({
        ...prev,
        results: data,
        loading: false,
      }));

      setTimeout(() => fetchData(), 1000);
    } catch (err) {
      setCsvDialog((prev) => ({
        ...prev,
        loading: false,
      }));
      alert(`Import failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const copyPassword = (password) => {
    navigator.clipboard.writeText(password);
    setCopied(password);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadPasswords = async () => {
    if (!csvDialog.results) return;

    setCsvDialog((prev) => ({ ...prev, loading: true }));

    try {
      // ✅ Tell axios to expect blob/text response
      const response = await API.post(
        "/auth/export-passwords",
        {
          results: csvDialog.results.results,
        },
        {
          responseType: "blob", // ✅ KEY FIX: Get response as blob
        },
      );

      // Create blob from response
      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      // Create download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `faculty-passwords-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(`Download failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCsvDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeCsvDialog = () => {
    setCsvDialog((prev) => ({
      ...prev,
      open: false,
      results: null,
      file: null,
      preview: [],
    }));
  };

  if (!isAdmin && !isHod) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Typography sx={{ color: "text.secondary" }}>
          Not authorized.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box
        sx={{
          mb: 2.5,
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Faculty Directory
          </Typography>
          <Typography
            sx={{ color: "text.secondary", mt: 0.3, fontSize: "0.9rem" }}
          >
            {isAdmin
              ? "All faculties in the college (admin view)."
              : `Department view — ${user?.department}`}
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1 />}
            onClick={openCreate}
            sx={{
              borderRadius: "10px",
              px: 2,
              py: 1.05,
              fontWeight: 800,
              bgcolor: "#7c3aed",
              "&:hover": { bgcolor: "#6d28d9" },
              boxShadow: "none",
              alignSelf: "flex-start",
            }}
          >
            Add Faculty
          </Button>
        )}
      </Box>

      {/* CSV Upload Section */}
      {isAdmin && (
        <Card sx={{ mb: 3, borderRadius: "8px", border: "2px dashed #c4b5fd" }}>
          <CardContent sx={{ py: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CloudUpload sx={{ fontSize: 40, color: "#7c3aed" }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Bulk Import Faculty & HOD
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 1 }}
                >
                  Upload CSV to add multiple faculty at once. Each will get a
                  random password.
                </Typography>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileSelect}
                  style={{ display: "none" }}
                  id="csv-file-input"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    document.getElementById("csv-file-input").click()
                  }
                >
                  Choose CSV File
                </Button>
                {csvDialog.file && (
                  <Typography
                    variant="caption"
                    sx={{ ml: 1, color: "#059669" }}
                  >
                    ✓ {csvDialog.file.name}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: "12px" }}>
        <CardContent sx={{ p: 0 }}>
          {/* Toolbar (filters + search) */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {isAdmin && (
                <>
                  <Chip
                    icon={<Tune sx={{ fontSize: 16 }} />}
                    label={
                      deptFilter === "all" ? "All departments" : deptFilter
                    }
                    sx={{
                      bgcolor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                      fontWeight: 600,
                      borderRadius: "10px",
                    }}
                  />
                  <TextField
                    select
                    size="small"
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    sx={{
                      minWidth: 260,
                      "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                      "& fieldset": { borderColor: "#e2e8f0" },
                    }}
                  >
                    {departmentsFromData.map((d) => (
                      <MenuItem key={d} value={d} sx={{ fontSize: "0.9rem" }}>
                        {d === "all" ? "All departments" : d}
                      </MenuItem>
                    ))}
                  </TextField>
                </>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                borderRadius: "10px",
                px: 1.5,
                py: 0.6,
                minWidth: { xs: "100%", sm: 340 },
                "&:focus-within": { borderColor: "#c4b5fd" },
              }}
            >
              <Search sx={{ color: "text.disabled", fontSize: 18 }} />
              <InputBase
                placeholder="Search"
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                sx={{ flex: 1, fontSize: "0.9rem" }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Table */}
          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress sx={{ color: "#7c3aed" }} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                    <Checkbox checked={allChecked} onChange={toggleAll} />
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "text.disabled",
                    }}
                  >
                    CUSTOMER
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "text.disabled",
                    }}
                  >
                    ROLE
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "text.disabled",
                    }}
                  >
                    DEPARTMENT
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "text.disabled",
                    }}
                  >
                    PROGRAM
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "text.disabled",
                    }}
                  >
                    SUBJECTS
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "text.disabled",
                      pr: 2.5,
                    }}
                  >
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filtered.map((r) => {
                  const avatarUrl = getAvatarUrl(r.avatar);
                  const isSelected = selectedIds.has(r._id);

                  return (
                    <TableRow
                      key={r._id}
                      hover
                      sx={{ "&:hover": { bgcolor: "rgba(124,58,237,0.02)" } }}
                    >
                      <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleOne(r._id)}
                        />
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                          }}
                        >
                          <Avatar
                            src={avatarUrl || undefined}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: "10px",
                              bgcolor: avatarUrl ? "transparent" : "#7c3aed",
                              fontWeight: 800,
                            }}
                          >
                            {!avatarUrl && r.name?.charAt(0)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                color: "text.primary",
                              }}
                            >
                              {r.name}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.78rem",
                                color: "text.secondary",
                              }}
                            >
                              {r.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 14 }} />}
                          label={r.role?.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: "#ecfdf5",
                            color: "#166534",
                            fontWeight: 800,
                            borderRadius: "999px",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: "0.85rem",
                            color: "text.secondary",
                          }}
                        >
                          {r.department}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: "0.85rem",
                            color: "text.secondary",
                          }}
                        >
                          {r.program || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {(r.subjects || []).length === 0 ? (
                          <Typography
                            sx={{
                              fontSize: "0.82rem",
                              color: "text.disabled",
                            }}
                          >
                            —
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.6,
                              flexWrap: "wrap",
                              maxWidth: 380,
                            }}
                          >
                            {(r.subjects || []).slice(0, 4).map((s) => (
                              <Chip
                                key={s}
                                label={s}
                                size="small"
                                sx={{
                                  bgcolor: "background.default",
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: "999px",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                }}
                              />
                            ))}
                            {(r.subjects || []).length > 4 && (
                              <Chip
                                label={`+${(r.subjects || []).length - 4}`}
                                size="small"
                                sx={{
                                  bgcolor: "#f5f3ff",
                                  color: "#7c3aed",
                                  borderRadius: "999px",
                                  fontWeight: 800,
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ pr: 2.5 }}>
                        <IconButton onClick={(e) => openMenu(e, r)}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{ py: 6, color: "text.disabled" }}
                    >
                      No faculty records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Row menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        {isHod && activeRow?.role === "faculty" && (
          <MenuItem onClick={() => openEditSubjects(activeRow)}>
            Edit Subjects
          </MenuItem>
        )}
        <MenuItem onClick={closeMenu}>Close</MenuItem>
      </Menu>

      {/* Edit subjects dialog */}
      <Dialog
        open={editDlg.open}
        onClose={() => setEditDlg({ open: false, row: null, subjectsText: "" })}
        PaperProps={{ sx: { borderRadius: "12px", minWidth: 420 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Allocate Subjects</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Typography
            sx={{ color: "text.secondary", mb: 1.5, fontSize: "0.85rem" }}
          >
            Faculty: <strong>{editDlg.row?.name}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Subjects (comma separated)"
            value={editDlg.subjectsText}
            onChange={(e) =>
              setEditDlg((d) => ({ ...d, subjectsText: e.target.value }))
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <Typography
            sx={{ mt: 1, fontSize: "0.75rem", color: "text.disabled" }}
          >
            Example: DSA, DBMS, OS
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() =>
              setEditDlg({ open: false, row: null, subjectsText: "" })
            }
            sx={{ borderRadius: "10px" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveSubjects}
            disabled={savingSubjects}
            sx={{
              borderRadius: "10px",
              bgcolor: "#7c3aed",
              "&:hover": { bgcolor: "#6d28d9" },
              boxShadow: "none",
              fontWeight: 800,
            }}
          >
            {savingSubjects ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Faculty dialog (admin only) */}
      <Dialog
        open={createDlg.open}
        onClose={closeCreate}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            width: "100%",
            maxWidth: 720,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ px: 3, py: 2.2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: "1.25rem",
                  color: "text.primary",
                }}
              >
                Add Faculty
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "text.secondary",
                  mt: 0.4,
                }}
              >
                Admin-only: create a new faculty/HOD account
              </Typography>
            </Box>

            <IconButton
              onClick={closeCreate}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "10px",
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 2.5 }}>
          {createError && (
            <Box
              sx={{
                mb: 2,
                p: 1.2,
                borderRadius: "12px",
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <Typography
                sx={{
                  color: "#991b1b",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                }}
              >
                {createError}
              </Typography>
            </Box>
          )}

          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "text.secondary",
              mb: 0.7,
            }}
          >
            Full name *
          </Typography>
          <TextField
            fullWidth
            name="name"
            placeholder="Enter full name"
            value={createDlg.name}
            onChange={handleCreateChange}
            size="small"
            sx={{
              mb: 2.2,
              "& .MuiOutlinedInput-root": { borderRadius: "12px" },
            }}
          />

          <Grid container spacing={2} sx={{ mb: 2.2 }}>
            <Grid item xs={12} md={7}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "text.secondary",
                  mb: 0.7,
                }}
              >
                Email *
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                placeholder="name@pce.edu"
                value={createDlg.email}
                onChange={handleCreateChange}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "text.secondary",
                  mb: 0.7,
                }}
              >
                Phone
              </Typography>
              <TextField
                fullWidth
                name="phone"
                placeholder="9999999999"
                value={createDlg.phone}
                onChange={handleCreateChange}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                }}
              />
            </Grid>
          </Grid>

          {/* Department + Course */}
          <Grid container spacing={2} sx={{ mb: 2.2 }}>
            <Grid item xs={12} md={7}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "text.secondary",
                  mb: 0.7,
                }}
              >
                Department *
              </Typography>
              <TextField
                fullWidth
                select
                name="department"
                value={createDlg.department}
                onChange={handleCreateChange}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                }}
              >
                {DEPARTMENTS.map((d) => (
                  <MenuItem key={d} value={d} sx={{ fontSize: "0.9rem" }}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "text.secondary",
                  mb: 0.7,
                }}
              >
                Course *
              </Typography>

              <FormControl fullWidth size="small">
                <Select
                  name="course"
                  value={createDlg.course}
                  onChange={handleCreateChange}
                  displayEmpty
                  disabled={!createDlg.department}
                  sx={{ borderRadius: "12px" }}
                >
                  <MenuItem value="">
                    <Typography
                      sx={{ color: "text.disabled", fontSize: "0.9rem" }}
                    >
                      Select course
                    </Typography>
                  </MenuItem>

                  {COURSE_OPTIONS.map((c) => {
                    const disabled =
                      !createDlg.department ||
                      !allowedCoursesForSelectedDept.includes(c);
                    return (
                      <MenuItem
                        key={c}
                        value={c}
                        disabled={disabled}
                        sx={{ fontSize: "0.9rem" }}
                      >
                        {c}
                        {createDlg.department &&
                        !allowedCoursesForSelectedDept.includes(c)
                          ? " (Not available)"
                          : ""}
                      </MenuItem>
                    );
                  })}
                </Select>

                <FormHelperText sx={{ ml: 0, mt: 0.8 }}>
                  {createDlg.department
                    ? `Available: ${allowedCoursesForSelectedDept.join(", ")}`
                    : "Choose department first"}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

          {/* Designation */}
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "text.secondary",
              mb: 0.7,
            }}
          >
            Designation
          </Typography>
          <TextField
            fullWidth
            select
            name="designation"
            value={createDlg.designation}
            onChange={handleCreateChange}
            size="small"
            sx={{
              mb: 2.2,
              "& .MuiOutlinedInput-root": { borderRadius: "12px" },
            }}
          >
            <MenuItem
              value=""
              sx={{ color: "text.disabled", fontSize: "0.9rem" }}
            >
              Select designation
            </MenuItem>
            {DESIGNATIONS.map((d) => (
              <MenuItem key={d} value={d} sx={{ fontSize: "0.9rem" }}>
                {d}
              </MenuItem>
            ))}
          </TextField>

          {/* Role selector */}
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "text.secondary",
              mb: 0.9,
            }}
          >
            Role *
          </Typography>
          <ToggleButtonGroup
            value={createDlg.role}
            exclusive
            onChange={(e, v) => v && setCreateDlg((d) => ({ ...d, role: v }))}
            sx={{
              mb: 2.2,
              bgcolor: "background.default",
              p: 0.5,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: "10px",
                px: 2,
                fontWeight: 800,
                textTransform: "none",
              },
              "& .Mui-selected": {
                bgcolor: "#ffffff !important",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              },
            }}
          >
            <ToggleButton value="faculty">Faculty</ToggleButton>
            <ToggleButton value="hod">HOD</ToggleButton>
          </ToggleButtonGroup>

          {/* Password */}
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "text.secondary",
              mb: 0.7,
            }}
          >
            Temporary password *
          </Typography>
          <TextField
            fullWidth
            name="password"
            type="password"
            placeholder="Set a temporary password"
            value={createDlg.password}
            onChange={handleCreateChange}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <Typography
            sx={{ mt: 1, fontSize: "0.75rem", color: "text.disabled" }}
          >
            Tip: share this password with the staff member and ask them to
            change it later.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.2, bgcolor: "background.paper" }}>
          <Button onClick={closeCreate} sx={{ borderRadius: "12px", px: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitCreate}
            disabled={creating}
            sx={{
              borderRadius: "12px",
              px: 2.5,
              fontWeight: 900,
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              boxShadow: "none",
            }}
          >
            {creating ? "Creating..." : "Create Faculty"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Preview & Results Dialog */}
      <Dialog
        open={csvDialog.open}
        onClose={closeCsvDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px" },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {csvDialog.results ? "Import Results" : "Preview CSV Data"}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {csvDialog.results ? (
            // Results View
            <Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  mb: 3,
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: "8px",
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Total Rows
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {csvDialog.results.summary.total}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Created
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#059669" }}
                  >
                    {csvDialog.results.summary.created}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Failed
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#dc2626" }}
                  >
                    {csvDialog.results.summary.failed}
                  </Typography>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "background.default" }}>
                      <TableCell>Status</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvDialog.results.results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {result.status === "success" ? (
                            <CheckCircle
                              sx={{
                                color: "#059669",
                                fontSize: 20,
                              }}
                            />
                          ) : (
                            <ErrorOutline
                              sx={{
                                color: "#dc2626",
                                fontSize: 20,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {result.name}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.85rem" }}
                          >
                            {result.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {result.status === "success" ? (
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  color: "text.secondary",
                                }}
                              >
                                Role: {result.role} | {result.designation}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  mt: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: "monospace",
                                    color: "#7c3aed",
                                    fontWeight: 600,
                                    p: 0.5,
                                    bgcolor: "#f3f0ff",
                                    borderRadius: "4px",
                                    userSelect: "all",
                                  }}
                                >
                                  {result.password}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => copyPassword(result.password)}
                                  sx={{ p: 0.3 }}
                                >
                                  <ContentCopy
                                    sx={{
                                      fontSize: 14,
                                      color:
                                        copied === result.password
                                          ? "#059669"
                                          : "text.secondary",
                                    }}
                                  />
                                </IconButton>
                              </Box>
                            </Box>
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{ color: "#dc2626" }}
                            >
                              {result.reason}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            // Preview View
            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 2, color: "text.secondary" }}
              >
                Preview (showing first {csvDialog.preview.length} rows):
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "background.default" }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Designation</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Program</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvDialog.preview.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>
                          {row.email}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>
                          {row.department}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>
                          {row.designation}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.role}
                            size="small"
                            color={row.role === "hod" ? "error" : "default"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>
                          {row.program || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        {/* ✅ UPDATED DIALOG ACTIONS WITH DOWNLOAD BUTTON */}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeCsvDialog}>
            {csvDialog.results ? "Close" : "Cancel"}
          </Button>

          {/* Download Passwords Button - Only show after successful import */}
          {csvDialog.results && csvDialog.results.summary.created > 0 && (
            <Button
              variant="contained"
              startIcon={<CloudDownload />}
              onClick={handleDownloadPasswords}
              disabled={csvDialog.loading}
              sx={{
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
                boxShadow: "0 2px 4px rgba(16,185,129,0.2)",
              }}
            >
              {csvDialog.loading ? "Downloading..." : "Download Passwords"}
            </Button>
          )}

          {/* Import Button - Only show in preview */}
          {!csvDialog.results && (
            <Button
              variant="contained"
              onClick={handleCsvImport}
              disabled={csvDialog.loading}
              sx={{
                bgcolor: "#7c3aed",
                "&:hover": { bgcolor: "#6d28d9" },
              }}
            >
              {csvDialog.loading && (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              )}
              Import
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyDirectoryPage;
