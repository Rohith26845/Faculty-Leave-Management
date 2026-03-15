import API from "../api/axiosInstance";

export const timetableService = {
  // Get initial data for timetable creation
  async getInitData(department, semester) {
    try {
      console.log("📡 Fetching init data for:", department, semester);

      const response = await API.get("/timetable/init-data", {
        params: {
          department,
          semester: parseInt(semester), // Convert to number
        },
      });

      console.log("✅ Init data received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching init data:", error);
      throw error;
    }
  },

  // Create new timetable
  async createTimetable(payload) {
    try {
      console.log("📊 Creating timetable:", payload.name);
      const response = await API.post("/timetable/create", payload);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating timetable:", error);
      throw error;
    }
  },

  // Get timetable details
  async getTimetable(id) {
    try {
      const response = await API.get(`/timetable/${id}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching timetable:", error);
      throw error;
    }
  },

  // Update single cell
  async updateCell(timetableId, cellKey, subject, faculty, room) {
    try {
      const response = await API.put(`/timetable/${timetableId}/update-cell`, {
        cellKey,
        subject,
        faculty,
        room,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error updating cell:", error);
      throw error;
    }
  },

  // Get department timetables
  async getDepartmentTimetables(department) {
    try {
      const response = await API.get(`/timetable/department/${department}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching timetables:", error);
      throw error;
    }
  },

  // Publish timetable
  async publishTimetable(id) {
    try {
      const response = await API.post(`/timetable/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error("❌ Error publishing timetable:", error);
      throw error;
    }
  },
};
