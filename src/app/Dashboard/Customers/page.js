"use client";

import React, { useState, useEffect } from "react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useCustomerStore from '../../store/customerStore';
import ReactPaginate from "react-paginate";
import * as XLSX from 'xlsx';
function Page() {
  const {
    devices,
    customers,
    loading,
    formData,
    formErrors,
    setFormData,
    validateForm,
    addCustomer,
    updateCustomer,
    fetchCustomers,
    deleteCustomer,
    fetchDevicesList
  } = useCustomerStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");  // State to hold the search query
  const [currentPage, setCurrentPage] = useState(0);
  const customersPerPage = 5;
  const [filteredCustomers, setFilteredCustomers] = useState(customers); // Track filtered customers
  const [formsData, setFormsData] = useState({
    selectedDevices: [], // Ensure it's initialized as an empty array
    // Other form fields...
  });


  // Calculate the page range
  const offset = currentPage * customersPerPage;
  const currentCustomers = filteredCustomers.slice(offset, offset + customersPerPage);

  const handlePageClick = (selected) => {
    setCurrentPage(selected.selected);
  };

  const handleSearchChange = (e) => {
    console.log(e.target.value);
    setSearchQuery(e.target.value); // Update search query state
  };
   


  const handleDelete = async (customerId) => {
    try {
      // Call deleteCustomer function from Zustand store
      const success = await deleteCustomer(customerId);
      if (success) {
        setCloseDeleteModal();
        console.log('Customer deleted successfully');
      } else {
        console.error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };

  const handleEdit = (customer) => {
    console.log("Editing customer:", customer);
  
    const selectedDevices = customer.devices
      ? customer.devices.map(device =>
          typeof device === 'object' ? device.device_name : device
        )
      : [];
  
    // Set formData with customer info including devices
    setFormData({
      full_name: customer.full_name,
      email: customer.email,
      contact: customer.contact,
      package_name: customer.package_name,
      package_expiry: new Date(customer.package_expiry),
      status: customer.status,
      devices: selectedDevices  // ✅ Use updated selected devices directly
    });
  
    // Also update formsData for the checkboxes
    setFormsData({
      selectedDevices: selectedDevices
    });
  
    // Set edit mode and current customer ID
    setIsEditMode(true);
    setCurrentCustomerId(customer._id);
  
    // Open the modal
    setIsModalOpen(true);
  };
  



  useEffect(() => {
    // Fetch customers when component mounts
    fetchCustomers();
    fetchDevicesList();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const setCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  // Effect to update filtered customers whenever searchQuery changes
  useEffect(() => {
    const query = searchQuery.toLowerCase(); // Lowercase search query
    const updatedFilteredCustomers = customers.filter((customer) => {
      return (
        (customer.full_name?.toLowerCase().includes(query) ?? false) ||
        (customer.email?.toLowerCase().includes(query) ?? false) ||
        (customer.contact?.toLowerCase().includes(query) ?? false) ||
        (customer.package_name?.toLowerCase().includes(query) ?? false) ||
        (customer.status?.toLowerCase().includes(query) ?? false)
      );
    });
    console.log("Updated Filtered Customers:", updatedFilteredCustomers);
    setFilteredCustomers(updatedFilteredCustomers); // Update the filtered customers
  }, [searchQuery, customers]);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentCustomerId(null);

    // Reset form data and errors when closing modal
    setFormData({
      full_name: '',
      email: '',
      contact: '',
      package_name: '',
      package_expiry: null,
      status: '',
      devices: [],
    });
    
    // Reset formsData state as well
    setFormsData({
      selectedDevices: [], // Use selectedDevices to match the checkbox name
    });
    
    useCustomerStore.setState({ formErrors: {} });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
  };
  


  const handleDateChange = (date) => {
    setFormData({ package_expiry: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate the form data
    if (!validateForm()) return;
  
    let success;
  
    try {
      // Make a copy of the current form data
      const currentFormData = { ...formData };
      
      // Always use the selectedDevices from formsData
      const selectedDevices = formsData.selectedDevices || [];
      console.log("Selected devices for submission:", selectedDevices);
      
      // Handle customer update
      if (isEditMode && currentCustomerId) {
        console.log("Updating customer with ID:", currentCustomerId);
        
        // Create the updated data with devices
        const updatedData = {
          ...currentFormData,
          devices: selectedDevices
        };
        
        console.log("Sending update data:", updatedData);
        success = await updateCustomer(currentCustomerId, updatedData);
      } else {
        // Handle adding a new customer
        console.log("Adding new customer");
  
        // Create new customer data with devices
        const newCustomerData = {
          ...currentFormData,
          devices: selectedDevices
        };
        
        console.log("Sending new customer data:", newCustomerData);
        success = await addCustomer(newCustomerData);
      }
  
      // After a successful operation, close the modal
      if (success) {
        closeModal();
      } else {
        console.error("Operation failed but no exception was thrown");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };
  

  const handleInputChanges = (e) => {
    const { name, value, checked } = e.target;
  
    console.log(`Input changed: ${name}, Value: ${value}, Checked: ${checked}`);
  
    if (name === "selectedDevices") {
      const updatedSelectedDevices = checked
        ? [...formsData.selectedDevices, value] // Add selected device
        : formsData.selectedDevices.filter((device) => device !== value); // Remove unselected
  
      // Update formsData state
      setFormsData((prev) => ({
        ...prev,
        selectedDevices: updatedSelectedDevices,
      }));
  
      // Sync selected devices with formData.devices
      setFormData((prev) => ({
        ...prev,
        devices: updatedSelectedDevices,
      }));
  
      console.log("Synced 'devices' with formData:", {
        ...formData,
        devices: updatedSelectedDevices,
      });
    } else {
      // Handle other input fields
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // download data as excel sheet
  const exportDtoExcel = () => {
    var wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(customers);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "customers.xlsx");
  } 

  
  
  
  

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Customers Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your Customers</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <button className="btn btn-success ml-1">
                  <span>Upload From Excel</span>
                </button>
                <button className="btn btn-danger ml-1" onClick={exportDtoExcel}>
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary ml-1"
                  onClick={openModal}
                >
                  <span>Add New</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Customers Table */}
        <div className="row pt-3">
          <div className="col-12">
            <div className="card card-bordered card-preview">
              <div className="card-inner-group">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                    <h5 className="title">
                     Total Customers
                     <span className="badge badge-info ml-2">
                     {filteredCustomers.length}
                     </span>
                    </h5>
                    </div>
                    {/* Search and other controls... */}
                    <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search customers..."
            value={searchQuery}
             onChange={handleSearchChange}  // Update the search query
          />
        </div>
                  </div>
                </div>

                <div className="card-inner p-0 table-responsive">
                  <table className="table  table-hover nowrap  align-middle dataTable-init">
                    <thead style={{fontSize:"14px",fontWeight:'bold'}} className="tb-tnx-head " id="datatable-default_wrapper">
                      <tr>
                        <th scope="col">#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Package</th>
                        <th>Package Expiry</th>
                        <th>Status</th>
                        <th>Password</th>
                        <th>Devices</th>
                        <th>Login Time</th>
                        <th style={{ width: "12%" }} scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontFamily: "Segoe UI" }} className="tb-tnx-body">
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center">
                            <span className="spinner-border text-secondary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </span>
                          </td>
                        </tr>
                      ) : filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center">
                            No customers found. Add a new customer to get started.
                          </td>
                        </tr>
                      ) : currentCustomers.map((customer, index) => (
                        <tr key={customer._id}>
                          <td><b>{index + 1}</b></td>
                          <td>{customer.full_name}</td>
                          <td>{customer.email}</td>
                          <td>{customer.contact}</td>
                          <td>
                      <span 
                        className={`badge badge-warning`}>
                         {customer.package_name}
                             </span>
                          </td>
                          <td>
                      <span 
                        className={`badge badge-danger`}>
                         {new Date(customer.package_expiry).toLocaleDateString()}
                             </span>
                          </td>
                          <td>
                      <span 
                        className={`badge badge-${customer.status === 'Active' ? 'success' : customer.status === 'Inactive' ? 'primary' : 'danger'}`}>
                         {customer.status}
                             </span>
                          </td>
                          <td>{customer.password}</td>
                          <td>
                      {customer.devices && customer.devices.length > 0 ? (
                        <div>
                          <span className="badge badge-secondary mb-1">
                            {customer.devices.length} device(s)
                          </span>
                          <div style={{ fontSize: '0.8rem' }}>
                            {customer.devices.map((device, idx) => (
                              <div key={idx} className="text-muted">
                                {device.device_name || (typeof device === 'string' ? device : 'Unknown')}
                              </div>
                            )).slice(0, 2)}
                            {customer.devices.length > 2 && (
                              <div className="text-muted">...</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-secondary">No devices</span>
                      )}
                          </td>
                          <td>
                      <span 
                        className={`badge badge-info`}>
                         {customer.login_time===null?"Not Logged In":customer.login_time}
                             </span>
                          </td>
                          <td className="text-center">
                            <button className="btn btn-danger btn btn-sm ml-3" onClick={() => {
                              setCustomerToDelete(customer);
                              setIsDeleteModalOpen(true);
                            }}>
                              <span>Delete</span>
                            </button>
                            <button className="btn btn-primary btn btn-sm ml-1" onClick={() => handleEdit(customer)}>
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))
                      }
                    </tbody>
                   
                  </table>
                    {/* Pagination Component */}
      <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        pageCount={Math.ceil(filteredCustomers.length / customersPerPage)}
        onPageChange={handlePageClick}
        containerClassName={"pagination justify-content-end"}
        pageClassName={"page-item"}
        pageLinkClassName={"page-link"}
        previousClassName={"page-item"}
        previousLinkClassName={"page-link"}
        nextClassName={"page-item"}
        nextLinkClassName={"page-link"}
        activeClassName={"active"}
      />
                </div>
              </div>
            </div>
          </div>
        </div>
    
        {/* Add Customer Modal */}
        {isModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>{isEditMode ? 'Edit Customer Detail' : 'Add Customer Detail'}</span>
                  </h5>
                  <button style={{ color: "#fff" }} className="close" onClick={closeModal} aria-label="Close">
                    <em className="icon ni ni-cross-sm"></em>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body pt-3">
                    {useCustomerStore.getState().error && (
                      <div className="alert alert-danger">
                        {useCustomerStore.getState().error}
                      </div>
                    )}
                    
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Full Name</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="full_name"
                              className={`form-control form-control-lg ${formErrors.full_name ? 'is-invalid' : ''}`}
                              placeholder="Enter Full Name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                            />
                            {formErrors.full_name && (
                              <div className="invalid-feedback">{formErrors.full_name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Email</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="email"
                              name="email"
                              className={`form-control form-control-lg ${formErrors.email ? 'is-invalid' : ''}`}
                              placeholder="Enter Email"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                            {formErrors.email && (
                              <div className="invalid-feedback">{formErrors.email}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Password</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="password"
                              className={`form-control form-control-lg ${formErrors.password ? 'is-invalid' : ''}`}
                              placeholder="Enter password"
                              value={formData.password}
                              onChange={handleInputChange}
                            />
                            {formErrors.password && (
                              <div className="invalid-feedback">{formErrors.password}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Contact</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="contact"
                              className={`form-control form-control-lg ${formErrors.contact ? 'is-invalid' : ''}`}
                              placeholder="Enter Contact"
                              value={formData.contact}
                              onChange={handleInputChange}
                            />
                            {formErrors.contact && (
                              <div className="invalid-feedback">{formErrors.contact}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Package Name</span></label>
                          <div className="form-control-wrap">
                            <select
                              name="package_name"
                              className={`form-control form-control-lg ${formErrors.package_name ? 'is-invalid' : ''}`}
                              value={formData.package_name}
                              onChange={handleInputChange}
                            >
                              <option value="">Select Package</option>
                              <option value="Basic">Basic</option>
                              <option value="Standard">Standard</option>
                              <option value="Premium">Premium</option>
                            </select>
                            {formErrors.package_name && (
                              <div className="invalid-feedback">{formErrors.package_name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                     
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Status</span></label>
                          <div className="form-control-wrap">
                            <select
                              name="status"
                              className={`form-control form-control-lg ${formErrors.status ? 'is-invalid' : ''}`}
                              value={formData.status}
                              onChange={handleInputChange}
                            >
                              <option value="">Select Status</option>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Pending">Pending</option>
                            </select>
                            {formErrors.status && (
                              <div className="invalid-feedback">{formErrors.status}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Package Expiry</span></label>
                          <div className="form-control-wrap">
                            <DatePicker
                              selected={formData.package_expiry}
                              onChange={handleDateChange}
                              className={`form-control form-control-lg ${formErrors.package_expiry ? 'is-invalid' : ''}`}
                              placeholderText="Select expiry date"
                              dateFormat="MMMM d, yyyy"
                              minDate={new Date()}
                            />
                            {formErrors.package_expiry && (
                              <div className="invalid-feedback">{formErrors.package_expiry}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Select Devices to assign</span></label>
                          <div className="form-control-wrap">
                            {/* Dynamically render device checkboxes */}
                            {devices.map((device) => (
                              <div key={device.device_name} className="form-check">
                                <input
                                  type="checkbox"
                                  name="selectedDevices"
                                  value={device.device_name}
                                  className={`form-check-input ${formErrors.selectedDevices ? 'is-invalid' : ''}`}
                                  checked={formsData.selectedDevices && formsData.selectedDevices.includes(device.device_name)}
                                  onChange={handleInputChanges}
                                />
                                <label className="form-check-label">
                                  {device.device_name} {/* Or any other property of the device */}
                                </label>
                              </div>
                            ))}
                            {formErrors.selectedDevices && (
                              <div className="invalid-feedback">{formErrors.selectedDevices}</div>
                            )}
                          </div>
                        </div>
</div>
                 
</div>
                    
                    <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                      <div className="col-md-9"></div>
                      <div className="col-md-3 text-right pt-2">
                        <button 
                          type="submit" 
                          className="btn btn-primary w-100 justify-center"
                          disabled={loading}
                        >
                          {loading ? (
                           <div class="d-flex justify-content-center">
                           <div class="spinner-border" role="status">
                             <span class="sr-only">Loading...</span>
                           </div>
                         </div>
                          ) : (
                            <span>{isEditMode ? 'Update Customer' : 'Save Customer'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}


         {/* Delete Customer Modal */}
         {isDeleteModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-sm" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>Delete Confirmtion</span>
                  </h5>
                
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body pt-3">
                    {useCustomerStore.getState().error && (
                      <div className="alert alert-danger">
                        {useCustomerStore.getState().error}
                      </div>
                    )}
                    
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group mt-1">
                          <div className="form-control-wrap">
                           <h5>Do You want to delete this customer?</h5>
                          
                          </div>
                        </div>
                      </div>         
                    </div>
                    <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                   <div className="col-md-12"></div>
                    <div className="col-md-9 text-right pt-2">
                      <ul className="list-inline mb-0">
                          <li className="list-inline-item mr-2">
                        <button type="button" className="btn btn-primary w-100 justify-center" onClick={() => customerToDelete && handleDelete(customerToDelete._id)} disabled={loading || !customerToDelete}>
                         <span>Yes</span>
                           </button>
                       </li>
                           <li className="list-inline-item">
                             <button type="button" className="btn btn-danger w-100 justify-center" onClick={setCloseDeleteModal}disabled={loading}>
                               <span>No</span>
                                 </button>
      </li>
    </ul>
  </div>
</div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
 
       
      </div>
     
    </div>
  );
}

export default Page;