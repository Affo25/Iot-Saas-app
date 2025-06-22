import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, userRole }) => {
    const response = await axios.post('/api/Auth/Login', { email, password, userRole });
    return response.data;
  }
);

export const customerLogin = createAsyncThunk(
  'auth/customerLogin',
  async ({ email, password, userRole }) => {
    const response = await axios.post('/api/Auth/Login', { email, password, userRole });
    return response.data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData) => {
    const response = await axios.post('/api/Auth/Register', userData);
    return response.data;
  }
);

export const verify = createAsyncThunk(
  'auth/verify',
  async (token) => {
    const response = await axios.post('/api/Auth/Verify', { token });
    return response.data;
  }
);

// Add logout thunk
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    const response = await axios.post('/api/Auth/Logout');
    return response.data;
  }
);

const initialState = {
  user: null,
  token: null,
  userRole: null,
  loading: false,
  error: null,
  success: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userRole = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
      }
    },
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
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userRole = action.payload.user?.userRole;
        state.success = true;
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRole', action.payload.user?.userRole || '');
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Customer Login
      .addCase(customerLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(customerLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.userRole = action.payload.user?.userRole;
        state.success = true;
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRole', action.payload.user?.userRole || '');
        }
      })
      .addCase(customerLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Verify
      .addCase(verify.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verify.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(verify.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add logout cases
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.userRole = null;
        state.success = true;
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userRole');
          localStorage.removeItem('token');
        }
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout: authLogout, setLoading, setError, setSuccess } = authSlice.actions;
export default authSlice.reducer; 