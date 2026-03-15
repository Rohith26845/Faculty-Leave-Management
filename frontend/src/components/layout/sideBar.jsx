import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import {
  GridView,
  EventNote,
  AssignmentTurnedIn,
  AccountBalance,
  SupervisorAccount,
  Person,
  HelpOutline,
  Settings,
  Logout,
  School,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { getAvatarUrl } from "../../api/axiosInstance";
import { Description, Dashboard, People } from "@mui/icons-material";
const DRAWER_WIDTH = 210;

const navSections = [
  {
    label: "General",
    items: [
      {
        label: "Dashboard",
        icon: <GridView fontSize="small" />,
        path: "/",
        roles: ["faculty", "admin", "hod"],
      },

      /* ✅ NEW: Faculty Directory (Admin + HOD only) */
      {
        label: "Faculty Directory",
        icon: <SupervisorAccount fontSize="small" />,
        path: "/faculty-directory",
        roles: ["admin", "hod"],
      },

      {
        label: "Syllabus Management",
        icon: <Description />, // ✅ Use BookOpen or FileText icon
        path: "/syllabus-management",
        roles: ["hod"], // ✅ CORRECT: ["hod"], // ✅ Only show for HOD
      },
      {
        label: "Apply Leave",
        icon: <EventNote fontSize="small" />,
        path: "/apply-leave",
        roles: ["faculty"],
      },
      {
        label: "Manage Leaves",
        icon: <AssignmentTurnedIn fontSize="small" />,
        path: "/manage-leaves",
        roles: ["faculty", "admin", "hod"],
      },
      {
        label: "Leave Balance",
        icon: <AccountBalance fontSize="small" />,
        path: "/leave-balance",
        roles: ["faculty", "admin", "hod"],
      },
      {
        label: "Substitutes",
        icon: <SupervisorAccount fontSize="small" />,
        path: "/substitutes",
        roles: ["faculty", "admin", "hod"],
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        label: "Profile",
        icon: <Person fontSize="small" />,
        path: "/profile",
        roles: ["faculty", "admin", "hod"],
      },
      {
        label: "Help",
        icon: <HelpOutline fontSize="small" />,
        path: "#",
        roles: ["faculty", "admin", "hod"],
      },
    ],
  },
];

const roleColor = { admin: "#ef4444", hod: "#f59e0b", faculty: "#7c3aed" };

const SideBar = ({ mobileOpen, setMobileOpen, darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const avatarUrl = getAvatarUrl(user?.avatar);

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: darkMode ? "#18181b" : "#ffffff",
        borderRight: "1px solid",
        borderColor: darkMode ? "#27272a" : "#e2e8f0",
      }}
    >
      {/* Logo */}
      <Box
        sx={{ px: 2.5, py: 2.2, display: "flex", alignItems: "center", gap: 1 }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <School sx={{ color: "white", fontSize: 15 }} />
        </Box>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "1rem",
            color: darkMode ? "#ffffff" : "#0f172a",
            letterSpacing: "-0.3px",
          }}
        >
          LeaveAI
        </Typography>
      </Box>

      {/* User pill */}
      <Box
        sx={{
          mx: 2,
          mb: 1.5,
          p: 1.2,
          bgcolor: darkMode ? "#27272a" : "#f8fafc",
          borderRadius: "8px",
          border: "1px solid",
          borderColor: darkMode ? "#3f3f46" : "#e2e8f0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              width: 30,
              height: 30,
              fontSize: 12,
              fontWeight: 700,
              bgcolor: avatarUrl
                ? "transparent"
                : roleColor[user?.role] || "#7c3aed",
              color: "white",
              borderRadius: "8px",
            }}
          >
            {!avatarUrl && user?.name?.charAt(0)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.8rem",
                color: darkMode ? "#f4f4f5" : "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.67rem",
                color: darkMode ? "#71717a" : "#94a3b8",
                textTransform: "capitalize",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.role}
            </Typography>
          </Box>

          <Chip
            label={
              user?.designation ? user.designation.split(" ")[0] : user?.role
            }
            size="small"
            sx={{
              bgcolor: `${roleColor[user?.role]}18`,
              color: roleColor[user?.role],
              fontWeight: 700,
              fontSize: "0.58rem",
              height: 17,
              flexShrink: 0,
              textTransform: "capitalize",
              borderRadius: "8px",
              maxWidth: 56,
              "& .MuiChip-label": {
                px: 0.8,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: darkMode ? "#27272a" : "#e2e8f0", mb: 1 }} />

      {/* Nav sections */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.5,
          "&::-webkit-scrollbar": { width: 0 },
        }}
      >
        {navSections.map((section) => {
          const visible = section.items.filter((i) =>
            i.roles.includes(user?.role),
          );
          if (!visible.length) return null;

          return (
            <Box key={section.label} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: darkMode ? "#52525b" : "#94a3b8",
                  fontWeight: 700,
                  fontSize: "0.67rem",
                  letterSpacing: "0.07em",
                  px: 1.5,
                  display: "block",
                  mb: 0.5,
                }}
              >
                {section.label}
              </Typography>

              <List disablePadding>
                {visible.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    (item.path !== "/" && pathname.startsWith(item.path));

                  return (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.2 }}>
                      <ListItemButton
                        onClick={() => {
                          if (item.path && item.path !== "#")
                            navigate(item.path);
                          setMobileOpen(false);
                        }}
                        sx={{
                          borderRadius: "8px",
                          py: 0.8,
                          px: 1.5,
                          bgcolor: isActive
                            ? darkMode
                              ? "#27272a"
                              : "#f5f3ff"
                            : "transparent",
                          "&:hover": {
                            bgcolor: darkMode ? "#27272a" : "#f8fafc",
                          },
                          transition: "background 0.15s",
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive
                              ? "#7c3aed"
                              : darkMode
                                ? "#71717a"
                                : "#94a3b8",
                            minWidth: 30,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: "0.845rem",
                            fontWeight: isActive ? 700 : 500,
                            color: isActive
                              ? "#7c3aed"
                              : darkMode
                                ? "#a1a1aa"
                                : "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Bottom actions */}
      <Divider sx={{ borderColor: darkMode ? "#27272a" : "#e2e8f0" }} />
      <Box sx={{ px: 1.5, py: 1 }}>
        <ListItemButton
          sx={{
            borderRadius: "8px",
            py: 0.8,
            px: 1.5,
            mb: 0.2,
            "&:hover": { bgcolor: darkMode ? "#27272a" : "#f8fafc" },
          }}
        >
          <ListItemIcon
            sx={{ color: darkMode ? "#71717a" : "#94a3b8", minWidth: 30 }}
          >
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            primaryTypographyProps={{
              fontSize: "0.845rem",
              fontWeight: 500,
              color: darkMode ? "#a1a1aa" : "#334155",
            }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: "8px",
            py: 0.8,
            px: 1.5,
            "&:hover": { bgcolor: "#fef2f2" },
          }}
        >
          <ListItemIcon sx={{ color: "#ef4444", minWidth: 30 }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: "0.845rem",
              fontWeight: 500,
              color: "#ef4444",
            }}
          />
        </ListItemButton>
      </Box>

      {/* Light / Dark toggle */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid",
            borderColor: darkMode ? "#27272a" : "#e2e8f0",
            bgcolor: darkMode ? "#27272a" : "#f8fafc",
          }}
        >
          {[
            {
              label: "☀ Light",
              active: !darkMode,
              onClick: () => setDarkMode(false),
            },
            {
              label: "🌙 Dark",
              active: darkMode,
              onClick: () => setDarkMode(true),
            },
          ].map((btn) => (
            <Box
              key={btn.label}
              onClick={btn.onClick}
              sx={{
                flex: 1,
                py: 0.65,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: "8px",
                bgcolor: btn.active
                  ? darkMode
                    ? "#3f3f46"
                    : "white"
                  : "transparent",
                boxShadow:
                  btn.active && !darkMode
                    ? "0 1px 2px rgba(0,0,0,0.08)"
                    : "none",
                transition: "all 0.2s",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: btn.active
                    ? darkMode
                      ? "#e4e4e7"
                      : "#334155"
                    : "#94a3b8",
                }}
              >
                {btn.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none" },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default SideBar;
