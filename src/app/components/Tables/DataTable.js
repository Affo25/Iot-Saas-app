'use client';

import React, { useState, useEffect } from 'react';
import ReactPaginate from 'react-paginate';
import Pagination from "../../components/Tables/Pagination";
import { useRouter } from 'next/navigation';

function DataTable({
  data = [],
  columns = [],
  loading = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found.',
  itemsPerPage = 5,
  title = 'Recent Orders',
  onSearch,
  text,
  buttonShow = false,
  searchQuery = '',
  onEdit,
  onDelete,
  onBulkDelete, // New prop for bulk delete
  tableName = '', // New prop for table name
  showActions = true,
  searchableFields = [], // New prop to define which fields to search
  showInfoColumn = true, // New prop to control Info column visibility
  infoConfig = { // New prop to configure Info column content
    primaryField: 'full_name', // Primary field to display (e.g., 'title' for CustomerDevice)
    secondaryField: 'email', // Secondary field to display (e.g., 'device_code' for CustomerDevice)
    avatarField: 'full_name', // Field to use for avatar letter
    primaryFallback: 'N/A',
    secondaryFallback: 'No email provided'
  }
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [filteredData, setFilteredData] = useState(data);
  const [selected, setSelected] = useState([]);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');


   const router = useRouter();

const handleNavigate = (item) => {
  // Check for different possible ID fields
  const customerId = item._id;
  console.log("selected item id", customerId);
  
  if (!customerId) {
    console.error("No customer ID found in item:", item);
    return;
  }
  
  // Fix: Use customer_id parameter instead of id
  router.push(`/Pages/admincustomerDevices?customer_id=${customerId}`);
};

  // Filter data based on search query
  useEffect(() => {
    if (!internalSearchQuery.trim()) {
      setFilteredData(Array.isArray(data) ? data : []);
      setCurrentPage(0);
      return;
    }

    const query = internalSearchQuery.toLowerCase().trim();
    const updatedFilteredData = (data || []).filter((item) => {
      // If searchableFields are provided, use them; otherwise search all fields
      const fieldsToSearch = searchableFields.length > 0 ? searchableFields : Object.keys(item);
      
      return fieldsToSearch.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(query);
      });
    });
    
    setFilteredData(updatedFilteredData);
    setCurrentPage(0);
  }, [internalSearchQuery, data, searchableFields]);

  useEffect(() => {
    setFilteredData(data);
    // Only reset page if the current page would be out of bounds
    const newPageCount = Math.ceil((data || []).length / itemsPerPage);
    console.log('Data changed:', { dataLength: (data || []).length, currentPage, newPageCount });
    if (currentPage >= newPageCount && newPageCount > 0) {
      console.log('Resetting page to 0 due to out of bounds');
      setCurrentPage(0);
    }
  }, [data, currentPage, itemsPerPage]);

  const offset = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageClick = (selected) => {
    setCurrentPage(selected.selected);
  };

  const handlePageChange = (page) => {
    // Ensure the page is within valid bounds
    const maxPage = Math.max(0, pageCount - 1);
    const validPage = Math.max(0, Math.min(page, maxPage));
    console.log('Page change:', { currentPage, newPage: page, validPage, pageCount, dataLength: filteredData.length });
    setCurrentPage(validPage);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setInternalSearchQuery(value);
    if (onSearch) onSearch(e); // Keep backward compatibility
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

  const handleBulkDelete = () => {
    if (selected.length > 0 && onBulkDelete) {
      onBulkDelete(selected, tableName);
      setSelected([]); // Clear selection after delete
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl w-full h-auto  border border-gray-400">
      {/* Outer Card Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
        <h2 style={{ padding: "11px 30px", marginBottom: "0px", fontSize: "20px", marginTop: "10px" }} className="text-xl font-bold text-gray-900">{title}</h2>

      </div>

      {/* Inner Table Card */}
      <div style={{ margin: "20px" }} className=" rounded-xl p-4 border border-gray-400">
        <div className="row mb-2">
          <div style={{ padding: "20px" }} className="col-md-12 border-b border-gray-200 ">
            <div className="d-flex justify-content-between align-items-center">
              {/* Left side text and bulk delete button */}
              <div className="d-flex align-items-center gap-3">
                <h5 className="mb-0 font-bold"> {text}: <span className='badge badge-warning'>{filteredData.length}</span></h5>
                {selected.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={handleBulkDelete}
                    title={`Delete ${selected.length} selected items`}
                  >
                    <i className='ni ni-trash'></i> Delete ({selected.length})
                  </button>
                )}
              </div>

              {/* Right side search and button */}
              <div className="d-flex align-items-center gap-2">
                <div style={{ position: 'relative', width: '250px' }}>
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="form-control"
                    style={{ paddingLeft: '35px', borderRadius: '10px', height: '40px' }}
                    value={internalSearchQuery}
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
                  <i className='ni ni-filter font-15'><span style={{fontSize:"15px",fontWeight:"bold",fontFamily:"sans-serif"}}>Filter</span></i>
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
                    className="w-5 h-5 appearance-none border border-gray-300 rounded-md checked:bg-red-500 checked:border-transparent focus:outline-none relative"
                    type="checkbox"
                    checked={
                      selected.length === currentItems.length && currentItems.length > 0
                    }
                    onChange={toggleAll}
                    style={{
                      backgroundImage: selected.length === currentItems.length && currentItems.length > 0 
                        ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e\")"
                        : 'none',
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                </th>
                {/* Combined User Info Header - Conditionally rendered */}
                {showInfoColumn && (
                  <th className="px-4 py-3 text-left font-semibold">
                     Info
                  </th>
                )}

                {/* Other column headers (excluding configured info fields) */}
                {columns.filter(column => {
                  const excludeFields = showInfoColumn 
                    ? ['full_name', 'name', 'email', 'image', 'avatar', infoConfig.primaryField, infoConfig.secondaryField, infoConfig.avatarField]
                    : [];
                  return !excludeFields.includes(column.accessor);
                }).map((column, index) => (
                  <th key={index} className="px-4 py-3 text-left font-semibold">
                    {column.header}
                  </th>
                ))}
                {showActions && (
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                )}
              </tr>
            </thead>

            <tbody style={{ borderBottom: "1px solid #F0F0F0" }}>
              {loading ? (
                <tr>
                  <td colSpan={
                    columns.filter(column => {
                      const excludeFields = showInfoColumn 
                        ? ['full_name', 'name', 'email', 'image', 'avatar', infoConfig.primaryField, infoConfig.secondaryField, infoConfig.avatarField]
                        : [];
                      return !excludeFields.includes(column.accessor);
                    }).length + (showInfoColumn ? 1 : 0) + (showActions ? 1 : 0) + 1
                  } className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-t-2 border-indigo-500 rounded-full mx-auto" />
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.filter(column => {
                        const excludeFields = showInfoColumn 
                          ? ['full_name', 'name', 'email', 'image', 'avatar', infoConfig.primaryField, infoConfig.secondaryField, infoConfig.avatarField]
                          : [];
                        return !excludeFields.includes(column.accessor);
                      }).length + (showInfoColumn ? 1 : 0) + (showActions ? 1 : 0) + 1
                    }
                    className="text-center py-4 text-gray-400"
                  >
                    {internalSearchQuery 
                      ? `No records found matching "${internalSearchQuery}". Try different keywords.`
                      : emptyMessage
                    }
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr style={{ borderBottom: "1px solid #F0F0F0" }}
                    key={item._id || index}
                    className="border-b border-gray-600"
                  >
                    <td className="px-4 py-3">
                      <input
                        className="w-5 h-5 appearance-none border border-gray-300 rounded-md checked:bg-red-500 checked:border-transparent focus:outline-none relative"
                        type="checkbox"
                        checked={selected.includes(item._id)}
                        onChange={() => toggleItem(item._id)}
                        style={{
                          backgroundImage: selected.includes(item._id)
                            ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e\")"
                            : 'none',
                          backgroundSize: '100% 100%',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    </td>
                    {/* Combined User Info Cell - Conditionally rendered */}
                    {showInfoColumn && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* User Avatar with First Letter */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                              {(item[infoConfig.avatarField] || item[infoConfig.primaryField] || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>

                          {/* User Details */}
                          <div className="flex-grow min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {item[infoConfig.primaryField] || infoConfig.primaryFallback}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {item[infoConfig.secondaryField] || infoConfig.secondaryFallback}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Other columns (excluding configured info fields) */}
                    {columns.filter(column => {
                      const excludeFields = showInfoColumn 
                        ? ['full_name', 'name', 'email', 'image', 'avatar', infoConfig.primaryField, infoConfig.secondaryField, infoConfig.avatarField]
                        : [];
                      return !excludeFields.includes(column.accessor);
                    }).map((column, colIndex) => (
                      <td key={colIndex} className="px-4 py-3">
                        {column.render ? column.render(item[column.accessor], item) : item[column.accessor]}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-4 py-3">
                         
                        <button
                          type="button"
                          className="btn btn-md btn-warning ml-1"
                          onClick={() => onEdit?.(item)}
                        >
                          <i className='ni ni-pen-fill'></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-md btn-danger ml-1"
                          onClick={() => onDelete?.(item)}
                        >
                          <i className='ni ni-trash'></i>
                        </button>
                        {buttonShow===true?(
                            <button
                          type="button"
                          className="btn btn-md btn-info ml-1"
                          onClick={()=>handleNavigate?.(item)}
                        >
                           <i className='ni ni-wifi'></i>
                        </button>
                        ):null}
                       
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
}

export default DataTable;

