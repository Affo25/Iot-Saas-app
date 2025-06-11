"use client";

import React, { useState, useEffect } from "react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useCustomerStore from '../../store/customerStore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import useDeviceStore from "../../store/DeviceStore";
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';



function Page() {
  const {
    devices,
    loading,
    formData,
    formErrors,
    setFormData,
    validateForm,
    addDevice,
    editDevices,
    fetchDevices,
    deleteDevice,
    fetchCustomersList
  } = useDeviceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");  // State to hold the search query
  const [currentPage, setCurrentPage] = useState(0);
  const customersPerPage = 5;
  const [filteredCustomers, setFilteredCustomers] = useState(devices); // Track filtered customers


  const offset = currentPage * customersPerPage;
const currentCustomers = Array.isArray(filteredCustomers) && filteredCustomers.length > 0
  ? filteredCustomers.slice(offset, offset + customersPerPage)
  : [];

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
      const success = await deleteDevice(customerId);
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

    // Set form data with customer details
    setFormData({
      device_name: customer.device_name,
      device_code: customer.device_code,
      description: customer.description,
      status: customer.status
    });

    // Set edit mode and current customer ID
    setIsEditMode(true);
    setCurrentCustomerId(customer._id);

    // Open the modal
    setIsModalOpen(true);
  };

  useEffect(() => {
   
    fetchDevices();

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
    const updatedFilteredCustomers = devices.filter((customer) => {
      return (
        (customer.device_name?.toLowerCase().includes(query) ?? false) ||
        (customer.device_code?.toLowerCase().includes(query) ?? false)
       
      );
    });
    console.log("Updated Filtered Devices:", updatedFilteredCustomers);
    setFilteredCustomers(updatedFilteredCustomers); // Update the filtered customers
  }, [searchQuery, devices]);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentCustomerId(null);

    // Reset form data and errors when closing modal
    setFormData({
        device_name: '',
        device_code: '',
        description: '',
        status: '',
    });
    useDeviceStore.setState({ formErrors: {} });
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
      if (isEditMode && currentCustomerId) {
        // Update existing customer
        console.log("Updating device with ID:", currentCustomerId);
        console.log("Form data:", formData);
        success = await editDevices(currentCustomerId, formData);
      } else {
        // Add new customer
        console.log("Adding new device");
        success = await addDevice();
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
 
    const exportJsonToExcel = async (jsonData, fileName = 'data.xlsx') => {
     const workbook = new ExcelJS.Workbook();
     const worksheet = workbook.addWorksheet('Sheet 1');
   
     const dataArray = Array.isArray(devices) ? devices : [devices];
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


   

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Devices Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your Devices</p>
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

        {/* Devices Table */}
        <div className="row pt-3">
          <div className="col-12">
            <DataTable
              data={filteredCustomers}
              loading={loading}
              title="Total Devices"
              searchPlaceholder="Search devices..."
              emptyMessage="No devices found. Add a new device to get started."
              itemsPerPage={customersPerPage}
              searchQuery={searchQuery}
              onSearch={handleSearchChange}
              onEdit={handleEdit}
              onDelete={(device) => {
                setCustomerToDelete(device);
                setIsDeleteModalOpen(true);
              }}
              columns={[
                {
                  header: "Device Name",
                  accessor: "device_name",
                },
                {
                  header: "Device Code",
                  accessor: "device_code",
                },
                {
                  header: "Description",
                  accessor: "description",
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
                    <span>{isEditMode ? 'Edit Device Detail' : 'Add Device Detail'}</span>
                  </h5>
                  <button style={{ color: "#fff" }} className="close" onClick={closeModal} aria-label="Close">
                    <em className="icon ni ni-cross-sm"></em>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body pt-3">
                    {useDeviceStore.getState().error && (
                      <div className="alert alert-danger">
                        {useDeviceStore.getState().error}
                      </div>
                    )}
                    
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Device Name</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="device_name"
                              className={`form-control form-control-lg ${formErrors.device_name ? 'is-invalid' : ''}`}
                              placeholder="Enter device_name"
                              value={formData.device_name}
                              onChange={handleInputChange}
                            />
                            {formErrors.device_name && (
                              <div className="invalid-feedback">{formErrors.device_name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Device Code</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="device_code"
                              className={`form-control form-control-lg ${formErrors.device_code ? 'is-invalid' : ''}`}
                              placeholder="Enter device_code"
                              value={formData.device_code}
                              onChange={handleInputChange}
                            />
                            {formErrors.device_code && (
                              <div className="invalid-feedback">{formErrors.device_code}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
  <div className="form-group mt-1">
    <label className="form-label"><span>Description</span></label>
    <div className="form-control-wrap">
      <textarea
        name="description"
        className={`form-control form-control-lg ${formErrors.description ? 'is-invalid' : ''}`}
        placeholder="Enter description"
        value={formData.description}
        onChange={handleInputChange}
      />
      {formErrors.description && (
        <div className="invalid-feedback">{formErrors.description}</div>
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
                              <option value="Active">InActive</option>
                            </select>
                            {formErrors.status && (
                              <div className="invalid-feedback">{formErrors.status}</div>
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
                            <span>{isEditMode ? 'Update Device' : 'Save Device'}</span>
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