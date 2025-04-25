// stores/DeviceLogStore.js
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

const apiKey = "b74354d472b5d2f6dad39b42b334585a4044d57495ef19a55d068bc4ba21c7ba"; // 🔐 Replace with your actual key
const baseUrl = "/api/Devicelog";

const useDeviceLogsStore = create((set, get) => ({
  deviceLogs: [],
  loading: false,
  error: null,
  formData: {
    device_code: '',
    humidity: 0,
    temperature: 0,
    meta: {},
  },
  formErrors: {},

  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data },
    formErrors: { ...state.formErrors, [Object.keys(data)[0]]: '' }
  })),

  setMetaData: (metaData) => {
    try {
      const parsedMeta = typeof metaData === 'string' ? JSON.parse(metaData) : metaData;
      set((state) => ({
        formData: { ...state.formData, meta: parsedMeta },
        formErrors: { ...state.formErrors, meta: '' }
      }));
      return true;
    } catch (error) {
      console.error("Error parsing meta data:", error);
      set((state) => ({
        formErrors: { ...state.formErrors, meta: 'Invalid JSON format' }
      }));
      return false;
    }
  },

  validateForm: () => {
    const errors = {};
    const { formData } = get();

    if (!formData.device_code) errors.device_code = 'Device code is required';

    const humidity = Number(formData.humidity);
    const temperature = Number(formData.temperature);

    if (isNaN(humidity)) errors.humidity = 'Humidity must be a number';
    if (isNaN(temperature)) errors.temperature = 'Temperature must be a number';

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  addDeviceLog: async (logData = null) => {
    try {
      set({ loading: true });

      const dataToUse = logData || get().formData;
      let metaToSend = typeof dataToUse.meta === 'string' ? JSON.parse(dataToUse.meta) : dataToUse.meta;

      const dataToSend = {
        device_code: dataToUse.device_code,
        humidity: Number(dataToUse.humidity),
        temperature: Number(dataToUse.temperature),
        meta: metaToSend,
      };

      const response = await axios.post(`${baseUrl}?api_key=${apiKey}`, dataToSend);

      if (response.data?.success) {
        toast.success('Device log added successfully!');
        await get().fetchDeviceLogs();
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to add device log';
        toast.error(errorMessage);
        set({ error: errorMessage, loading: false });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add device log';
      toast.error(errorMessage);
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  fetchDeviceLogs: async () => {
    try {
      set({ loading: true });

      const response = await axios.get(`${baseUrl}?api_key=${apiKey}`);

      if (response.data && response.data.data) {
        set({ deviceLogs: response.data.data, loading: false });
      } else {
        set({ deviceLogs: [], loading: false });
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch device logs';
      toast.error(errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  updateDeviceLog: async (logId, updatedData) => {
    try {
      set({ loading: true, error: null });

      let metaToSend = typeof updatedData.meta === 'string' ? JSON.parse(updatedData.meta) : updatedData.meta;

      const finalData = {
        ...updatedData,
        _id: logId,
        meta: metaToSend,
        humidity: Number(updatedData.humidity),
        temperature: Number(updatedData.temperature)
      };

      const response = await axios.put(`${baseUrl}?api_key=${apiKey}`, finalData);

      if (response.data?.success) {
        toast.success('✅ Device log updated successfully!');
        await get().fetchDeviceLogs();
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to update device log';
        toast.error(`⚠️ ${errorMessage}`);
        set({ loading: false, error: errorMessage });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update device log';
      toast.error(`❌ ${errorMessage}`);
      set({ loading: false, error: errorMessage });
      return false;
    }
  },

  deleteDeviceLog: async (logId) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.delete(`${baseUrl}?_id=${logId}&api_key=${apiKey}`);

      if (response.data && response.data.success) {
        toast.success('Device log deleted successfully!');
        await get().fetchDeviceLogs();
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to delete device log';
        toast.error(errorMessage);
        set({ loading: false, error: errorMessage });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete device log';
      toast.error(errorMessage);
      set({ loading: false, error: errorMessage });
      return false;
    }
  },
}));

export default useDeviceLogsStore;
