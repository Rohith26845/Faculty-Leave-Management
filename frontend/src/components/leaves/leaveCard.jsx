import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Button,
  TextField,
  Divider,
} from "@mui/material";
import {
  MoreHoriz,
  CheckCircle,
  Cancel,
  EventNote,
  Person,
  CalendarToday,
  AccessTime,
  AutoAwesome,
  Info,
  AttachFile,
} from "@mui/icons-material";
import { useAuth } from "../../context/authContext";
import API from "../../api/axiosInstance";

const leaveTypeColors = {
  casual: { color: "#6366f1", bg: "#eef2ff" },
  medical: { color: "#ef4444", bg: "#fee2e2" },
  earned: { color: "#10b981", bg: "#d1fae5" },
  compensatory: { color: "#0ea5e9", bg: "#e0f2fe" },
  onDuty: { color: "#f59e0b", bg: "#fef3c7" },
  special: { color: "#64748b", bg: "#f1f5f9" },
  leaveWithoutPay: { color: "#991b1b", bg: "#fee2e2" },
  maternity: { color: "#8b5cf6", bg: "#ede9fe" },
};

const statusStyles = {
  pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  hod_approved: { bg: "#dbeafe", color: "#1e40af", label: "HOD Approved" },
  approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
  cancelled: { bg: "#f1f5f9", color: "#475569", label: "Cancelled" },
};

const formatRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  )}`;
};

const LeaveCard = ({ leave, onUpdate }) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isApprover = user?.role === "admin" || user?.role === "hod";
  const isAdmin = user?.role === "admin";
  const isHod = user?.role === "hod";

  const lType = leaveTypeColors[leave.leaveType] || {
    color: "#e2e8f0",
    bg: "#f8fafc",
  };
  const sStyle = statusStyles[leave.status] || {
    bg: "#f1f5f9",
    color: "#475569",
    label: leave.status,
  };

  const canShowMenu =
    leave.status === "pending" || leave.status === "hod_approved";

  const canHodApprove = isHod && leave.status === "pending";
  const canFinalApprove =
    isAdmin && (leave.status === "pending" || leave.status === "hod_approved");
  const canReject =
    isApprover &&
    (leave.status === "pending" || leave.status === "hod_approved");
  const canCancel = !isApprover && leave.status === "pending";

  const handleHodApprove = async () => {
    setLoading(true);
    try {
      await API.put(`/leaves/${leave._id}/hod-approve`);
      onUpdate?.();
    } finally {
      setLoading(false);
      setAnchorEl(null);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await API.put(`/leaves/${leave._id}/approve`);
      onUpdate?.();
    } finally {
      setLoading(false);
      setAnchorEl(null);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await API.put(`/leaves/${leave._id}/reject`, {
        rejectionReason: rejectReason,
      });
      onUpdate?.();
      setRejectDialog(false);
      setRejectReason("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await API.put(`/leaves/${leave._id}/cancel`);
      onUpdate?.();
    } finally {
      setLoading(false);
      setAnchorEl(null);
    }
  };

  const attachmentUrl = leave?.mlCertificateAttachment || null;

  return (
    <>
      <Card
        sx={{
          mb: 1.5,
          transition: "all 0.15s",
          "&:hover": {
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            transform: "translateY(-1px)",
          },
          borderLeft: `3px solid ${lType.color}`,
        }}
      >
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: lType.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <EventNote sx={{ color: lType.color, fontSize: 20 }} />
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      textTransform: "capitalize",
                      color: "#0f172a",
                    }}
                  >
                    {leave.leaveType} Leave
                    {leave.dayType === "HALF" ? " (Half Day)" : ""}
                  </Typography>

                  {leave.isUrgent && (
                    <Chip
                      label="Urgent"
                      size="small"
                      sx={{
                        bgcolor: "#fee2e2",
                        color: "#991b1b",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 18,
                      }}
                    />
                  )}

                  {leave.treatAsLWP && (
                    <Tooltip title="Notice < 4 working days (policy). May be processed as LWP.">
                      <Chip
                        icon={<Info sx={{ fontSize: "11px !important" }} />}
                        label="Treat as LWP"
                        size="small"
                        sx={{
                          bgcolor: "#fee2e2",
                          color: "#991b1b",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          height: 18,
                          "& .MuiChip-icon": { color: "#991b1b" },
                        }}
                      />
                    </Tooltip>
                  )}

                  {Number(leave.aiPredictionScore || 0) > 60 && (
                    <Tooltip title={`AI Risk: ${leave.aiPredictionScore}%`}>
                      <Chip
                        icon={
                          <AutoAwesome sx={{ fontSize: "11px !important" }} />
                        }
                        label="AI Alert"
                        size="small"
                        sx={{
                          bgcolor: "#fef3c7",
                          color: "#92400e",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          height: 18,
                          "& .MuiChip-icon": { color: "#92400e" },
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>

                {isApprover && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.2,
                    }}
                  >
                    <Person sx={{ fontSize: 13, color: "#94a3b8" }} />
                    <Typography variant="caption" color="text.secondary">
                      {leave.faculty?.name} · {leave.faculty?.department}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={sStyle.label}
                size="small"
                sx={{
                  bgcolor: sStyle.bg,
                  color: sStyle.color,
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />

              {canShowMenu && (
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    color: "#94a3b8",
                    bgcolor: "#f8fafc",
                    width: 28,
                    height: 28,
                    "&:hover": { bgcolor: "#f1f5f9" },
                  }}
                >
                  <MoreHoriz fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Meta */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <CalendarToday sx={{ fontSize: 13, color: "#94a3b8" }} />
              <Typography variant="caption" color="text.secondary">
                {formatRange(leave.startDate, leave.endDate)}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <AccessTime sx={{ fontSize: 13, color: "#94a3b8" }} />
              <Typography variant="caption" color="text.secondary">
                {leave.dayType === "HALF"
                  ? "0.5 day"
                  : `${leave.totalDays} calendar day(s) · ${leave.workingDays} working day(s)`}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.82rem", lineHeight: 1.6 }}
          >
            {leave.reason}
          </Typography>

          {/* Substitute info */}
          {(leave.substituteAssigned || leave.substituteRequested) && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.2,
                bgcolor: "#eef2ff",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                border: "1px solid #c7d2fe",
              }}
            >
              <AutoAwesome sx={{ fontSize: 14, color: "#6366f1" }} />
              <Typography
                variant="caption"
                sx={{ color: "#4338ca", fontWeight: 500 }}
              >
                Substitute:{" "}
                <strong>
                  {leave.substituteAssigned?.name || leave.substituteRequested}
                </strong>
                {leave.substituteAssigned?.department
                  ? ` (${leave.substituteAssigned.department})`
                  : ""}
              </Typography>
            </Box>
          )}

          {/* ML Attachment */}
          {leave.leaveType === "medical" && attachmentUrl && (
            <Box
              sx={{ mt: 1.2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <AttachFile sx={{ fontSize: 16, color: "#ef4444" }} />
              <Typography
                variant="caption"
                sx={{ color: "#991b1b", fontWeight: 600 }}
              >
                Medical certificate:
              </Typography>
              <Button
                size="small"
                variant="text"
                component="a"
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                sx={{
                  textTransform: "none",
                  p: 0,
                  minWidth: "auto",
                  fontSize: "0.78rem",
                }}
              >
                View attachment
              </Button>
            </Box>
          )}

          {leave.status === "rejected" && leave.rejectionReason && (
            <Box
              sx={{
                mt: 1.2,
                p: 1.2,
                bgcolor: "#fee2e2",
                borderRadius: 2,
                border: "1px solid #fca5a5",
              }}
            >
              <Typography variant="caption" sx={{ color: "#991b1b" }}>
                Reason: {leave.rejectionReason}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: "1px solid #f1f5f9",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            minWidth: 170,
          },
        }}
      >
        {canHodApprove && (
          <MenuItem
            onClick={handleHodApprove}
            disabled={loading}
            sx={{ py: 1, fontSize: "0.85rem" }}
          >
            <ListItemIcon>
              <CheckCircle sx={{ color: "#1e40af", fontSize: 18 }} />
            </ListItemIcon>
            HOD Approve
          </MenuItem>
        )}

        {canFinalApprove && (
          <MenuItem
            onClick={handleApprove}
            disabled={loading}
            sx={{ py: 1, fontSize: "0.85rem" }}
          >
            <ListItemIcon>
              <CheckCircle sx={{ color: "#10b981", fontSize: 18 }} />
            </ListItemIcon>
            Final Approve
          </MenuItem>
        )}

        {canReject && (
          <MenuItem
            onClick={() => {
              setRejectDialog(true);
              setAnchorEl(null);
            }}
            sx={{ py: 1, fontSize: "0.85rem" }}
          >
            <ListItemIcon>
              <Cancel sx={{ color: "#ef4444", fontSize: 18 }} />
            </ListItemIcon>
            Reject
          </MenuItem>
        )}

        {canCancel && (
          <MenuItem
            onClick={handleCancel}
            disabled={loading}
            sx={{ py: 1, fontSize: "0.85rem" }}
          >
            <ListItemIcon>
              <Cancel sx={{ color: "#ef4444", fontSize: 18 }} />
            </ListItemIcon>
            Cancel Request
          </MenuItem>
        )}
      </Menu>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog}
        onClose={() => setRejectDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Leave Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Divider sx={{ mt: 2 }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Policy note: leave approvals depend on substitute availability,
            syllabus completion and prior leave record.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setRejectDialog(false)}
            sx={{ color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={loading || !rejectReason.trim()}
            sx={{ borderRadius: 2 }}
          >
            Reject Leave
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeaveCard;
