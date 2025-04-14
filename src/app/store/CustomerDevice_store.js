// stores/customerStore.js
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';


const useCustomerDeviceStore = create((set) => ({
    customer: null, // Added customer field to store the customer object
  CustomersDevice: [],
  loading: false,
  error: null,
  formData: {
    title: '',
    device_serial_number: '',
    description: '',
    customer_id: '',
    device_code: "",
    status: 0,
    m1 : '',
    m2 : '',
    inp1 : '',
    inp2 : '',
    inp3 : '',
    inp4 : '',
    outp1 : '',
    outp2 : '',
    outp3 : '',
    outp4 : '',
  },
  formErrors: {},
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data },
    formErrors: { ...state.formErrors, [Object.keys(data)[0]]: '' },

      // Method to set the customer object
  setCustomer: (customer) => set({ customer }),
  })),
  validateForm: () => {
    const errors = {};
    const { formData } = useCustomerDeviceStore.getState();
    
    if (!formData.title.trim()) errors.title = 'Title is required';

    if (!formData.description.trim()) errors.description = 'description is required';
    if (!formData.device_serial_number) errors.device_serial_number = 'device_serial_number is required';
    if (!formData.status) errors.status = 'Status is required';
    if (!formData.m1) errors.m1 = 'm1 is required';
    if (!formData.m2) errors.m2 = 'm2 is required';
    if (!formData.inp1) errors.inp1 = 'Input1 is required';
    if (!formData.inp2) errors.inp2 = 'Input2 is required';
    if (!formData.inp3) errors.inp3 = 'Input3 is required';
    if (!formData.inp4) errors.inp4 = 'Input4 is required';
    if (!formData.outp1) errors.outp1 = 'Output1 is required';
    if (!formData.outp2) errors.outp2 = 'Output2 is required';
    if (!formData.outp3) errors.outp3 = 'Output3 is required';
    if (!formData.outp4) errors.outp4 = 'Output4 is required';

    // No validation for devices - they're now optional

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },
  addCustomerDevice: async (customerData = null) => {
    try {
      set({ loading: true });
  
      // Get formData from the store if no customerData is provided
      const dataToUse = customerData || useCustomerDeviceStore.getState().formData;
      
      // Ensure devices is an array
      if (!dataToUse.devices || !Array.isArray(dataToUse.devices)) {
        dataToUse.devices = [];
      }
      
     // Construct the data to be sent
     const dataToSend = {
      title: dataToUse.title,
      description: dataToUse.description,
      device_code: dataToUse.device_code,
      device_serial_number: dataToUse.device_serial_number,
      customer_id: dataToUse.customer_id,
      status: dataToUse.status,
      m1: "",
      m2: "",
      inp1: "",
      inp2: "",
      inp3: "",
      inp4: "",
      outp1: "",
      outp2: "",
      outp3: "",
      outp4: "",
  };
  
      console.log("🚀 Data sent to API:", dataToSend);  // Check if 'devices' are present in the data
  
      // Send POST request to API to add customer
      const response = await axios.post('/api/CustomersDevice', dataToSend);
  
      if (response.data?.success) {
        console.log("🚀 Selected Devices:", dataToSend.devices);  // Log the devices being sent
  
        // Display success message
        toast.success('customerDevice added successfully!');
  
        // Refetch customers list after successful operation
        const updatedResponse = await axios.get('/api/CustomersDevice');
        if (updatedResponse.data?.data) {
          set({
            CustomersDevice: updatedResponse.data.data,
            loading: false,
            formData: {
              title: '',
              description: '',
              device_code: '',
              device_serial_number: '',
              customer_id: "",
              status: 0,
              m1: "",
              m2: "",
              inp1: "",
              inp2: "",
              inp3: "",
              inp4: "",
              outp1: "",
              outp2: "",
              outp3: "",
              outp4: "",
            
            }
          });
        }
  
        return true;
      } else {
        // Handle error if API call fails
        const errorMessage = response.data?.message || 'Failed to add customerDevice';
        toast.error(errorMessage);
        set({ error: errorMessage, loading: false });
        return false;
      }
    } catch (error) {
      // Catch any unexpected errors
      const errorMessage = error.response?.data?.message || 'Failed to add customerDevice';
      toast.error(errorMessage);
      console.error('Error adding customerDevice:', error);
      set({ error: errorMessage, loading: false });
      return false;
    }
  },
  
  fetchCustomerDevice: async () => {
    try {
      set({ loading: true });
      const response = await axios.get('/api/CustomersDevice');
      // Extract customers array from the response
      if (response.data && response.data.data) {
        set({ CustomersDevice: response.data.data, loading: false });
      } else {
        set({ CustomersDevice: [], loading: false });
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch customerDevice', loading: false });
      console.error('Error fetching customerDevice:', error);
    }
  },

  // Update customer
  updateCustomerDevice: async (customerId, updatedData) => {
    try {
      set({ loading: true, error: null });
  
      console.log(`🔄 Attempting to update customerDevice with ID: ${customerId}`);
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
      const response = await axios.put('/api/CustomersDevice', finalData);
  
      console.log('📬 Update API response:', response.data);
  
      if (response.data?.success) {
        toast.success('✅ customerDevice updated successfully!');
  
        // Update state with the updated customer
        set((state) => ({
          CustomersDevice: state.CustomersDevice.map((customer) =>
            customer._id === customerId ? response.data.data : customer
          ),
          loading: false,
          formData: {
            title: '',
            description: '',
            device_serial_number: '',
            device_code: '',
            customer_id: "",
            status: 0,
            m1: "",
            m2: "",
            inp1: "",
            inp2: "",
            inp3: "",
            inp4: "",
            outp1: "",
            outp2: "",
            outp3: "",
            outp4: "",
          }
        }));
  
        console.log(`🎉 CustomerDevice ${customerId} updated in store.`);
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
  deleteCustomerDevice: async (customerId) => {
    try {
      set({ loading: true, error: null });
      console.log(`Attempting to delete customer with ID: ${customerId}`);

      const response = await axios.delete(`/api/CustomersDevice?_id=${customerId}`);
      console.log('Delete API response:', response.data);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('Customer deleted successfully!');

        // If successful, remove the customer from the state
        set((state) => ({
          CustomersDevice: state.CustomersDevice.filter((customer) => customer._id !== customerId),
          loading: false,
        }));
        console.log(`Customer Devices with ID ${customerId} deleted successfully`);
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
      console.error('Error deleting customerDevice:', error);
      set({
        loading: false,
        error: errorMessage
      });
      return false;
    }
  },

   // Edit customer function
   editCustomerDevice: async (customerId, updatedData) => {
    try {
      set({ loading: true });
  
      // Send a PUT request to update the customer
      const response = await axios.put('/api/CustomersDevice', { 
        customerId, 
        ...updatedData,
        
      });
  
      if (response.data.success) {
        // If the update is successful, update the customer in the state
        set((state) => ({
          CustomersDevice: state.CustomersDevice.map((customer) =>
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



  fetchSingleCustomer: async (customerId) => {
    try {
      set({ loading: true });
  
      if (!customerId) {
        throw new Error('Customer ID is required to fetch customer details.');
      }
  
      // Correct API endpoint
      const customerUrl = `/api/CustomerRecord?customer_id=${customerId}`;
  
      // Fetch the customer data
      const response = await axios.get(customerUrl);
  
      console.log("🎯 Customer fetched:", response.data);
  
      // ✅ Correctly access the nested structure in response
      if (response.data && response.data.data && response.data.data.customer) {
        set({ customer: response.data.data.customer, loading: false });
      } else {
        set({ error: 'Customer not found', loading: false });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch customer details';
      toast.error(errorMessage);
      console.error('Error fetching customer:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  
  
}));

 
export default useCustomerDeviceStore;