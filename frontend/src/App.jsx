import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { AuthProvider, useAuth } from "./context/authContext";

import loginPage from "./pages/loginPage";
import dashboardPage from "./pages/dashboardPage";
import applyLeavePage from "./pages/applyLeavePage";
import manageLeavesPage from "./pages/manageLeavesPage";
import leaveBalancePage from "./pages/leaveBalancePage";
import substitutePage from "./pages/substitutePage";
import profilePage from "./pages/profilePage";
import facultyDirectoryPage from "./pages/facultyDirectoryPage";
import syllabusManagementPage from "./pages/syllabusManagementPage"; // ✅ ADD THIS IMPORT

import SideBar from "./components/layout/sideBar";
import NavBar from "./components/layout/navBar";

const getTheme = (dark) =>
  createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      primary: {
        main: "#7c3aed",
        light: "#a78bfa",
        dark: "#5b21b6",
        contrastText: "#fff",
      },
      secondary: { main: "#06b6d4" },
      success: { main: "#10b981", light: "#d1fae5" },
      warning: { main: "#f59e0b", light: "#fef3c7" },
      error: { main: "#ef4444", light: "#fee2e2" },
      background: {
        default: dark ? "#09090b" : "#f8fafc",
        paper: dark ? "#18181b" : "#ffffff",
      },
      text: {
        primary: dark ? "#f4f4f5" : "#0f172a",
        secondary: dark ? "#71717a" : "#64748b",
      },
      divider: dark ? "#27272a" : "#f1f5f9",
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    shadows: [
      "none",
      "0 1px 3px rgba(0,0,0,0.04)",
      "0 2px 8px rgba(0,0,0,0.06)",
      "0 4px 16px rgba(0,0,0,0.08)",
      ...Array(21).fill("0 4px 24px rgba(0,0,0,0.10)"),
    ],
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            borderRadius: 14,
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 8,
            fontSize: "0.85rem",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: "0.72rem", borderRadius: 6 },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              "& fieldset": { borderColor: "#e2e8f0" },
              "&:hover fieldset": { borderColor: "#c4b5fd" },
              "&.Mui-focused fieldset": { borderColor: "#7c3aed" },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            border: "none",
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
          },
        },
      },
    },
  });

const DRAWER_WIDTH = 210;

const ProtectedLayout = ({ children }) => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <ThemeProvider theme={getTheme(darkMode)}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <SideBar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            ml: { md: `${DRAWER_WIDTH}px` },
          }}
        >
          <NavBar setMobileOpen={setMobileOpen} />
          <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: "60px" }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

/* ✅ Role guard component */
const RoleGuard = ({ allow, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const LoginPage = loginPage;
  const DashboardPage = dashboardPage;
  const ApplyLeavePage = applyLeavePage;
  const ManageLeavesPage = manageLeavesPage;
  const LeaveBalancePage = leaveBalancePage;
  const SubstitutePage = substitutePage;
  const ProfilePage = profilePage;
  const FacultyDirectoryPage = facultyDirectoryPage;
  const SyllabusManagementPage = syllabusManagementPage; // ✅ ADD THIS

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/apply-leave"
        element={
          <ProtectedLayout>
            <ApplyLeavePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/manage-leaves"
        element={
          <ProtectedLayout>
            <ManageLeavesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/leave-balance"
        element={
          <ProtectedLayout>
            <LeaveBalancePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/substitutes"
        element={
          <ProtectedLayout>
            <SubstitutePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <ProfilePage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/faculty-directory"
        element={
          <ProtectedLayout>
            <RoleGuard allow={["admin", "hod"]}>
              <FacultyDirectoryPage />
            </RoleGuard>
          </ProtectedLayout>
        }
      />

      {/* ✅ ADD THIS ROUTE FOR SYLLABUS MANAGEMENT */}
      <Route
        path="/syllabus-management"
        element={
          <ProtectedLayout>
            <RoleGuard allow={["hod"]}>
              <SyllabusManagementPage />
            </RoleGuard>
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
