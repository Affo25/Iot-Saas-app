import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const baseUrl = "/api/Dashboard/Devicelog";
const enhancedBaseUrl = "/api/Dashboard/Devicelog/enhanced";

// Async thunks
export const fetchDeviceLogs = createAsyncThunk(
  'deviceLog/fetchDeviceLogs',
  async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const response = await axios.get(`${baseUrl}?api_key=${apiKey}`);
      console.log('DeviceLogs Response:', response.data); // Add logging
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch device logs');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching device logs:', error);
      
      // Return empty array instead of throwing error to prevent app crash
      if (error.response?.status === 401) {
        console.warn('API key authentication failed, returning empty array');
        return [];
      }
      
      throw error;
    }
  }
);

export const fetchEnhancedDeviceLogs = createAsyncThunk(
  'deviceLog/fetchEnhancedDeviceLogs',
  async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const response = await axios.get(`${enhancedBaseUrl}?api_key=${apiKey}`);
      console.log('Enhanced DeviceLogs Response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch enhanced device logs');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching enhanced device logs:', error);
      
      if (error.response?.status === 401) {
        console.warn('API key authentication failed, returning empty array');
        return [];
      }
      
      throw error;
    }
  }
);

export const addDeviceLog = createAsyncThunk(
  'deviceLog/addDeviceLog',
  async (dataToSend) => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123';
    const response = await axios.post(`${baseUrl}?api_key=${apiKey}`, dataToSend);
    return response.data;
  }
);

export const updateDeviceLog = createAsyncThunk(
  'deviceLog/updateDeviceLog',
  async (finalData) => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123';
    const response = await axios.put(`${baseUrl}?api_key=${apiKey}`, finalData);
    return response.data;
  }
);

export const deleteDeviceLog = createAsyncThunk(
  'deviceLog/deleteDeviceLog',
  async (logId) => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123';
    const response = await axios.delete(`${baseUrl}?_id=${logId}&api_key=${apiKey}`);
    return response.data;
  }
);

export const deleteMultipleDeviceLogs = createAsyncThunk(
  'deviceLog/deleteMultipleDeviceLogs',
  async (logIds) => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123';
    const response = await axios.delete(`/api/Dashboard/bulk-delete?api_key=${apiKey}`, {
      data: { 
        table: 'DeviceLog',
        ids: logIds 
      }
    });
    return response.data;
  }
);

export const fetchDeviceLogsByDeviceCode = createAsyncThunk(
  'deviceLog/fetchDeviceLogsByDeviceCode',
  async (deviceCode) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const response = await axios.get(`/api/Dashboard/Devicelog/filter?device_code=${deviceCode}&api_key=${apiKey}`);
      console.log('Filtered DeviceLogs Response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch filtered device logs');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching filtered device logs:', error);
      
      if (error.response?.status === 401) {
        console.warn('API key authentication failed, returning empty array');
        return [];
      }
      
      throw error;
    }
  }
);

const initialState = {
  deviceLogs: [],
  loading: false,
  error: null,
  success: false,
};

const deviceLogSlice = createSlice({
  name: 'deviceLog',
  initialState,
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
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch device logs
      .addCase(fetchDeviceLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceLogs = action.payload;
      })
      .addCase(fetchDeviceLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
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
      })
      // Fetch device logs by device code
      .addCase(fetchDeviceLogsByDeviceCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceLogsByDeviceCode.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceLogs = action.payload;
      })
      .addCase(fetchDeviceLogsByDeviceCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setLoading, setError, setSuccess, resetState } = deviceLogSlice.actions;
export default deviceLogSlice.reducer; 