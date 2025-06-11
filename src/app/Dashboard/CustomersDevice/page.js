"use client";

import React, { useState, useEffect } from "react";
import 'react-datepicker/dist/react-datepicker.css';
import useCustomerDeviceStore from '../../store/CustomerDevice_store';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';
import Button from "../../components/Theme/button";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const customersPerPage = 5;
  const [filteredCustomers, setFilteredCustomers] = useState(CustomersDevice);
  const [formsData, setFormsData] = useState({
    selectedDevices: [],
  });

  const customersList = Array.isArray(filteredCustomers) ? filteredCustomers : [];
  const currentCustomers = CustomersDevice.slice(currentPage * customersPerPage, (currentPage * customersPerPage) + customersPerPage);

  const handleDelete = async (customer) => {
    try {
      const success = await deleteCustomerDevice(customer._id);
      if (success) {
        setCloseDeleteModal();
        console.log('Customer device deleted successfully');
      } else {
        console.error('Failed to delete customer device');
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
    const updatedFilteredCustomers = CustomersDevice.filter((customer) => {
      return (
        (customer.title?.toLowerCase().includes(query) ?? false) ||
        (customer.device_code?.toLowerCase().includes(query) ?? false) ||
        (customer.device_serial_number?.toLowerCase().includes(query) ?? false)
      );
    });
    setFilteredCustomers(updatedFilteredCustomers);
  }, [searchQuery, CustomersDevice]);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentCustomerId(null);

    setFormData({
      title: '',
      description: '',
      device_code: '',
      device_serial_number: '',
      customer_id: '',
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
    });

    setFormsData({
      selectedDevices: [],
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

  const handleEdit = (customerDevice) => {
    console.log("Editing customer device:", customerDevice);

    const selectedDevices = customerDevice.devices
      ? customerDevice.devices.map(device =>
        typeof device === 'object' ? device.device_name || device : device
      )
      : [];

    setFormData({
      title: customerDevice.title || '',
      description: customerDevice.description || '',
      device_code: customerDevice.device_code || '',
      device_serial_number: customerDevice.device_serial_number || '',
      status: customerDevice.status !== undefined ? customerDevice.status : 0,
      customer_id: customerDevice.customer_id || customer?._id || '',
      m1: customerDevice.m1 || '',
      m2: customerDevice.m2 || '',
      inp1: customerDevice.inp1 || '',
      inp2: customerDevice.inp2 || '',
      inp3: customerDevice.inp3 || '',
      inp4: customerDevice.inp4 || '',
      outp1: customerDevice.outp1 || '',
      outp2: customerDevice.outp2 || '',
      outp3: customerDevice.outp3 || '',
      outp4: customerDevice.outp4 || ''
    });

    setFormsData({
      selectedDevices: selectedDevices.includes(customerDevice.device_code)
        ? selectedDevices
        : customerDevice.device_code
          ? [...selectedDevices, customerDevice.device_code]
          : selectedDevices
    });

    setIsEditMode(true);
    setCurrentCustomerId(customerDevice._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        status: Number(formData.status) || 0,
      };
      
      if (isEditMode && currentCustomerId) {
        console.log("Updating customer with ID:", currentCustomerId);
        console.log("Updated Form Data to Submit:", updatedFormData);
        success = await updateCustomerDevice(currentCustomerId, updatedFormData);
      } else {
        console.log("Adding new customerDevice");
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

  const exportJsonToExcel = async (jsonData, fileName = 'device_data.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
  
    const dataArray = Array.isArray(customer) ? customer : [customer];
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

  const handlePageClick = (selected) => {
    setCurrentPage(selected.selected);
  };

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Customers Device Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your Customers Devices</p>
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
               <Button onClick={openModal}/>
              </li>
            </ul>
          </div>
        </div>

        {/* Customers Devices Table */}
        <div className="row pt-3">
          <div className="col-12">
            <DataTable
              data={filteredCustomers}
              loading={loading}
              title="Total Customers Devices"
              searchPlaceholder="Search customer devices..."
              emptyMessage="No customer devices found. Add a new device to get started."
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
                  header: "Title",
                  accessor: "title",
                },
                {
                  header: "Description",
                  accessor: "description",
                },
                {
                  header: "Device Code",
                  accessor: "device_code",
                  render: (item) => (
                    <span className="badge badge-warning">{item.device_code}</span>
                  ),
                },
                {
                  header: "Customer ID",
                  accessor: "customer_id",
                  render: (item) => (
                    <span className="badge badge-danger">{item.customer_id}</span>
                  ),
                },
                {
                  header: "Inputs",
                  accessor: "inputs",
                  render: (item) => (
                    <span className="badge badge-primary">
                      {item.inp1 || 0}, {item.inp2 || 0}, {item.inp3 || 0}, {item.inp4 || 0}
                    </span>
                  ),
                },
                {
                  header: "Outputs",
                  accessor: "outputs",
                  render: (item) => (
                    <span className="badge badge-success">
                      {item.outp1 || 0}, {item.outp2 || 0}, {item.outp3 || 0}, {item.outp4 || 0}
                    </span>
                  ),
                },
                {
                  header: "M1",
                  accessor: "m1",
                  render: (item) => (
                    <span className="badge badge-info">{item.m1 || 0}</span>
                  ),
                },
                {
                  header: "M2",
                  accessor: "m2",
                  render: (item) => (
                    <span className="badge badge-info">{item.m2 || 0}</span>
                  ),
                },
                {
                  header: "Device Serial No",
                  accessor: "device_serial_number",
                  render: (item) => (
                    <span className="badge badge-warning">{item.device_serial_number}</span>
                  ),
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (item) => (
                    <span className={`badge badge-${item.status === 1 ? 'success' : 'danger'}`}>
                      {item.status === 1 ? 'Active' : 'Inactive'}
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
                    <span>{isEditMode ? 'Edit Customer Device Detail' : 'Add Customer Device Detail'}</span>
                  </h5>
                  <h5 style={{ marginLeft: "20px" }} className="modal-title text-white">
                    <span className="badge badge-danger">{customer.full_name.toUpperCase()}</span>
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
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Title</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="title"
                              className={`form-control form-control-lg ${formErrors.title ? 'is-invalid' : ''}`}
                              placeholder="Enter Title"
                              value={formData.title}
                              onChange={handleInputChanges}
                            />
                            {formErrors.title && (
                              <div className="invalid-feedback">{formErrors.title}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Device Serial Number</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="device_serial_number"
                              className={`form-control form-control-lg ${formErrors.device_serial_number ? 'is-invalid' : ''}`}
                              placeholder="Enter Device Serial Number"
                              value={formData.device_serial_number || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.serial_number && (
                              <div className="invalid-feedback">{formErrors.serial_number}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>M1</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="m1"
                              className={`form-control form-control-lg ${formErrors.m1 ? 'is-invalid' : ''}`}
                              placeholder="Enter M1"
                              value={formData.m1 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.m1 && (
                              <div className="invalid-feedback">{formErrors.m1}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>M2</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="m2"
                              className={`form-control form-control-lg ${formErrors.m2 ? 'is-invalid' : ''}`}
                              placeholder="Enter M2"
                              value={formData.m2 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.m2 && (
                              <div className="invalid-feedback">{formErrors.m2}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Input1</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="inp1"
                              className={`form-control form-control-lg ${formErrors.inp1 ? 'is-invalid' : ''}`}
                              placeholder="Enter Input1"
                              value={formData.inp1 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.inp1 && (
                              <div className="invalid-feedback">{formErrors.inp1}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Input2</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="inp2"
                              className={`form-control form-control-lg ${formErrors.inp2 ? 'is-invalid' : ''}`}
                              placeholder="Enter Input2"
                              value={formData.inp2 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.inp2 && (
                              <div className="invalid-feedback">{formErrors.inp2}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Input3</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="inp3"
                              className={`form-control form-control-lg ${formErrors.inp3 ? 'is-invalid' : ''}`}
                              placeholder="Enter Input3"
                              value={formData.inp3 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.inp3 && (
                              <div className="invalid-feedback">{formErrors.inp3}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Input4</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="inp4"
                              className={`form-control form-control-lg ${formErrors.inp4 ? 'is-invalid' : ''}`}
                              placeholder="Enter Input4"
                              value={formData.inp4 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.inp4 && (
                              <div className="invalid-feedback">{formErrors.inp4}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Output1</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="outp1"
                              className={`form-control form-control-lg ${formErrors.outp1 ? 'is-invalid' : ''}`}
                              placeholder="Enter Output1"
                              value={formData.outp1 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.outp1 && (
                              <div className="invalid-feedback">{formErrors.outp1}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Output2</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="outp2"
                              className={`form-control form-control-lg ${formErrors.outp2 ? 'is-invalid' : ''}`}
                              placeholder="Enter Output2"
                              value={formData.outp2 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.outp2 && (
                              <div className="invalid-feedback">{formErrors.outp2}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Output3</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="outp3"
                              className={`form-control form-control-lg ${formErrors.outp3 ? 'is-invalid' : ''}`}
                              placeholder="Enter Output3"
                              value={formData.outp3 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.outp3 && (
                              <div className="invalid-feedback">{formErrors.outp3}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Output4</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="outp4"
                              className={`form-control form-control-lg ${formErrors.outp4 ? 'is-invalid' : ''}`}
                              placeholder="Enter Output4"
                              value={formData.outp4 || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.outp4 && (
                              <div className="invalid-feedback">{formErrors.outp4}</div>
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
                              value={formData.status || ""}
                              onChange={handleInputChanges}
                            >
                              <option value="">Select Status</option>
                              <option value="0">0</option>
                              <option value="1">1</option>
                            </select>
                            {formErrors.status && (
                              <div className="invalid-feedback">{formErrors.status}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Description</span></label>
                          <div className="form-control-wrap">
                            <textarea
                              type="text"
                              name="description"
                              className={`form-control form-control-lg ${formErrors.description ? 'is-invalid' : ''}`}
                              placeholder="Enter description"
                              value={formData.description || ""}
                              onChange={handleInputChanges}
                            />
                            {formErrors.description && (
                              <div className="invalid-feedback">{formErrors.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Select Devices</span></label>
                          <div className="form-control-wrap">
                            {/* Dynamically render device checkboxes */}
                            {customer.devices.map((device, index) => (
                              <div key={index} className="form-check"> {/* Use index as key since the devices are strings */}
                                <input
                                  type="checkbox"
                                  name="selectedDevices"
                                  value={device}
                                  className={`form-check-input ${formErrors.selectedDevices ? 'is-invalid' : ''}`}
                                  checked={(formsData.selectedDevices || []).includes(device)}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label">
                                  {device} {/* Display device name */}
                                </label>
                              </div>
                            ))}
                            {formErrors.selectedDevices && (
                              <div className="invalid-feedback">{formErrors.selectedDevices}</div>
                            )}
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
        
        {/* Delete Modal */}
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={setCloseDeleteModal}
          onConfirm={handleDelete}
          title="Delete Confirmation"
          message="Do you want to delete this customer device?"
          loading={loading}
          itemToDelete={customerToDelete}
        />
      </div>
    </div>
  );
}

export default Page;