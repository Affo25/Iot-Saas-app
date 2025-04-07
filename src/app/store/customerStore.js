// stores/customerStore.js
import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

const useCustomerStore = create((set) => ({
  customers: [],
  loading: false,
  error: null,
  formData: {
    full_name: '',
    email: '',
    contact: '',
    package_name: '',
    package_expiry: null,
    status: '',
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

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },
  addCustomer: async () => {
    try {
      set({ loading: true });
      const { formData } = useCustomerStore.getState();

      const response = await axios.post('/api/Customer', formData);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('Customer added successfully!');

        // After successful creation, fetch the updated list
        const updatedResponse = await axios.get('/api/Customer');
        if (updatedResponse.data && updatedResponse.data.customers) {
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
            }
          });
        }
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to add customer';
        toast.error(errorMessage);
        set({
          error: errorMessage,
          loading: false
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add customer';
      toast.error(errorMessage);
      set({ error: errorMessage, loading: false });
      console.error('Error adding customer:', error);
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
      console.log(`Attempting to update customer with ID: ${customerId}`);
      console.log('Update data:', updatedData);

      // Make sure we're sending the _id field in the request body
      const dataToSend = {
        ...updatedData,
        _id: customerId
      };

      const response = await axios.put('/api/Customer', dataToSend);
      console.log('Update API response:', response.data);

      if (response.data && response.data.success) {
        // Show success toast
        toast.success('Customer updated successfully!');

        // If successful, update the customer in the state
        set((state) => ({
          customers: state.customers.map(customer =>
            customer._id === customerId ? response.data.customer : customer
          ),
          loading: false,
          // Reset form data after successful update
          formData: {
            full_name: '',
            email: '',
            contact: '',
            package_name: '',
            package_expiry: null,
            status: '',
          }
        }));
        console.log(`Customer with ID ${customerId} updated successfully`);
        return true;
      } else {
        const errorMessage = response.data?.message || 'Failed to update customer';
        toast.error(errorMessage);
        set({
          loading: false,
          error: errorMessage
        });
        console.error('Failed to update customer:', response.data?.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update customer';
      toast.error(errorMessage);
      console.error('Error updating customer:', error);
      set({
        loading: false,
        error: errorMessage
      });
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
      const response = await axios.put('/api/Customer', { customerId, ...updatedData });
  
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
  

}));

 
export default useCustomerStore;