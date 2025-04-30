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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLogId, setCurrentLogId] = useState(null);
  const [logToDelete, setLogToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [metaString, setMetaString] = useState('{}');
  const customersPerPage = 5;
  const [filteredLogs, setFilteredLogs] = useState(deviceLogs);

  const offset = currentPage * customersPerPage;
  const currentLogs = filteredLogs.slice(offset, offset + customersPerPage);

  const handlePageClick = (selected) => {
    setCurrentPage(selected.selected);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDelete = async (logId) => {
    try {
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
  
    fetchDeviceLogs();
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const setCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setLogToDelete(null);
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const updatedFilteredLogs = deviceLogs.filter((log) => {
      return (
        (log.device_code?.toLowerCase().includes(query) ?? false) ||
        (String(log.temperature)?.includes(query) ?? false) ||
        (String(log.humidity)?.includes(query) ?? false) ||
        (JSON.stringify(log.meta)?.toLowerCase().includes(query) ?? false)
      );
    });
    setFilteredLogs(updatedFilteredLogs);
  }, [searchQuery, deviceLogs]);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentLogId(null);
    setFormData({ device_code: '', humidity: 0, temperature: 0, meta: {} });
    setMetaString('{}');
    useDeviceLogsStore.setState({ formErrors: {} });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
  };

  const handleMetaChange = (e) => {
    setMetaString(e.target.value);
    try {
      const parsedMeta = JSON.parse(e.target.value);
      setMetaData(parsedMeta);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  const handleEdit = (deviceLog) => {
    setFormData({
      device_code: deviceLog.device_code || '',
      humidity: deviceLog.humidity || 0,
      temperature: deviceLog.temperature || 0,
      meta: deviceLog.meta || {}
    });
    setMetaString(JSON.stringify(deviceLog.meta || {}, null, 2));
    setIsEditMode(true);
    setCurrentLogId(deviceLog._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;

    try {
      let metaObject = {};
      if (typeof formData.meta === 'string') {
        try {
          metaObject = JSON.parse(formData.meta);
        } catch (err) {
          console.error("Invalid JSON in meta data:", err);
          setFormErrors((prev) => ({ ...prev, meta: "Invalid JSON format" }));
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

      let success = false;
      if (isEditMode && currentLogId) {
        success = await updateDeviceLog(currentLogId, updatedFormData);
      } else {
        success = await addDeviceLog(updatedFormData);
      }

      if (success) {
        closeModal();
        fetchDeviceLogs();
      } else {
        console.error("Operation failed");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
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
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Device Reports Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your Devices Reports</p>
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
                <button type="button" className="btn btn-primary ml-1" onClick={openModal}>
                  <span>Add New</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="row pt-3">
          <div className="col-12">
            <div className="card card-bordered card-preview">
              <div className="card-inner-group">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h5 className="title">
                        Total Devices Report
                        <span className="badge badge-info ml-2">{deviceLogs.length}</span>
                      </h5>
                    </div>
                    <div className="col-md-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="card-inner p-0 table-responsive">
                  <table className="table table-hover nowrap align-middle dataTable-init">
                    <thead style={{ fontSize: "14px", fontWeight: 'bold' }} className="tb-tnx-head" id="datatable-default_wrapper">
                      <tr>
                        <th scope="col">#</th>
                        <th>Device Code</th>
                        <th>Humidity</th>
                        <th>Temperature</th>
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
                      ) : filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center">
                            No device log found. Add a new customer to get started.
                          </td>
                        </tr>
                      ) : currentLogs.map((deviceLog, index) => (
                        <tr key={deviceLog._id}>
                          <td><b>{index + 1}</b></td>
                          <td>
                            <span className={`badge badge-warning`}>{deviceLog.device_code}</span>
                          </td>
                          <td>{deviceLog.humidity}</td>
                          <td>{deviceLog.temperature}</td>
                          <td>{JSON.stringify(deviceLog.meta)}</td>
                          <td className="text-center">
                            <button className="btn btn-danger btn-sm ml-3" onClick={() => { setLogToDelete(deviceLog); setIsDeleteModalOpen(true); }}>
                              <span>Delete</span>
                            </button>
                            <button className="btn btn-primary btn-sm ml-1" onClick={() => handleEdit(deviceLog)}>
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ReactPaginate
                    previousLabel={"Previous"}
                    nextLabel={"Next"}
                    pageCount={Math.ceil(filteredLogs.length / customersPerPage)}
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
        {isModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>{isEditMode ? 'Edit Device Logs Detail' : 'Add Device Logs Detail'}</span>
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
                              placeholder="Enter temperature"
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
                              value={metaString}
                              onChange={handleMetaChange}
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
        {isDeleteModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-sm" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>Delete Confirmation</span>
                  </h5>
                </div>
                <div className="modal-body pt-3">
                  <h5>Do you want to delete this log?</h5>
                  <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                    <div className="col-md-12"></div>
                    <div className="col-md-9 text-right pt-2">
                      <ul className="list-inline mb-0">
                        <li className="list-inline-item mr-2">
                          <button
                            type="button"
                            className="btn btn-primary w-100 justify-center"
                            onClick={() => logToDelete && handleDelete(logToDelete._id)}
                            disabled={loading || !logToDelete}
                          >
                            <span>Yes</span>
                          </button>
                        </li>
                        <li className="list-inline-item">
                          <button
                            type="button"
                            className="btn btn-danger w-100 justify-center"
                            onClick={setCloseDeleteModal}
                            disabled={loading}
                          >
                            <span>No</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
