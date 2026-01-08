import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { employeServices } from '../../Services/EmployeServices/EmployeServices';

export const employeDashboard = createAsyncThunk(
  'employe/employeDashboard',
  async (employeData, { rejectWithValue }) => {
    try {
      const response = await employeServices.employeDashboard(employeData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create a slice for employee dashboard data
const employeSlice = createSlice({
  name: 'employe',
  initialState: {
    isLoading: false,
    error: null,
    dashboardData: null,
    // Attendance Stats
    attendanceData: {
      totalPresent: 0,
      totalAbsent: 0,
      totalFirstHalfday: 0,
      totalSecondHalfday: 0,
      totalLeave: 0,
      totalHoliday: 0,
      totalOff: 0,
    },
    // Task Stats
    taskData: {
      totalTask: 0,
      assigned: 0,
      accepted: 0,
      completed: 0,
      stop: 0,
      workInProgress: 0,
      overdueTask: 0,
    },
    // Today's Task Stats
    todayTaskData: {
      totalTask: 0,
      assigned: 0,
      accepted: 0,
      completed: 0,
      stop: 0,
      workInProgress: 0,
      overdueTask: 0,
    },
    // Leave Stats
    assignLeaveData: {
      totalLeaves: 0,
      carryForwardLeaves: 0,
      usedLeaves: 0,
      availableLeaves: 0,
    },
    // Leave Request Stats
    leaveReqData: {
      pendingLeaves: 0,
      approvedLeaves: 0,
      rejectedLeaves: 0,
      cancelledLeaves: 0,
      totalLeaves: 0,
    },
    // Lists
    attendance: [],
    employeBirthday: [],
    assigntasks: [],
    completedtasks: [],
    runningtasks: [],
    visitorData: [],
    holidayData: [],
    eventData: [],
    increementData: [],
    penaltyData: [],
    advanceAmountData: [],
    interviewData: [],
  },
  reducers: {
    // Reset dashboard data
    resetDashboard: (state) => {
      state.dashboardData = null;
      state.error = null;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(employeDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload.data || action.payload;
        state.dashboardData = data;
        state.error = null;

        // Extract all stats and lists from API response
        if (data) {
          // Attendance Stats
          state.attendanceData = data.attendanceData || state.attendanceData;
          
          // Task Stats
          state.taskData = data.taskData || state.taskData;
          
          // Today's Task Stats
          state.todayTaskData = data.todayTaskData || state.todayTaskData;
          
          // Leave Stats
          state.assignLeaveData = data.assignLeaveData || state.assignLeaveData;
          
          // Leave Request Stats
          state.leaveReqData = data.leaveReqData || state.leaveReqData;
          
          // Lists with safe defaults
          state.attendance = Array.isArray(data.attendance) ? data.attendance : [];
          state.employeBirthday = Array.isArray(data.employeBirthday) ? data.employeBirthday : [];
          state.assigntasks = Array.isArray(data.assigntasks) ? data.assigntasks : [];
          state.completedtasks = Array.isArray(data.completedtasks) ? data.completedtasks : [];
          state.runningtasks = Array.isArray(data.runningtasks) ? data.runningtasks : [];
          state.visitorData = Array.isArray(data.visitorData) ? data.visitorData : [];
          state.holidayData = Array.isArray(data.holidayData) ? data.holidayData : [];
          state.eventData = Array.isArray(data.eventData) ? data.eventData : [];
          state.increementData = Array.isArray(data.increementData) ? data.increementData : [];
          state.penaltyData = Array.isArray(data.penaltyData) ? data.penaltyData : [];
          state.advanceAmountData = Array.isArray(data.advanceAmountData) ? data.advanceAmountData : [];
          state.interviewData = Array.isArray(data.interviewData) ? data.interviewData : [];
        }

        console.log('✅ Dashboard Data Stored in Redux:', {
          attendanceData: state.attendanceData,
          taskData: state.taskData,
          assignLeaveData: state.assignLeaveData,
          attendance: state.attendance,
          employeBirthday: state.employeBirthday,
          eventData: state.eventData,
        });
      })
      .addCase(employeDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.dashboardData = null;
      });
  },
});

export const { resetDashboard, clearError } = employeSlice.actions;
export default employeSlice.reducer;
