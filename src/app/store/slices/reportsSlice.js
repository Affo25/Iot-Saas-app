import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async () => {
    const response = await axios.get('/api/Dashboard/Reports');
    return response.data.data;
  }
);

export const addReport = createAsyncThunk(
  'reports/addReport',
  async (dataToSend) => {
    const response = await axios.post('/api/Dashboard/Reports', dataToSend);
    return response.data;
  }
);

export const updateReport = createAsyncThunk(
  'reports/updateReport',
  async (finalData) => {
    const response = await axios.put('/api/Dashboard/Reports', finalData);
    return response.data;
  }
);

export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (reportId) => {
    const response = await axios.delete(`/api/Dashboard/Reports?_id=${reportId}`);
    return response.data;
  }
);

const initialState = {
  reports: [],
  loading: false,
  error: null,
  success: false,
};

const reportsSlice = createSlice({
  name: 'reports',
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch reports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add report
      .addCase(addReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update report
      .addCase(updateReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete report
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setLoading, setError, setSuccess } = reportsSlice.actions;
export default reportsSlice.reducer; 