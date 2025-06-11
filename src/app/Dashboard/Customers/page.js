"use client";

import React, { useState, useEffect } from "react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useCustomerStore from '../../store/customerStore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';

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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const customersPerPage = 5;
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [formsData, setFormsData] = useState({
    selectedDevices: [],
  });

  const handleDelete = async (customer) => {
    try {
      const success = await deleteCustomer(customer._id);
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
      devices: selectedDevices
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
    fetchCustomers();
    fetchDevicesList();
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const setCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const updatedFilteredCustomers = customers.filter((customer) => {
      return (
        (customer.full_name?.toLowerCase().includes(query) ?? false) ||
        (customer.email?.toLowerCase().includes(query) ?? false) ||
        (customer.contact?.toLowerCase().includes(query) ?? false) ||
        (customer.package_name?.toLowerCase().includes(query) ?? false) ||
        (customer.status?.toLowerCase().includes(query) ?? false)
      );
    });
    setFilteredCustomers(updatedFilteredCustomers);
  }, [searchQuery, customers]);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentCustomerId(null);

    setFormData({
      full_name: '',
      email: '',
      contact: '',
      package_name: '',
      package_expiry: null,
      status: '',
      devices: [],
    });
    
    setFormsData({
      selectedDevices: [],
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
  
    if (!validateForm()) return;
  
    let success;
  
    try {
      const currentFormData = { ...formData };
      
      const selectedDevices = formsData.selectedDevices || [];
      console.log("Selected devices for submission:", selectedDevices);
      
      if (isEditMode && currentCustomerId) {
        console.log("Updating customer with ID:", currentCustomerId);
        
        const updatedData = {
          ...currentFormData,
          devices: selectedDevices
        };
        
        console.log("Sending update data:", updatedData);
        success = await updateCustomer(currentCustomerId, updatedData);
      } else {
        console.log("Adding new customer");
  
        const newCustomerData = {
          ...currentFormData,
          devices: selectedDevices
        };
        
        console.log("Sending new customer data:", newCustomerData);
        success = await addCustomer(newCustomerData);
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

  const handleInputChanges = (e) => {
    const { name, value, checked } = e.target;
  
    console.log(`Input changed: ${name}, Value: ${value}, Checked: ${checked}`);
  
    if (name === "selectedDevices") {
      const updatedSelectedDevices = checked
        ? [...formsData.selectedDevices, value]
        : formsData.selectedDevices.filter((device) => device !== value);
  
      setFormsData((prev) => ({
        ...prev,
        selectedDevices: updatedSelectedDevices,
      }));
  
      setFormData((prev) => ({
        ...prev,
        devices: updatedSelectedDevices,
      }));
  
      console.log("Synced 'devices' with formData:", {
        ...formData,
        devices: updatedSelectedDevices,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const exportJsonToExcel = async (jsonData, fileName = 'data.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
  
    const dataArray = Array.isArray(customers) ? customers : [customers];
    if (dataArray.length === 0) return;
  
    const headers = Object.keys(dataArray[0]);
    worksheet.columns = headers.map((key) => ({
      header: key.toUpperCase(),
      key,
      width: 20,
    }));
  
    dataArray.forEach((row) => worksheet.addRow(row));
  
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  
    saveAs(blob, fileName);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

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
                <button className="btn btn-danger ml-1" onClick={exportJsonToExcel}>
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
            <DataTable
              data={filteredCustomers}
              loading={loading}
              title="Total Customers"
              searchPlaceholder="Search customers..."
              emptyMessage="No customers found. Add a new customer to get started."
              itemsPerPage={customersPerPage}
              searchQuery={searchQuery}
              onSearch={handleSearchChange}
              onEdit={handleEdit}
              onDelete={(customer) => {
                setCustomerToDelete(customer);
                setIsDeleteModalOpen(true);
              }}
              columns={[
                {
                  header: "Name",
                  accessor: "full_name",
                },
                {
                  header: "Email",
                  accessor: "email",
                },
                {
                  header: "Contact",
                  accessor: "contact",
                },
                {
                  header: "Package",
                  accessor: "package_name",
                  render: (item) => (
                    <span className="badge badge-warning">{item.package_name}</span>
                  ),
                },
                {
                  header: "Package Expiry",
                  accessor: "package_expiry",
                  render: (item) => (
                    <span className="badge badge-danger">
                      {new Date(item.package_expiry).toLocaleDateString()}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (item) => (
                    <span className={`badge badge-${item.status === 'Active' ? 'success' : item.status === 'Inactive' ? 'primary' : 'danger'}`}>
                      {item.status}
                    </span>
                  ),
                },
                {
                  header: "Password",
                  accessor: "password",
                  render: (item) => (
                    <span className="badge badge-info">{item.password}</span>
                  ),
                },
                {
                  header: "Devices",
                  accessor: "devices",
                  render: (item) => (
                    <span className="badge badge-success">
                      {item.devices ? item.devices.length : 0}
                    </span>
                  ),
                },
                {
                  header: "Login Time",
                  accessor: "login_time",
                  render: (item) => (
                    <span className="badge badge-primary">
                      {item.login_time ? new Date(item.login_time).toLocaleString() : 'N/A'}
                    </span>
                  ),
                },
              ]}
            />
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
                              placeholder="Enter full name"
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
                              placeholder="Enter email"
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
                          <label className="form-label"><span>Contact</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="contact"
                              className={`form-control form-control-lg ${formErrors.contact ? 'is-invalid' : ''}`}
                              placeholder="Enter contact"
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
                            <input
                              type="text"
                              name="package_name"
                              className={`form-control form-control-lg ${formErrors.package_name ? 'is-invalid' : ''}`}
                              placeholder="Enter package name"
                              value={formData.package_name}
                              onChange={handleInputChange}
                            />
                            {formErrors.package_name && (
                              <div className="invalid-feedback">{formErrors.package_name}</div>
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
                              dateFormat="MM/dd/yyyy"
                            />
                            {formErrors.package_expiry && (
                              <div className="invalid-feedback">{formErrors.package_expiry}</div>
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
                              <option value="Suspended">Suspended</option>
                            </select>
                            {formErrors.status && (
                              <div className="invalid-feedback">{formErrors.status}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-12 mt-3">
                        <div className="form-group">
                          <label className="form-label"><span>Devices</span></label>
                          <div className="form-control-wrap">
                            <div className="row">
                              {devices && devices.map((device, index) => (
                                <div key={index} className="col-md-3 mb-2">
                                  <div className="custom-control custom-checkbox">
                                    <input
                                      type="checkbox"
                                      className="custom-control-input"
                                      id={`device-${index}`}
                                      name="selectedDevices"
                                      value={device.device_name}
                                      checked={formsData.selectedDevices.includes(device.device_name)}
                                      onChange={handleInputChanges}
                                    />
                                    <label className="custom-control-label" htmlFor={`device-${index}`}>
                                      {device.device_name}
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                      <div className="col-md-9"></div>
                      <div className="col-md-3 text-right pt-2">
                        <button type="submit" className="btn btn-primary w-100 justify-center" disabled={loading}>
                          {loading ? (
                            <div className="d-flex justify-content-center">
                              <div className="spinner-border" role="status">
                                <span className="sr-only">Loading...</span>
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
        
        {/* Delete Modal */}
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={setCloseDeleteModal}
          onConfirm={handleDelete}
          title="Delete Confirmation"
          message="Do you want to delete this customer?"
          loading={loading}
          itemToDelete={customerToDelete}
        />
      </div>
    </div>
  );
}

export default Page;