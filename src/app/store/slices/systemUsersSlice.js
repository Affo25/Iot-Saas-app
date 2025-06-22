import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const baseUrl = "/api/Dashboard/systemUsers/customers";

// Async thunks
export const fetchCustomerUsers = createAsyncThunk(
  'systemUsers/fetchCustomerUsers',
  async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const response = await axios.get(`${baseUrl}?api_key=${apiKey}`);
      console.log('Customer Users Response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch customer users');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching customer users:', error);
      
      if (error.response?.status === 401) {
        console.warn('API key authentication failed, returning empty array');
        return [];
      }
      
      throw error;
    }
  }
);

const initialState = {
  customerUsers: [],
  loading: false,
  error: null,
  success: false,
};

const systemUsersSlice = createSlice({
  name: 'systemUsers',
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
      // Fetch customer users
      .addCase(fetchCustomerUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.customerUsers = action.payload;
      })
      .addCase(fetchCustomerUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setLoading, setError, setSuccess, resetState } = systemUsersSlice.actions;
export default systemUsersSlice.reducer; 