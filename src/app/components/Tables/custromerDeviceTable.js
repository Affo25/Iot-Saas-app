import React, { useState, useEffect } from 'react';
import Pagination from "./Pagination";

const CustomerDeviceTable = ({
  customerDevices = [],
  loading = false,
  error = null,
  itemsPerPage = 5,
  searchPlaceholder = 'Search devices...',
  onEdit,
  onDelete,
  showActions = true,
  customerName = null
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [filteredData, setFilteredData] = useState(customerDevices);
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(Array.isArray(customerDevices) ? customerDevices : []);
      setCurrentPage(0);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const updatedFilteredData = (customerDevices || []).filter((item) => {
      return Object.values(item).some(value =>
        value && value.toString().toLowerCase().includes(query)
      );
    });

    setFilteredData(updatedFilteredData);
    setCurrentPage(0);
  }, [searchQuery, customerDevices]);

  useEffect(() => {
    setFilteredData(customerDevices);
    const newPageCount = Math.ceil((customerDevices || []).length / itemsPerPage);
    if (currentPage >= newPageCount && newPageCount > 0) {
      setCurrentPage(0);
    }
  }, [customerDevices, currentPage, itemsPerPage]);

  const offset = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    const maxPage = Math.max(0, pageCount - 1);
    const validPage = Math.max(0, Math.min(page, maxPage));
    setCurrentPage(validPage);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleAll = () => {
    if (selected.length === currentItems.length) {
      setSelected([]);
    } else {
      setSelected(currentItems.map((item) => item._id));
    }
  };

  const toggleItem = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl w-full h-auto border border-gray-400">
      {/* Outer Card Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
        <h4 style={{ padding: "11px 30px", marginBottom: "0px", fontSize: "20px", marginTop: "10px" }} className="text-xl font-bold text-gray-900">
          Customer Devices
        </h4>
      </div>

      {/* Inner Table Card */}
      <div style={{ margin: "20px" }} className="rounded-xl p-4 border border-gray-400">
        <div className="row mb-2">
          <div style={{ padding: "20px" }} className="col-md-12 border-b border-gray-200">
            <div className="d-flex justify-content-between align-items-center">
              {/* Left side text */}
              <h5 className="mb-0 font-bold">
                Total Devices: <span className='badge badge-warning'>{filteredData.length}</span>
              </h5>

              {/* Right side search and button */}
              <div className="d-flex align-items-center gap-2">
                <div style={{ position: 'relative', width: '250px' }}>
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="form-control"
                    style={{ paddingLeft: '35px', borderRadius: '10px', height: '40px' }}
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '10px',
                      transform: 'translateY(-50%)',
                      color: '#999',
                      pointerEvents: 'none',
                    }}
                  >
                    <i className='ni ni-search'></i>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-lg btn-light ml-1"
                >
                  <i className='ni ni-filter font-15'>
                    <span style={{ fontSize: "15px", fontWeight: "bold", fontFamily: "sans-serif" }}>Filter</span>
                  </i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800 bg-white">
            <thead style={{ borderBottom: "1px solid #F0F0F0" }} className="text-gray-600 uppercase text-xs border-b">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    className="w-5 h-5 appearance-none border border-gray-300 rounded-md checked:bg-blue-500 checked:border-transparent focus:outline-none"
                    type="checkbox"
                    checked={selected.length === currentItems.length && currentItems.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ minWidth: '280px' }}>Device Information</th>
                <th className="px-4 py-3 text-left font-semibold">Input 1</th>
                <th className="px-4 py-3 text-left font-semibold">Input 2</th>
                <th className="px-4 py-3 text-left font-semibold">Input 3</th>
                <th className="px-4 py-3 text-left font-semibold">Input 4</th>
                <th className="px-4 py-3 text-left font-semibold">Output 1</th>
                <th className="px-4 py-3 text-left font-semibold">Output 2</th>
                <th className="px-4 py-3 text-left font-semibold">Output 3</th>
                <th className="px-4 py-3 text-left font-semibold">Output 4</th>
                {/* <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Created At</th> */}
                {showActions && (
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                )}
              </tr>
            </thead>

            <tbody style={{ borderBottom: "1px solid #F0F0F0" }}>
              {loading ? (
                <tr>
                  <td colSpan={showActions ? 11 : 10} className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-t-2 border-indigo-500 rounded-full mx-auto" />
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 11 : 10} className="text-center py-4 text-gray-400">
                    {searchQuery
                      ? `No records found matching "${searchQuery}". Try different keywords.`
                      : 'No devices found.'
                    }
                  </td>
                </tr>
              ) : (
                currentItems.map((device, index) => (
                  <tr style={{ borderBottom: "1px solid #F0F0F0" }} key={device._id || index} className="border-b border-gray-600">
                    <td className="px-4 py-3">
                      <input
                        className="w-5 h-5 appearance-none border border-gray-300 rounded-md checked:bg-blue-600 checked:border-transparent focus:outline-none"
                        type="checkbox"
                        checked={selected.includes(device._id)}
                        onChange={() => toggleItem(device._id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium"><span className='badge badge-info'>{offset + index + 1}</span></td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center" style={{ minWidth: '280px' }}>
                        {/* Device Image Circle */}
                        <div className="flex-shrink-0 mr-3">
                          <div
                            className="rounded-full d-flex align-items-center justify-content-center"
                            style={{
                              width: '48px',
                              height: '48px',
                              minWidth: '48px',
                              minHeight: '48px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }}
                          >
                            <span style={{ color: "white", fontWeight: "bolder" }}> {device.title?.toUpperCase().charAt(0) || 'U'}</span>
                          </div>
                        </div>

                        {/* Device Info */}
                        <div className="flex-grow-1">
                          <div className="font-weight-bold text-dark" style={{ fontSize: '14px', lineHeight: '1.3', marginBottom: '4px' }}>
                            {device.title || 'Untitled Device'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6c757d', lineHeight: '1.2' }}>
                            <div style={{ marginBottom: '2px' }}>
                              <span className="font-weight-medium">Code:</span>
                              <span style={{ color: '#495057', fontWeight: '500' }}> {device.device_code || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-weight-medium">Serial:</span>
                              <span style={{ color: '#495057', fontWeight: '500' }}> {device.device_serial_number || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{device.inp1 || '-'}</td>
                    <td className="px-4 py-3">{device.inp2 || '-'}</td>
                    <td className="px-4 py-3">{device.inp3 || '-'}</td>
                    <td className="px-4 py-3">{device.inp4 || '-'}</td>
                    <td className="px-4 py-3">
                      <button className={`btn btn-sm  ${device.outp1 === 'on' ? 'btn-info' : 'btn-danger'}`}>
                         <i className={`ni ${device.outp1 === 'on' ? 'ni-power' : 'ni-cross'} text-lg text-white`}></i>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button className={`btn btn-sm ${device.outp2 === 'on' ? 'btn-info' : 'btn-danger'}`}>
                         <i className={`ni ${device.outp2 === 'on' ? 'ni-power' : 'ni-cross'} text-lg text-white`}></i>
                        {/* {device.outp2 || '-'} */}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button className={`btn btn-sm ${device.outp3 === 'on' ? 'btn-info' : 'btn-danger'}`}>
                        <i className={`ni ${device.outp3 === 'on' ? 'ni-power' : 'ni-cross'} text-lg text-white`}></i>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button className={`btn btn-sm ${device.outp4 === 'on' ? 'btn-info' : 'btn-danger'}`}>
                         <i className={`ni ${device.outp4 === 'on' ? 'ni-power' : 'ni-cross'} text-lg text-white`}></i>
                      </button>
                    </td>

                    {/* <td className="px-4 py-3">
                      {device.status === 1 ? (
                        <span className="text-green-600 font-semibold">Active</span>
                      ) : (
                        <span className="text-red-500">Inactive</span>
                      )}
                    </td> */}
                    {/* <td className="px-4 py-3">
                      {new Date(device.created_at).toLocaleString()}
                    </td> */}
                    {showActions && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="btn btn-md btn-warning ml-1"
                          onClick={() => onEdit?.(device)}
                        >
                          <i className='ni ni-pen-fill'></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-md btn-danger ml-1"
                          onClick={() => onDelete?.(device)}
                        >
                          <i className='ni ni-trash'></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDeviceTable;
