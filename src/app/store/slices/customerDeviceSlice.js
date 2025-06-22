import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchCustomerDevices = createAsyncThunk(
  'customerDevice/fetchCustomerDevices',
  async (customerId) => {
    if (!customerId) {
      // Return empty array instead of throwing error
      return [];
    }
    
    const url = `/api/Dashboard/CustomersDevice?_id=${customerId}`;
    console.log("📌 Fetching customer devices for customer:", customerId, "with URL:", url);
    
    try {
      const response = await axios.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching customer devices:", error);
      return [];
    }
  }
);

export const addCustomerDevice = createAsyncThunk(
  'customerDevice/addCustomerDevice',
  async (dataToSend) => {
    const response = await axios.post('/api/Dashboard/CustomersDevice', dataToSend);
    return response.data;
  }
);

export const updateCustomerDevice = createAsyncThunk(
  'customerDevice/updateCustomerDevice',
  async (finalData) => {
    const response = await axios.put('/api/Dashboard/CustomersDevice', finalData);
    return response.data;
  }
);

export const deleteCustomerDevice = createAsyncThunk(
  'customerDevice/deleteCustomerDevice',
  async (customerId) => {
    const response = await axios.delete(`/api/Dashboard/CustomersDevice?_id=${customerId}`);
    return response.data;
  }
);

export const deleteMultipleCustomerDevices = createAsyncThunk(
  'customerDevice/deleteMultipleCustomerDevices',
  async (customerDeviceIds) => {
    const response = await axios.delete('/api/Dashboard/bulk-delete', {
      data: { 
        table: 'CustomersDevice',
        ids: customerDeviceIds 
      }
    });
    return response.data;
  }
);

const initialState = {
  customerDevices: [],
  loading: false,
  error: null,
  success: false,
};

const customerDeviceSlice = createSlice({
  name: 'customerDevice',
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
      // Fetch customer devices
      .addCase(fetchCustomerDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.customerDevices = action.payload;
      })
      .addCase(fetchCustomerDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add customer device
      .addCase(addCustomerDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomerDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addCustomerDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update customer device
      .addCase(updateCustomerDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateCustomerDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete customer device
      .addCase(deleteCustomerDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomerDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteCustomerDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete multiple customer devices
      .addCase(deleteMultipleCustomerDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleCustomerDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteMultipleCustomerDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setLoading, setError, setSuccess, resetState } = customerDeviceSlice.actions;
export default customerDeviceSlice.reducer; 
