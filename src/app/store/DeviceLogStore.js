// stores/customerStore.js
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

const useDeviceLogsStore = create((set) => ({
  deviceLogs: [],
//   devices: [],
  loading: false,
  error: null,
  formData: {
    device_code: '',
    humidity: '',
    temperature: '',
    meta:{},
  },
  formErrors: {},
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data },
    formErrors: { ...state.formErrors, [Object.keys(data)[0]]: '' }
  })),
  validateForm: () => {
    const errors = {};
    const { formData } = useCustomerStore.getState();
    
    if (!formData.humidity.trim()) errors.humidity = 'humidity is required';
    if (!formData.temperature.trim()) errors.temperature = 'temperature is required';
    if (!formData.meta) errors.meta = 'meta is required';
    
    // No validation for devices - they're now optional

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },
  addCustomer: async (customerData = null) => {
    try {
      set({ loading: true });
  
      // Get formData from the store if no customerData is provided
      const dataToUse = customerData || useDeviceLogsStore.getState().formData;
      
      // Ensure devices is an array
      if (!dataToUse.devices || !Array.isArray(dataToUse.devices)) {
        dataToUse.devices = [];
      }
      
     // Construct the data to be sent
     const dataToSend = {
      device_code: dataToUse.device_code,
      humidity: dataToUse.humidity,
      temperature: dataToUse.temperature,
      meta:dataToUse.meta,
  };
  
      console.log("🚀 Data sent to API:", dataToSend);  // Check if 'devices' are present in the data
  
      // Send POST request to API to add customer
      const response = await axios.post('/api/Customer', dataToSend);
  
      if (response.data?.success) {
        console.log("🚀 Selected Devices:", dataToSend.devices);  // Log the devices being sent
  
        // Display success message
        toast.success('Device Logs added successfully!');
  
        // Refetch customers list after successful operation
        const updatedResponse = await axios.get('/api/DeviceLogs');
        if (updatedResponse.data?.customers) {
          set({
            customers: updatedResponse.data.customers,
            loading: false,
            formData: {
              device_code: '',
              humidity: '',
              temperature: '',
              meta:{}
            }
          });
        }
  
        return true;
      } else {
        // Handle error if API call fails
        const errorMessage = response.data?.message || 'Failed to add device logs';
        toast.error(errorMessage);
        set({ error: errorMessage, loading: false });
        return false;
      }
    } catch (error) {
      // Catch any unexpected errors
      const errorMessage = error.response?.data?.message || 'Failed to add device logs';
      toast.error(errorMessage);
      console.error('Error adding device logs:', error);
      set({ error: errorMessage, loading: false });
      return false;
    }
  },
  
  fetchCustomers: async () => {
    try {
      set({ loading: true });
      const response = await axios.get('/api/DeviceLogs');
      // Extract customers array from the response
      if (response.data && response.data.customers) {
        set({ customers: response.data.customers, loading: false });
      } else {
        set({ customers: [], loading: false });
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch DeviceLogs', loading: false });
      console.error('Error fetching DeviceLogs:', error);
    }
  },

  // Update customer
  updateCustomer: async (customerId, updatedData) => {
    try {
      set({ loading: true, error: null });
  
      console.log(`🔄 Attempting to update DeviceLogs with ID: ${customerId}`);
      console.log("📦 Raw update data:", updatedData);
  
      // Ensure devices is an array
      if (!updatedData.devices || !Array.isArray(updatedData.devices)) {
        updatedData.devices = [];
      }
      
      // Prepare the final data to send
      const finalData = {
        ...updatedData,
        _id: customerId,
      };
  
      console.log("✅ Sending to API:", finalData);
  
      // Send request to middleware API route
      const response = await axios.put('/api/DeviceLogs', finalData);
  
      console.log('📬 Update API response:', response.data);
  
      if (response.data?.success) {
        toast.success('✅ DeviceLogs updated successfully!');
  
        // Update state with the updated customer
        set((state) => ({
          customers: state.deviceLogs.map((customer) =>
            customer._id === customerId ? response.data.customer : customer
          ),
          loading: false,
          formData: {
            device_code: '',
              humidity: '',
              temperature: '',
              meta:{}
          }
        }));
  
        console.log(`🎉 DeviceLogs with ID ${customerId} updated in store.`);
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to update DeviceLogs';
        toast.error(`⚠️ ${errorMessage}`);
        console.error('❌ API response error:', response.data);
        set({ loading: false, error: errorMessage });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update DeviceLogs';
      toast.error(`❌ ${errorMessage}`);
      console.error('🚨 Exception during update:', error);
      set({ loading: false, error: errorMessage });
      return false;
    }
  },
  
  

  // Delete customer
  deleteCustomer: async (customerId) => {
    try {
      set({ loading: true, error: null });
      console.log(`Attempting to delete customer with ID: ${customerId}`);

      const response = await axios.delete(`/api/DeviceLogs?_id=${customerId}`);
      console.log('Delete API response:', response.data);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('DeviceLogs deleted successfully!');

        // If successful, remove the customer from the state
        set((state) => ({
          customers: state.customers.filter((customer) => customer._id !== customerId),
          loading: false,
        }));
        console.log(`DeviceLogs with ID ${customerId} deleted successfully`);
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to delete DeviceLogs';
        toast.error(errorMessage);
        set({
          loading: false,
          error: errorMessage
        });
        console.error('Failed to delete DeviceLogs:', response.data?.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete DeviceLogs';
      toast.error(errorMessage);
      console.error('Error deleting DeviceLogs:', error);
      set({
        loading: false,
        error: errorMessage
      });
      return false;
    }
  },

   // Edit customer function
   editCustomer: async (customerId, updatedData) => {
    try {
      set({ loading: true });
  
      // Send a PUT request to update the customer
      const response = await axios.put('/api/DeviceLogs', { 
        customerId, 
        ...updatedData,
        
      });
  
      if (response.data.success) {
        // If the update is successful, update the customer in the state
        set((state) => ({
          customers: state.DeviceLogs.map((customer) =>
            customer._id === customerId ? { ...customer, ...updatedData } : customer
          ),
          loading: false,
        }));
        console.log(`DeviceLogs with ID ${customerId} updated successfully`);
      } else {
        // If the response indicates failure, stop loading
        set({ loading: false });
        console.error('Failed to update DeviceLogs:', response.data.message);
      }
    } catch (error) {
      // Handle errors and stop loading
      set({ loading: false, error: error.response?.data?.message || 'Failed to update DeviceLogs' });
      console.error('Error updating DeviceLogs:', error);
    }
  },

//   fetchDevicesList: async () => {
//     try {
//       set({ loading: true });
//       const response = await axios.get('/api/Devices');
//       console.log("Fetch devices response:", response.data);
      
//       // Extract devices array from the response
//       if (response.data && response.data.devices) {
//         set({ devices: response.data.devices, loading: false });
//       } else {
//         set({ devices: [], loading: false });
//         console.error('Unexpected API response format:', response.data);
//       }
//     } catch (error) {
//       set({ error: error.response?.data?.message || 'Failed to fetch devices', loading: false });
//       console.error('Error fetching devices:', error);
//       console.error('Error details:', error.response?.data);
//     }
//   },
  

}));

 
export default useDeviceLogsStore;