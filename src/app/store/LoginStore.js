// store/useLoginStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';
import { redirect } from 'next/navigation';

const useLoginStore = create((set, get) => ({
  loading: false,
  error: null,
  formData: {
    email: '',
    password: '',
    userRole:''
  },
  formErrors: {},
  isAuthenticated: false,

  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
      formErrors: { ...state.formErrors, [Object.keys(data)[0]]: '' },
    })),

  validateForm: () => {
    const { formData } = get();
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    if (!formData.userRole) {
      errors.password = 'Select User Type';
    }

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  login: async (loginData = null) => {
    set({ loading: true, error: null });

    const dataToUse = loginData || get().formData;

    if (!get().validateForm()) {
      set({ loading: false });
      return { success: false, message: 'Validation failed' };
    }

    console.log("passed data to api", dataToUse);

    try {
      const res = await axios.post('/api/Auth/Login', dataToUse, {withCredentials:true});

      if (res.data && res.data.success) {
        const { token, user } = res.data;

        // Store auth data in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user-role', user.userRole || 'Customer');
        

        // Set auth header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        toast.success('Login successful!');

        set({
          formData: { email: '', password: '', userRole: '' },
          loading: false,
          error: null,
          isAuthenticated: true,
        });
        
        return { success: true, user, token };
      } else {
        throw new Error(res.data?.message || 'Login failed');
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Login failed';
      set({ error: message, loading: false });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  logout: async () => {
    set({ loading: true });
    
    try {
      // Call the logout API to clear the HTTP-only cookie
      const res = await axios.post('/api/Auth/Logout');
      
      // Clear localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('user-role');
      
      // Remove Authorization header
      delete axios.defaults.headers.common['Authorization'];
  
      // Reset store state
      set({
        loading: false,
        error: null,
        isAuthenticated: false,
        formData: {
          email: '',
          password: '',
          userRole: ''
        },
        formErrors: {}
      });
    
      toast.success('Logged out successfully');
      return { success: true ,response: res.data };
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Logout failed';
      set({ error: message, loading: false });
      toast.error(message);
      return { success: false, error: message };
    }
  },
}));

export default useLoginStore;
