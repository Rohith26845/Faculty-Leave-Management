import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  School,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f0f2f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: 1100,
          minHeight: 600,
          bgcolor: "white",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 8px 48px rgba(0,0,0,0.10)",
        }}
      >
        {/* ── Left panel — form ── */}
        <Box
          sx={{
            flex: "0 0 45%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            px: { xs: 4, md: 6 },
            py: 5,
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                background: "linear-gradient(135deg, #1565c0, #1976d2)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <School sx={{ color: "white", fontSize: 18 }} />
            </Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.25rem",
                color: "#0f172a",
                letterSpacing: "-0.3px",
              }}
            >
              LeaveAI
            </Typography>
          </Box>

          {/* Form body */}
          <Box sx={{ width: "100%", maxWidth: 380 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}
            >
              Log in to your account
            </Typography>
            <Typography sx={{ fontSize: "0.88rem", color: "#64748b", mb: 3.5 }}>
              Please enter your details
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2.5, borderRadius: "10px", fontSize: "0.82rem" }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* Email */}
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#374151",
                  mb: 0.7,
                }}
              >
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ fontSize: 17, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.88rem",
                    "& fieldset": { borderColor: "#e2e8f0" },
                    "&:hover fieldset": { borderColor: "#94a3b8" },
                    "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                  },
                }}
              />

              {/* Password */}
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#374151",
                  mb: 0.7,
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: 17, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPwd(!showPwd)}
                        edge="end"
                      >
                        {showPwd ? (
                          <VisibilityOff
                            sx={{ fontSize: 17, color: "#94a3b8" }}
                          />
                        ) : (
                          <Visibility sx={{ fontSize: 17, color: "#94a3b8" }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.88rem",
                    "& fieldset": { borderColor: "#e2e8f0" },
                    "&:hover fieldset": { borderColor: "#94a3b8" },
                    "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                  },
                }}
              />

              {/* Remember + Forgot */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      sx={{
                        color: "#cbd5e1",
                        "&.Mui-checked": { color: "#1976d2" },
                        p: 0.5,
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.82rem", color: "#374151" }}>
                      Remember for 30 days
                    </Typography>
                  }
                />
                <Typography
                  component={Link}
                  to="/forgot-password"
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#1976d2",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Forgot password
                </Typography>
              </Box>

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: "#1565c0",
                  "&:hover": { bgcolor: "#0d47a1" },
                  borderRadius: "10px",
                  py: 1.3,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  boxShadow: "0 2px 8px rgba(21,101,192,0.25)",
                  mb: 2.5,
                  textTransform: "none",
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "Log in"
                )}
              </Button>

              {/* Divider */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}
              >
                <Divider sx={{ flex: 1 }} />
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: "#94a3b8",
                    fontWeight: 500,
                  }}
                >
                  OR
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {/* Sign up link */}
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/register"
                sx={{
                  borderRadius: "10px",
                  py: 1.2,
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  borderColor: "#e2e8f0",
                  color: "#374151",
                  textTransform: "none",
                  "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                }}
              >
                Create an account
              </Button>
            </Box>
          </Box>

          {/* Footer */}
          <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            By creating an account, you agree to our{" "}
            <Typography
              component="span"
              sx={{
                color: "#1976d2",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Terms of Use
            </Typography>
          </Typography>
        </Box>

        {/* ── Right panel — illustration ── */}
        <Box
          sx={{
            flex: 1,
            background:
              "linear-gradient(135deg, #1565c0 0%, #1976d2 40%, #1e88e5 100%)",
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: 5,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background blobs */}
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.10), transparent)",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 80,
              left: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.07), transparent)",
              pointerEvents: "none",
            }}
          />

          {/* Top: branding */}
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 4 }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <School sx={{ color: "white", fontSize: 18 }} />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: "white",
                    fontWeight: 800,
                    fontSize: "1rem",
                    lineHeight: 1,
                  }}
                >
                  Pillai College
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  of Engineering
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                color: "white",
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                lineHeight: 1.25,
                maxWidth: 320,
              }}
            >
              Empowering smarter leave management
            </Typography>
          </Box>

          {/* Centre: mock dashboard card */}
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              transform: "rotate(3deg) translateY(-10px)",
              mx: 2,
            }}
          >
            {/* Mock header */}
            <Box
              sx={{
                px: 2,
                py: 1.2,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "5px",
                    bgcolor: "rgba(255,255,255,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <School sx={{ color: "white", fontSize: 11 }} />
                </Box>
                <Typography
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}
                >
                  LeaveAI Dashboard
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <Box
                    key={c}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: c,
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Mock stats row */}
            <Box
              sx={{
                display: "flex",
                gap: 0,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              {[
                {
                  label: "Pending",
                  value: "3",
                  color: "#f59e0b",
                  bg: "#fffbeb",
                },
                {
                  label: "Approved",
                  value: "12",
                  color: "#10b981",
                  bg: "#ecfdf5",
                },
                {
                  label: "Balance",
                  value: "8d",
                  color: "#7c3aed",
                  bg: "#f5f3ff",
                },
              ].map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 1.2,
                    borderRight: i < 2 ? "1px solid #f1f5f9" : "none",
                    bgcolor: s.bg,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: "1.1rem",
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.6rem", color: "#94a3b8", mt: 0.2 }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Mock leave rows */}
            <Box sx={{ px: 2, py: 1.2 }}>
              {[
                {
                  name: "Priya Sharma",
                  type: "Casual",
                  status: "Approved",
                  statusColor: "#10b981",
                  statusBg: "#dcfce7",
                },
                {
                  name: "Rahul Mehta",
                  type: "Medical",
                  status: "Pending",
                  statusColor: "#f59e0b",
                  statusBg: "#fef9c3",
                },
                {
                  name: "Anjali Nair",
                  type: "Earned",
                  status: "HOD Apprvd",
                  statusColor: "#1e40af",
                  statusBg: "#dbeafe",
                },
              ].map((row, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.7,
                    borderBottom: i < 2 ? "1px solid #f8fafc" : "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "6px",
                        bgcolor: "#f5f3ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#7c3aed",
                      }}
                    >
                      {row.name.charAt(0)}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "#0f172a",
                          lineHeight: 1.2,
                        }}
                      >
                        {row.name}
                      </Typography>
                      <Typography
                        sx={{ fontSize: "0.58rem", color: "#94a3b8" }}
                      >
                        {row.type} Leave
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 0.8,
                      py: 0.2,
                      borderRadius: "5px",
                      bgcolor: row.statusBg,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        color: row.statusColor,
                      }}
                    >
                      {row.status}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Mock footer bar */}
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: "#f8fafc",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontSize: "0.6rem", color: "#94a3b8" }}>
                faculty.leaveai.edu
              </Typography>
              <Box
                sx={{
                  px: 1,
                  py: 0.3,
                  borderRadius: "5px",
                  bgcolor: "#f5f3ff",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    color: "#7c3aed",
                  }}
                >
                  AI Powered ✦
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Bottom tagline */}
          <Typography
            sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem" }}
          >
            Pillai College of Engineering · New Panvel
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
