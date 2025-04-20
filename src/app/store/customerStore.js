// stores/customerStore.js
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

const useCustomerStore = create((set) => ({
  customers: [],
  devices: [],
  loading: false,
  error: null,
  formData: {
    full_name: '',
    email: '',
    contact: '',
    package_name: '',
    package_expiry: null,
    status: '',
    password: '',
    devices: [], // Array to store selected devices
  },
  formErrors: {},
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data },
    formErrors: { ...state.formErrors, [Object.keys(data)[0]]: '' }
  })),
  validateForm: () => {
    const errors = {};
    const { formData } = useCustomerStore.getState();
    
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.contact.trim()) errors.contact = 'Contact is required';
    if (!formData.package_name) errors.package_name = 'Package is required';
    if (!formData.package_expiry) errors.package_expiry = 'Expiry date is required';
    if (!formData.status) errors.status = 'Status is required';
    if (!formData.password) errors.password = 'Status is required';
    
    // No validation for devices - they're now optional

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },


  addSystemUser: async ( systemUserCredentials = { email: '', password: '' }) => {
    try {
      // Don't set loading true here as it's already set in addCustomer
      
     // Construct the data to be sent
     const dataToSend = {
      email: systemUserCredentials.email,
      password: systemUserCredentials.password,
      userRole: "Customer"
  };
  
      console.log("🚀 Data sent to System User API:", dataToSend);
  
      // Send POST request to API to add system user
      const response = await axios.post('/api/SystemUsers', dataToSend);
  
      if (response.data?.success) {
        console.log("🚀 System user response:", response.data);
  
        // Display success message
        toast.success('System user added successfully!');
        return true;
      } else {
        // Handle error if API call fails
        const errorMessage = response.data?.message || 'Failed to add system user';
        toast.error(errorMessage);
        set({ error: errorMessage });
        return false;
      }
    } catch (error) {
      // Catch any unexpected errors
      const errorMessage = error.response?.data?.message || 'Failed to add system user';
      toast.error(errorMessage);
      console.error('Error adding system user:', error);
      set({ error: errorMessage });
      return false;
    }
  },

  addCustomer: async (customerData = null) => {
    try {
      set({ loading: true });
  
      // Get formData from the store if no customerData is provided
      const dataToUse = customerData || useCustomerStore.getState().formData;
      
      // Ensure devices is an array
      if (!dataToUse.devices || !Array.isArray(dataToUse.devices)) {
        dataToUse.devices = [];
      }
      
     // Construct the data to be sent
     const dataToSend = {
      full_name: dataToUse.full_name,
      email: dataToUse.email,
      contact: dataToUse.contact,
      package_name: dataToUse.package_name,
      package_expiry: dataToUse.package_expiry,
      status: dataToUse.status,
      password: dataToUse.password,
      devices: dataToUse.devices, // Use devices from the provided data
  };
  
      console.log("🚀 Data sent to API:", dataToSend);  // Check if 'devices' are present in the data
  
      // Send POST request to API to add customer
      const response = await axios.post('/api/Customer', dataToSend);
  
      if (response.data?.success) {
        console.log("🚀 Selected Devices:", dataToSend.devices);  // Log the devices being sent
        const systemUserPayload = {
          email: dataToUse.email,
          password: dataToUse.password,
        };

        // Display success message
        toast.success('Customer added successfully!');
        
        // 1. Create system user (SystemUser table)
        const systemUserResult = await useCustomerStore.getState().addSystemUser(systemUserPayload);
        if (systemUserResult) {
          console.log("System user created successfully");
        } else {
          console.warn("Failed to create system user, but customer was created");
        }
        
        // Refetch customers list after successful operation
        const updatedResponse = await axios.get('/api/Customer');
        if (updatedResponse.data?.customers) {
          set({
            customers: updatedResponse.data.customers,
            loading: false,
            formData: {
              full_name: '',
              email: '',
              contact: '',
              package_name: '',
              package_expiry: null,
              status: '',
              password: '',
              devices: [] // Reset this too!
            }
          });
        }
  
        return true;
      } else {
        // Handle error if API call fails
        const errorMessage = response.data?.message || 'Failed to add customer';
        toast.error(errorMessage);
        set({ error: errorMessage, loading: false });
        return false;
      }
    } catch (error) {
      // Catch any unexpected errors
      const errorMessage = error.response?.data?.message || 'Failed to add customer';
      toast.error(errorMessage);
      console.error('Error adding customer:', error);
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  
  
  
  fetchCustomers: async () => {
    try {
      set({ loading: true });
      const response = await axios.get('/api/Customer');
      // Extract customers array from the response
      if (response.data && response.data.customers) {
        set({ customers: response.data.customers, loading: false });
      } else {
        set({ customers: [], loading: false });
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch customers', loading: false });
      console.error('Error fetching customers:', error);
    }
  },

  // Update customer
  updateCustomer: async (customerId, updatedData) => {
    try {
      set({ loading: true, error: null });
  
      console.log(`🔄 Attempting to update customer with ID: ${customerId}`);
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
      const response = await axios.put('/api/Customer', finalData);
  
      console.log('📬 Update API response:', response.data);
  
      if (response.data?.success) {
        toast.success('✅ Customer updated successfully!');
  
        // Update state with the updated customer
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer._id === customerId ? response.data.customer : customer
          ),
          loading: false,
          formData: {
            full_name: '',
            email: '',
            contact: '',
            package_name: '',
            package_expiry: null,
            status: '',
            password: '',
            devices: []
          }
        }));
  
        console.log(`🎉 Customer ${customerId} updated in store.`);
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to update customer';
        toast.error(`⚠️ ${errorMessage}`);
        console.error('❌ API response error:', response.data);
        set({ loading: false, error: errorMessage });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update customer';
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

      const response = await axios.delete(`/api/Customer?_id=${customerId}`);
      console.log('Delete API response:', response.data);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('Customer deleted successfully!');

        // If successful, remove the customer from the state
        set((state) => ({
          customers: state.customers.filter((customer) => customer._id !== customerId),
          loading: false,
        }));
        console.log(`Customer with ID ${customerId} deleted successfully`);
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to delete customer';
        toast.error(errorMessage);
        set({
          loading: false,
          error: errorMessage
        });
        console.error('Failed to delete customer:', response.data?.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete customer';
      toast.error(errorMessage);
      console.error('Error deleting customer:', error);
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
      const response = await axios.put('/api/Customer', { 
        customerId, 
        ...updatedData,
        
      });
  
      if (response.data.success) {
        // If the update is successful, update the customer in the state
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer._id === customerId ? { ...customer, ...updatedData } : customer
          ),
          loading: false,
        }));
        console.log(`Customer with ID ${customerId} updated successfully`);
      } else {
        // If the response indicates failure, stop loading
        set({ loading: false });
        console.error('Failed to update customer:', response.data.message);
      }
    } catch (error) {
      // Handle errors and stop loading
      set({ loading: false, error: error.response?.data?.message || 'Failed to update customer' });
      console.error('Error updating customer:', error);
    }
  },

  fetchDevicesList: async () => {
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
      set({ error: error.response?.data?.message || 'Failed to fetch devices', loading: false });
      console.error('Error fetching devices:', error);
      console.error('Error details:', error.response?.data);
    }
  },
  

}));

 
export default useCustomerStore;