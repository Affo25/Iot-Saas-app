"use client";

import React, { useState, useEffect } from "react";
import 'react-datepicker/dist/react-datepicker.css';
import useCustomerDeviceStore from '../../store/CustomerDevice_store';
import ReactPaginate from "react-paginate";
import * as XLSX from 'xlsx';
function Page() {
  const {
    CustomersDevice,
    customer,
    loading,
    formData,
    formErrors,
    setFormData,
    validateForm,
    addCustomerDevice,
    updateCustomerDevice,
    fetchCustomerDevice,
    deleteCustomerDevice,
    fetchSingleCustomer
  } = useCustomerDeviceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");  // State to hold the search query
  const [currentPage, setCurrentPage] = useState(0);
  const customersPerPage = 5;
  const [filteredCustomers, setFilteredCustomers] = useState(CustomersDevice); // Track filtered customers
  const [formsData, setFormsData] = useState({
    selectedDevices: [], // Ensure it's initialized as an empty array
    // Other form fields...
  });


  console.log("Filtered Customers:", filteredCustomers);
  const customersList = Array.isArray(filteredCustomers) ? filteredCustomers : [];

  const offset = currentPage * customersPerPage;
  const currentCustomers = CustomersDevice.slice(offset, offset + customersPerPage);

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
      const success = await deleteCustomerDevice(customerId);
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





  useEffect(() => {
    // Replace with your actual source of customerId
    const customerId = '67f621c47111f9c67cfc796f'; // or get it from state/props

    fetchCustomerDevice();
    fetchSingleCustomer(customerId);
    console.log("Current Customer detail:", customer);

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
    const updatedFilteredCustomers = CustomersDevice.filter((customer) => {
      return (
        (customer.title?.toLowerCase().includes(query) ?? false) ||
        (customer.device_code?.toLowerCase().includes(query) ?? false) ||
        (customer.device_serial_number?.toLowerCase().includes(query) ?? false)

      );
    });
    console.log("Updated Filtered Customers:", updatedFilteredCustomers);
    setFilteredCustomers(updatedFilteredCustomers); // Update the filtered customers
  }, [searchQuery, CustomersDevice]);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentCustomerId(null);

    // Reset form data and errors when closing modal
    setFormData({
      title: '',
      description: '',
      device_code: '',
      device_serial_number: '',
      customer_id: '',
      status: '',
    });

    // Reset formsData state as well
    setFormsData({
      selectedDevices: [], // Use selectedDevices to match the checkbox name
    });

    useCustomerDeviceStore.setState({ formErrors: {} });
  };

  const handleInputChanges = (e) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name === "selectedDevices") {
      const updatedSelectedDevices = checked
        ? [...(formsData.selectedDevices || []), value]
        : (formsData.selectedDevices || []).filter((device) => device !== value);
  
      setFormsData(prev => ({ ...prev, selectedDevices: updatedSelectedDevices }));
      setFormData(prev => ({ ...prev, device_code: updatedSelectedDevices[0] || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };



  const handleDateChange = (date) => {
    setFormData({ package_expiry: date });
  };

  const handleEdit = (customerDevice) => {
    console.log("Editing customer device:", customerDevice);

    // Extract device names from customer's devices array (if available)
    const selectedDevices = customerDevice.devices
      ? customerDevice.devices.map(device =>
        typeof device === 'object' ? device.device_name || device : device
      )
      : [];

    // Set formData with customer device info
    setFormData({
      title: customerDevice.title || '',
      description: customerDevice.description || '',
      device_code: customerDevice.device_code || '',
      device_serial_number: customerDevice.device_serial_number || '',
      status: customerDevice.status || '',
      customer_id: customerDevice.customer_id || (customer?._id || '')
    });

    // Update formsData for the checkboxes
    setFormsData({
      selectedDevices: selectedDevices.includes(customerDevice.device_code)
        ? selectedDevices
        : customerDevice.device_code
          ? [...selectedDevices, customerDevice.device_code]
          : selectedDevices
    });

    // Set edit mode and current device ID
    setIsEditMode(true);
    setCurrentCustomerId(customerDevice._id);

    // Open the modal
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form data
    if (!validateForm()) return;

    let success;

    try {
      const selectedDevices = formsData.selectedDevices || [];
      console.log("Selected devices for submission:", selectedDevices);

      const updatedFormData = {
        ...formData,
        device_code: selectedDevices[0] || "",
        customer_id: customer?._id || "",
        description: formData.description || "",
      };

      if (isEditMode && currentCustomerId) {
        console.log("Updating customer with ID:", currentCustomerId);
        console.log("Updated Form Data to Submit:", updatedFormData);

        success = await updateCustomerDevice(currentCustomerId, updatedFormData);
      } else {
        console.log("Adding new customerDevice");

        // Pass the updatedFormData to Zustand function
        success = await addCustomerDevice(updatedFormData);
      }

      if (success) {
        closeModal();
      } else {
        console.error("Operation failed but no exception was thrown");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };


  // handleInputChanges functionality has been merged into handleInputChange


  // download data as excel sheet
  const exportDtoExcel = () => {
    var wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(CustomersDevice);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "customers.xlsx");
  }






  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Device Logs Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your Devices Logs</p>
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
                        Total Devices Logs
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
                    <thead style={{ fontSize: "14px", fontWeight: 'bold' }} className="tb-tnx-head " id="datatable-default_wrapper">
                      <tr>
                        <th scope="col">#</th>
                        <th>Device Code</th>
                        <th>Humidity</th>
                        <th>Temprture</th>
                        <th>Meta</th>
                        <th scope="col">Action</th>
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
                            No device log found. Add a new customer to get started.
                          </td>
                        </tr>
                      ) : currentCustomers.map((customer, index) => (
                        <tr key={customer._id}>
                          <td><b>{index + 1}</b></td>
                          <td>{customer.title}</td>
                          <td>{customer.description}</td>
                        
                          <td>
                            <span
                              className={`badge badge-warning`}>
                              {customer.device_code}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge badge-warning`}>
                              {customer.device_code}
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
                    <span>{isEditMode ? 'Edit Device Logs Detail' : 'Add Device Logs Detail'}</span>
                  </h5>
                  <h5 style={{ marginLeft: "20px" }} className="modal-title text-white">
                    <span className="badge badge-danger"></span>
                  </h5>
                  <button style={{ color: "#fff" }} className="close" onClick={closeModal} aria-label="Close">
                    <em className="icon ni ni-cross-sm"></em>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body pt-3">
                    {useCustomerDeviceStore.getState().error && (
                      <div className="alert alert-danger">
                        {useCustomerDeviceStore.getState().error}
                      </div>
                    )}

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Humidity</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="humidity"
                              className={`form-control form-control-lg ${formErrors.humidity ? 'is-invalid' : ''}`}
                              placeholder="Enter humidity"
                              value={formData.humidity}
                              onChange={handleInputChanges}
                            />
                            {formErrors.humidity && (
                              <div className="invalid-feedback">{formErrors.humidity}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Temperature</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="temperture"
                              className={`form-control form-control-lg ${formErrors.temperture ? 'is-invalid' : ''}`}
                              placeholder="Enter temperture"
                              value={formData.temperture || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.temperture && (
                              <div className="invalid-feedback">{formErrors.temperture}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Meta</span></label>
                          <div className="form-control-wrap">
                            <textarea
                              type="text"
                              name="meta"
                              className={`form-control form-control-lg ${formErrors.meta ? 'is-invalid' : ''}`}
                              placeholder="Enter description"
                              value={formData.meta || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.meta && (
                              <div className="invalid-feedback">{formErrors.meta}</div>
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
                            <span>{isEditMode ? 'Update' : 'Save'}</span>
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
                    {useCustomerDeviceStore.getState().error && (
                      <div className="alert alert-danger">
                        {useCustomerDeviceStore.getState().error}
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
                            <button type="button" className="btn btn-danger w-100 justify-center" onClick={setCloseDeleteModal} disabled={loading}>
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