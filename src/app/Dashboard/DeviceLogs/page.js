"use client";

import React, { useState, useEffect } from "react";
import 'react-datepicker/dist/react-datepicker.css';
import useDeviceLogsStore from '../../store/DeviceLogStore';
import ReactPaginate from "react-paginate";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


function Page() {
  const {
    deviceLogs,
    loading,
    formData,
    formErrors,
    setFormData,
    setMetaData,
    validateForm,
    addDeviceLog,
    updateDeviceLog,
    fetchDeviceLogs,
    deleteDeviceLog
  } = useDeviceLogsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState(deviceLogs); // Track filtered customers
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLogId, setCurrentLogId] = useState(null);
  const [logToDelete, setLogToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");  // State to hold the search query
  const [currentPage, setCurrentPage] = useState(0);
  const [metaString, setMetaString] = useState('{}');
  const customersPerPage = 5;
  const [filteredLogs, setFilteredLogs] = useState(deviceLogs); // Track filtered logs
  const [deviceCodeFilter, setDeviceCodeFilter] = useState("");

  console.log("Filtered Logs:", filteredLogs);
  const logsList = Array.isArray(filteredLogs) ? filteredLogs : [];

  const offset = currentPage * customersPerPage;
  const currentLogs = filteredLogs.slice(offset, offset + customersPerPage);

  const handlePageClick = (selected) => {
    setCurrentPage(selected.selected);
  };

  const handleSearchChange = (e) => {
    console.log(e.target.value);
    setSearchQuery(e.target.value); // Update search query state
  };



  const handleDelete = async (logId) => {
    try {
      // Call deleteDeviceLog function from Zustand store
      const success = await deleteDeviceLog(logId);
      if (success) {
        setCloseDeleteModal();
        console.log('Device log deleted successfully');
      } else {
        console.error('Failed to delete device log');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };





  useEffect(() => {
    // Fetch device logs on component mount
    fetchDeviceLogs();
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

  // Effect to update filtered logs whenever searchQuery changes
  useEffect(() => {
    const query = searchQuery.toLowerCase(); // Lowercase search query
    const updatedFilteredLogs = deviceLogs.filter((log) => {
      return (
        (log.device_code?.toLowerCase().includes(query) ?? false) ||
        (String(log.temperature)?.includes(query) ?? false) ||
        (String(log.humidity)?.includes(query) ?? false) ||
        (JSON.stringify(log.meta)?.toLowerCase().includes(query) ?? false)
      );
    });
    console.log("Updated Filtered Logs:", updatedFilteredLogs);
    setFilteredLogs(updatedFilteredLogs); // Update the filtered logs
  }, [searchQuery, deviceLogs]);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentLogId(null);

    // Reset form data and errors when closing modal
    setFormData({
      device_code: '',
      humidity: 0,
      temperature: 0,
      meta: {}
    });

    // Reset meta string
    setMetaString('{}');

    // Clear form errors
    useDeviceLogsStore.setState({ formErrors: {} });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
  };

  // Handle meta data changes
  const handleMetaChange = (e) => {
    setMetaString(e.target.value);
    try {
      const parsedMeta = JSON.parse(e.target.value);
      setMetaData(parsedMeta);
    } catch (error) {
      // Don't update the form data if JSON is invalid
      console.error("Invalid JSON:", error);
    }
  };



  const handleDateChange = (date) => {
    setFormData({ package_expiry: date });
  };

  const handleEdit = (deviceLog) => {
    console.log("Editing device log:", deviceLog);

    // Set formData with device log info
    setFormData({
      device_code: deviceLog.device_code || '',
      humidity: deviceLog.humidity || 0,
      temperature: deviceLog.temperature || 0,
      meta: deviceLog.meta || {}
    });

    // Convert meta object to string for editing
    setMetaString(JSON.stringify(deviceLog.meta || {}, null, 2));

    // Set edit mode and current log ID
    setIsEditMode(true);
    setCurrentLogId(deviceLog._id);

    // Open the modal
    setIsModalOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 Calling submit");
  
    // Ensure you are using the zustand store correctly
    const isValid = validateForm(); // This should be imported from the store
    if (!isValid) return;
  
    try {
      let metaObject = {};
  
      // Check and parse the meta string
      if (typeof formData.meta === 'string') {
        try {
          metaObject = JSON.parse(formData.meta);
          console.log("✅ Meta object parsed:", metaObject);
        } catch (err) {
          console.error("❌ Invalid JSON in meta data:", err);
          setFormErrors((prev) => ({
            ...prev,
            meta: "Invalid JSON format"
          }));
          return;
        }
      } else {
        metaObject = formData.meta;
      }
  
      const updatedFormData = {
        ...formData,
        meta: metaObject,
        humidity: Number(formData.humidity),
        temperature: Number(formData.temperature)
      };
  
      console.log("🚀 Form data to submit:", updatedFormData);
  
      let success = false;
      if (isEditMode && currentLogId) {
        console.log("🛠 Updating device log with ID:", currentLogId);
        success = await updateDeviceLog(currentLogId, updatedFormData);
      } else {
        console.log("➕ Adding new device log");
        success = await addDeviceLog(updatedFormData);
      }
  
      if (success) {
        console.log("🎉 Operation successful");
        closeModal();
        fetchDeviceLogs();
      } else {
        console.error("⚠️ Operation failed");
      }
    } catch (error) {
      console.error("🚨 Error in handleSubmit:", error);
    }
  };
  
  


   const exportJsonToExcel = async (jsonData, fileName = 'device_data.xlsx') => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet 1');
    
      const dataArray = Array.isArray(deviceLogs) ? deviceLogs : [deviceLogs];
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
            <div className="card card-bordered card-preview">
              <div className="card-inner-group">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h5 className="title">
                        Total Devices Logs
                        <span className="badge badge-info ml-2">
                          {deviceLogs.length}
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
                        <th  scope="col">Action</th>
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
                      ) : filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center">
                            No device log found. Add a new customer to get started.
                          </td>
                        </tr>
                      ) : currentLogs.map((deviceLogs, index) => (
                        <tr key={deviceLogs._id}>
                          <td><b>{index + 1}</b></td>
                          <td>
                            <span
                              className={`badge badge-warning`}>
                              {deviceLogs.device_code}
                            </span>
                          </td>
                          <td>{deviceLogs.humidity}</td>
                          <td>{deviceLogs.temperature}</td>
                          <td>{deviceLogs.meta['Device_code']}{deviceLogs.meta['room_temp']}</td>
                          <td className="text-center">
                            <button className="btn btn-danger btn btn-sm ml-3" onClick={() => {
                              setCustomerToDelete(deviceLogs);
                              setIsDeleteModalOpen(true);
                            }}>
                              <span>Delete</span>
                            </button>
                            <button className="btn btn-primary btn btn-sm ml-1" onClick={() => handleEdit(deviceLogs)}>
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
                    {useDeviceLogsStore.getState().error && (
                      <div className="alert alert-danger">
                        {useDeviceLogsStore.getState().error}
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
                              onChange={handleInputChange}
                            />
                            {formErrors.humidity && (
                              <div className="invalid-feedback">{formErrors.humidity}</div>
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
                          <label className="form-label"><span>Temperature</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="temperature"
                              className={`form-control form-control-lg ${formErrors.temperature ? 'is-invalid' : ''}`}
                              placeholder="Enter temperture"
                              value={formData.temperature || ""}
                              onChange={handleInputChange}
                            />
                            {formErrors.temperature && (
                              <div className="invalid-feedback">{formErrors.temperature}</div>
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
                              value={formData.meta}
                              onChange={handleInputChange}
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
                    {useDeviceLogsStore.getState().error && (
                      <div className="alert alert-danger">
                        {useDeviceLogsStore.getState().error}
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