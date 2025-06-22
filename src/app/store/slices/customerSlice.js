import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customer/fetchCustomers',
  async () => {
    const response = await axios.get('/api/Dashboard/Customer');
    return response.data.customers;
  }
);

export const addCustomer = createAsyncThunk(
  'customer/addCustomer',
  async (dataToSend) => {
    const response = await axios.post('/api/Dashboard/Customer', dataToSend);
    return response.data;
  }
);

export const updateCustomer = createAsyncThunk(
  'customer/updateCustomer',
  async (finalData) => {
    const response = await axios.put('/api/Dashboard/Customer', finalData);
    return response.data;
  }
);

export const deleteCustomer = createAsyncThunk(
  'customer/deleteCustomer',
  async (customerId) => {
    const response = await axios.delete(`/api/Dashboard/Customer?_id=${customerId}`);
    return response.data;
  }
);

export const deleteMultipleCustomers = createAsyncThunk(
  'customer/deleteMultipleCustomers',
  async (customerIds) => {
    const response = await axios.delete('/api/Dashboard/bulk-delete', {
      data: { 
        table: 'Customers',
        ids: customerIds 
      }
    });
    return response.data;
  }
);

const initialState = {
  customers: [],
  loading: false,
  error: null,
  success: false,
};

const customerSlice = createSlice({
  name: 'customer',
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
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add customer
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch customers from the component to ensure consistency
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch customers from the component to ensure consistency
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete customer
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch customers from the component to ensure consistency
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete multiple customers
      .addCase(deleteMultipleCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Note: Will refetch customers from the component to ensure consistency
      })
      .addCase(deleteMultipleCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setLoading, setError, setSuccess, resetState } = customerSlice.actions;
export default customerSlice.reducer; 