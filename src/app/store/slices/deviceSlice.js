import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchDevices = createAsyncThunk(
  'device/fetchDevices',
  async () => {
    const response = await axios.get('/api/Dashboard/Devices');
    return response.data.devices;
  }
);

export const addDevice = createAsyncThunk(
  'device/addDevice',
  async (formData) => {
    const response = await axios.post('/api/Dashboard/Devices', formData);
    return response.data;
  }
);

export const updateDevice = createAsyncThunk(
  'device/updateDevice',
  async (dataToSend) => {
    const response = await axios.put('/api/Dashboard/Devices', dataToSend);
    return response.data;
  }
);

export const deleteDevice = createAsyncThunk(
  'device/deleteDevice',
  async (deviceId) => {
    const response = await axios.delete(`/api/Dashboard/Devices?_id=${deviceId}`);
    return response.data;
  }
);

export const deleteMultipleDevices = createAsyncThunk(
  'device/deleteMultipleDevices',
  async (deviceIds) => {
    const response = await axios.delete('/api/Dashboard/bulk-delete', {
      data: { 
        table: 'Device',
        ids: deviceIds 
      }
    });
    return response.data;
  }
);

const initialState = {
  devices: [],
  loading: false,
  error: null,
  success: false,
};

const deviceSlice = createSlice({
  name: 'device',
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
      // Fetch devices
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add device
      .addCase(addDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch devices from the component to ensure consistency
      })
      .addCase(addDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update device
      .addCase(updateDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch devices from the component to ensure consistency
      })
      .addCase(updateDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete device
      .addCase(deleteDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch devices from the component to ensure consistency
      })
      .addCase(deleteDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete multiple devices
      .addCase(deleteMultipleDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch devices from the component to ensure consistency
      })
      .addCase(deleteMultipleDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setLoading, setError, setSuccess, resetState } = deviceSlice.actions;
export default deviceSlice.reducer; 