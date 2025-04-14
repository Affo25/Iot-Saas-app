// stores/DeviceLogStore.js
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

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

  // Set form data and clear any errors for the updated field
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data },
    formErrors: { ...state.formErrors, [Object.keys(data)[0]]: '' }
  })),

  // Set meta data specifically (handles JSON objects)
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

  // Validate form before submission
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

  // Add a new device log
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

      console.log("🚀 Data sent to API:", dataToSend);

      const response = await axios.post('/api/DeviceLog', dataToSend);

      if (response.data?.success) {
        toast.success('Device log added successfully!');
        await fetchDeviceLogs();
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
      console.error('Error adding device log:', error);
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  // Fetch all device logs or filter by device code
  fetchDeviceLogs: async (deviceCode = "pk-112232") => {
    try {
      set({ loading: true });

      let url = '/api/DeviceLog';
      if (deviceCode) {
        url += `?device_code=${deviceCode}`;
      }

      const response = await axios.get(url);

      if (response.data && response.data.data) {
        set({ deviceLogs: response.data.data, loading: false });
      } else {
        set({ deviceLogs: [], loading: false });
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch device logs';
      toast.error(errorMessage);
      console.error('Error fetching device logs:', error);
      set({ error: errorMessage, loading: false });
    }
  },

  // Update device log
  updateDeviceLog: async (logId, updatedData) => {
    try {
      set({ loading: true, error: null });

      console.log(`🔄 Attempting to update device log with ID: ${logId}`);
      console.log("📦 Raw update data:", updatedData);

      let metaToSend = typeof updatedData.meta === 'string' ? JSON.parse(updatedData.meta) : updatedData.meta;

      const finalData = {
        ...updatedData,
        _id: logId,
        meta: metaToSend,
        humidity: Number(updatedData.humidity),
        temperature: Number(updatedData.temperature)
      };

      console.log("✅ Sending to API:", finalData);

      const response = await axios.put('/api/DeviceLog', finalData);

      if (response.data?.success) {
        toast.success('✅ Device log updated successfully!');
        await fetchDeviceLogs();
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to update device log';
        toast.error(`⚠️ ${errorMessage}`);
        console.error('❌ API response error:', response.data);
        set({ loading: false, error: errorMessage });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update device log';
      toast.error(`❌ ${errorMessage}`);
      console.error('🚨 Exception during update:', error);
      set({ loading: false, error: errorMessage });
      return false;
    }
  },

  // Delete device log
  deleteDeviceLog: async (logId) => {
    try {
      set({ loading: true, error: null });
      console.log(`Attempting to delete device log with ID: ${logId}`);

      const response = await axios.delete(`/api/DeviceLog?_id=${logId}`);
      console.log('Delete API response:', response.data);

      if (response.data && response.data.success) {
        toast.success('Device log deleted successfully!');
        await fetchDeviceLogs();
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to delete device log';
        toast.error(errorMessage);
        set({ loading: false, error: errorMessage });
        console.error('Failed to delete device log:', response.data?.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete device log';
      toast.error(errorMessage);
      console.error('Error deleting device log:', error);
      set({ loading: false, error: errorMessage });
      return false;
    }
  },
}));

export default useDeviceLogsStore;
