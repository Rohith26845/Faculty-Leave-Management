import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { TrendingUp, EventNote } from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import API from "../api/axiosInstance";

const LeaveAnalytics = () => {
  const [timeRange, setTimeRange] = useState("weekly"); // daily, weekly, monthly
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    absoluteIncrease: 0,
    percentageIncrease: 0,
  });

  // Fetch and process leave data
  useEffect(() => {
    fetchLeaveData();
  }, [timeRange]);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/leaves");
      const leaves = Array.isArray(data) ? data : [];

      // Filter approved leaves only
      const approvedLeaves = leaves.filter((l) => l.status === "approved");

      // Process data based on time range
      const processedData = processLeaveData(approvedLeaves, timeRange);
      setChartData(processedData.data);
      setStats(processedData.stats);
    } catch (error) {
      console.error("Failed to fetch leave data:", error);
      setChartData([]);
      setStats({ totalLeaves: 0, absoluteIncrease: 0, percentageIncrease: 0 });
    } finally {
      setLoading(false);
    }
  };

  const processLeaveData = (leaves, range) => {
    const today = new Date();
    let groupedData = {};
    let dateLabels = [];

    if (range === "daily") {
      // last 7 days (oldest -> newest)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          date.getDay()
        ];
        groupedData[dateStr] = { label: dayName, count: 0, date: dateStr };
        dateLabels.push(dateStr);
      }

      leaves.forEach((leave) => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        let currentDate = new Date(startDate);
        while (currentDate <= endDate && currentDate <= today) {
          const dateStr = currentDate.toISOString().split("T")[0];
          if (groupedData[dateStr]) groupedData[dateStr].count += 1;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    } else if (range === "weekly") {
      // last 4 weeks, oldest W1 ... current W4
      for (let i = 3; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Sunday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekLabel = `W${4 - i}`;
        const weekKey = weekStart.toISOString().split("T")[0];
        groupedData[weekKey] = {
          label: weekLabel,
          count: 0,
          weekStart,
          weekEnd,
        };
        dateLabels.push(weekKey);
      }

      // Count approved leaves overlapping each week
      leaves.forEach((leave) => {
        const ls = new Date(leave.startDate);
        const le = new Date(leave.endDate);
        Object.values(groupedData).forEach((w) => {
          if (le < w.weekStart || ls > w.weekEnd) return;
          w.count += 1;
        });
      });
    } else if (range === "monthly") {
      const months = [
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

      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = months[date.getMonth()];
        groupedData[monthKey] = {
          label: monthLabel,
          count: 0,
          month: date.getMonth(),
          year: date.getFullYear(),
        };
        dateLabels.push(monthKey);
      }

      leaves.forEach((leave) => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);

        let currentDate = new Date(leaveStart);
        while (currentDate <= leaveEnd) {
          const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
          if (groupedData[monthKey]) groupedData[monthKey].count += 1;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }

    const chartDataArray = dateLabels.map((key) => groupedData[key]);
    const values = chartDataArray.map((d) => d.count);
    const totalLeaves = values.reduce((a, b) => a + b, 0);

    // Stats:
    // For weekly: current (last) vs previous (second-last)
    // For others: second half vs first half
    let absoluteIncrease = 0;
    let percentageIncrease = 0;

    if (range === "weekly" && values.length >= 2) {
      const prev = values[values.length - 2];
      const curr = values[values.length - 1];
      absoluteIncrease = curr - prev;
      percentageIncrease =
        prev === 0
          ? curr > 0
            ? 100
            : 0
          : Math.round((absoluteIncrease / prev) * 100);
    } else {
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstHalfSum = firstHalf.reduce((a, b) => a + b, 0);
      const secondHalfSum = secondHalf.reduce((a, b) => a + b, 0);
      absoluteIncrease = secondHalfSum - firstHalfSum;
      percentageIncrease =
        firstHalfSum === 0
          ? secondHalfSum > 0
            ? 100
            : 0
          : Math.round((absoluteIncrease / firstHalfSum) * 100);
    }

    return {
      data: chartDataArray,
      stats: { totalLeaves, absoluteIncrease, percentageIncrease },
    };
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: "12px", boxShadow: 2 }}>
        <CardContent sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#7c3aed" }} />
        </CardContent>
      </Card>
    );
  }

  const peakValue = Math.max(...chartData.map((d) => d.count), 0);
  const peakIndex = chartData.findIndex((d) => d.count === peakValue);

  return (
    <Card sx={{ borderRadius: "12px", boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TrendingUp sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "text.primary",
                }}
              >
                Leave Analytics
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                Approved leaves trend
              </Typography>
            </Box>
          </Box>

          {/* Time Range Selector */}
          <FormControl
            size="small"
            sx={{
              minWidth: 120,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "0.9rem",
              },
            }}
          >
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ fontWeight: 600 }}
            >
              <MenuItem value="daily">Daily (7 Days)</MenuItem>
              <MenuItem value="weekly">Weekly (4 Weeks)</MenuItem>
              <MenuItem value="monthly">Monthly (12 Months)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Stats Section */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            p: 2,
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              Total Leaves
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.6rem",
                color: "#7c3aed",
                mt: 0.3,
              }}
            >
              {stats.totalLeaves}
            </Typography>
          </Box>
          <Box sx={{ borderLeft: "1px solid #e5e7eb", pl: 2 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              {stats.percentageIncrease >= 0 ? "↑ Increase" : "↓ Decrease"}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.6rem",
                color: stats.percentageIncrease >= 0 ? "#10b981" : "#ef4444",
                mt: 0.3,
              }}
            >
              {stats.percentageIncrease >= 0 ? "+" : ""}
              {stats.absoluteIncrease} (
              {stats.percentageIncrease >= 0 ? "+" : ""}
              {stats.percentageIncrease}%)
            </Typography>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: 300, mb: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="0"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [
                  `${value} ${value === 1 ? "leave" : "leaves"}`,
                  "Count",
                ]}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              />
              <Bar
                dataKey="count"
                fill="#7c3aed"
                radius={[8, 8, 0, 0]}
                name="Leaves"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === peakIndex && peakValue > 0
                        ? "#7c3aed"
                        : "#e0e7ff"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Peak Value Label */}
        {peakValue > 0 && (
          <Box
            sx={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <EventNote sx={{ fontSize: 16 }} />
            Peak: {`${peakValue} ${peakValue === 1 ? "leave" : "leaves"}`} on{" "}
            <strong>{chartData[peakIndex]?.label}</strong>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveAnalytics;
