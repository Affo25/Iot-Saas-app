import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchEnhancedDeviceLogs = createAsyncThunk(
  'deviceLog/fetchEnhancedDeviceLogs',
  async () => {
    const response = await axios.get('/api/Dashboard/Devicelog/enhanced');
    return response.data.deviceLogs;
  }
);

export const fetchDeviceLogsBySerialCode = createAsyncThunk(
  'deviceLog/fetchDeviceLogsBySerialCode',
  async (serialCode) => {
    console.log("serialCode in slice file",serialCode);
    const response = await axios.get(`/api/Dashboard/Devicelog/filter?serialCode=${serialCode}`);
    console.log("response from api",JSON.stringify(response.data.deviceLogs));
    return response.data.deviceLogs;
  }
);

export const addDeviceLog = createAsyncThunk(
  'deviceLog/addDeviceLog',
  async (dataToSend) => {
    const response = await axios.post('/api/Dashboard/Devicelog', dataToSend);
    return response.data;
  }
);

export const updateDeviceLog = createAsyncThunk(
  'deviceLog/updateDeviceLog',
  async (finalData) => {
    const response = await axios.put('/api/Dashboard/Devicelog', finalData);
    return response.data;
  }
);

export const deleteDeviceLog = createAsyncThunk(
  'deviceLog/deleteDeviceLog',
  async (deviceLogId) => {
    const response = await axios.delete(`/api/Dashboard/Devicelog?_id=${deviceLogId}`);
    return response.data;
  }
);

export const deleteMultipleDeviceLogs = createAsyncThunk(
  'deviceLog/deleteMultipleDeviceLogs',
  async (deviceLogIds) => {
    const response = await axios.delete('/api/Dashboard/bulk-delete', {
      data: { 
        table: 'DeviceLogs',
        ids: deviceLogIds 
      }
    });
    return response.data;
  }
);

const deviceLogSlice = createSlice({
  name: 'deviceLog',
  initialState: {
    loading: false,
    error: null,
    success: false,
    deviceLogs: [],
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSuccess: (state, action) => {
      state.success = action.payload;
    },
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.deviceLogs = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch enhanced device logs
      .addCase(fetchEnhancedDeviceLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnhancedDeviceLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceLogs = action.payload;
      })
      .addCase(fetchEnhancedDeviceLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch device logs by serial code
      .addCase(fetchDeviceLogsBySerialCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceLogsBySerialCode.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceLogs = action.payload;
      })
      .addCase(fetchDeviceLogsBySerialCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add device log
      .addCase(addDeviceLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDeviceLog.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addDeviceLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update device log
      .addCase(updateDeviceLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDeviceLog.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateDeviceLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete device log
      .addCase(deleteDeviceLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDeviceLog.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteDeviceLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete multiple device logs
      .addCase(deleteMultipleDeviceLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleDeviceLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteMultipleDeviceLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setLoading, setError, setSuccess, resetState } = deviceLogSlice.actions;
export default deviceLogSlice.reducer; 