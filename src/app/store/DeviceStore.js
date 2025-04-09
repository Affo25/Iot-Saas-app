// stores/customerStore.js
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

const useDeviceStore = create((set) => ({
    devices: [],
    customers: [],
  loading: false,
  error: null,
  formData: {
    device_name: '',
    device_code: '',
    description: '',
    status: '',
  },
  formErrors: {},
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data },
    formErrors: { ...state.formErrors, [Object.keys(data)[0]]: '' }
  })),

  validateForm: () => {
    const errors = {};
    const { formData } = useDeviceStore.getState();
    
    if (!formData.device_name.trim()) errors.device_name = 'Device name is required';
    if (!formData.device_code.trim()) errors.device_code = 'Device code is required';
    if (!formData.description.trim()) errors.description = 'description is required';
    if (!formData.status) errors.status = 'Status is required';

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },
  addDevice: async () => {
    try {
      set({ loading: true });
      const { formData } = useDeviceStore.getState();

      console.log("Sending device data:", formData);
      const response = await axios.post('/api/Devices', formData);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('Device added successfully!');

        // After successful creation, fetch the updated list
        const updatedResponse = await axios.get('/api/Devices');
        if (updatedResponse.data && updatedResponse.data.devices) {
          set({
            devices: updatedResponse.data.devices,
            loading: false,
            formData: {
              device_name: '',
              device_code: '',
              description: '',
              status: '',
            }
          });
        } else {
          console.error('Unexpected API response format:', updatedResponse.data);
          set({ loading: false });
        }
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to add Device';
        toast.error(errorMessage);
        set({
          error: errorMessage,
          loading: false
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add Device';
      toast.error(errorMessage);
      set({ error: errorMessage, loading: false });
      console.error('Error adding Device:', error);
      console.error('Error details:', error.response?.data);
      return false;
    }
  },
  fetchDevices: async () => {
    try {
      set({ loading: true });
      const response = await axios.get('/api/Devices');
      console.log("Fetch devices response:", response.data);
      
      // Extract devices array from the response
      if (response.data && response.data.devices) {
        set({ devices: response.data.devices, loading: false });
      } else {
        set({ devices: [], loading: false });
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch Devices', loading: false });
      console.error('Error fetching Devices:', error);
      console.error('Error details:', error.response?.data);
    }
  },

  // Update device
  updateDevice: async (deviceId, updatedData) => {
    try {
      set({ loading: true, error: null });
      console.log(`Attempting to update Device with ID: ${deviceId}`);
      console.log('Update data:', updatedData);

      // Make sure we're sending the _id field in the request body
      const dataToSend = {
        ...updatedData,
        _id: deviceId
      };

      const response = await axios.put('/api/Devices', dataToSend);
      console.log('Update API response:', response.data);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('Device updated successfully!');

        // If successful, update the device in the state
        set((state) => ({
          devices: state.devices.map(device =>
            device._id === deviceId ? response.data.device : device
          ),
          loading: false,
          // Reset form data after successful update
          formData: {
            device_name: '',
            device_code: '',
            description: '',
            status: '',
          }
        }));
        console.log(`Device with ID ${deviceId} updated successfully`);
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to update device';
        toast.error(errorMessage);
        set({
          loading: false,
          error: errorMessage
        });
        console.error('Failed to update Device:', response.data?.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update Device';
      toast.error(errorMessage);
      console.error('Error updating Device:', error);
      console.error('Error details:', error.response?.data);
      set({
        loading: false,
        error: errorMessage
      });
      return false;
    }
  },


  // Delete device
  deleteDevice: async (deviceId) => {
    try {
      set({ loading: true, error: null });
      console.log(`Attempting to delete Device with ID: ${deviceId}`);

      const response = await axios.delete(`/api/Devices?_id=${deviceId}`);
      console.log('Delete API response:', response.data);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('Device deleted successfully!');

        // If successful, remove the device from the state
        set((state) => ({
          devices: state.devices.filter((device) => device._id !== deviceId),
          loading: false,
        }));
        console.log(`Device with ID ${deviceId} deleted successfully`);
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to delete Device';
        toast.error(errorMessage);
        set({
          loading: false,
          error: errorMessage
        });
        console.error('Failed to delete Device:', response.data?.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete Device';
      toast.error(errorMessage);
      console.error('Error deleting Device:', error);
      console.error('Error details:', error.response?.data);
      set({
        loading: false,
        error: errorMessage
      });
      return false;
    }
  },

   // Edit device function
   editDevices: async (deviceId, updatedData) => {
    try {
      set({ loading: true });
  
      // Send a PUT request to update the device
      const dataToSend = {
        _id: deviceId,
        ...updatedData
      };
      
      console.log("Sending edit data:", dataToSend);
      const response = await axios.put('/api/Devices', dataToSend);
  
      if (response.data.success) {
        // If the update is successful, update the device in the state
        set((state) => ({
          devices: state.devices.map((device) =>
            device._id === deviceId ? { ...device, ...updatedData } : device
          ),
          loading: false,
        }));
        console.log(`Device with ID ${deviceId} updated successfully`);
        return true;
      } else {
        // If the response indicates failure, stop loading
        set({ loading: false });
        console.error('Failed to update Device:', response.data.message);
        return false;
      }
    } catch (error) {
      // Handle errors and stop loading
      set({ loading: false, error: error.response?.data?.message || 'Failed to update Device' });
      console.error('Error updating Device:', error);
      console.error('Error details:', error.response?.data);
      return false;
    }
  },
  

}));

 
export default useDeviceStore;