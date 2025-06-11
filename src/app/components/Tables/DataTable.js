"use client";
import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";

/**
 * Reusable DataTable component
 * @param {Object} props - Component props
 * @param {Array} props.data - Data to display in the table
 * @param {Array} props.columns - Column definitions
 * @param {boolean} props.loading - Loading state
 * @param {string} props.searchPlaceholder - Placeholder for search input
 * @param {string} props.emptyMessage - Message to display when no data
 * @param {number} props.itemsPerPage - Number of items per page
 * @param {string} props.title - Table title
 * @param {Function} props.onSearch - Function to handle search
 * @param {string} props.searchQuery - Search query state
 * @param {Function} props.onEdit - Function to handle edit action
 * @param {Function} props.onDelete - Function to handle delete action
 * @param {boolean} props.showActions - Whether to show action buttons
 */
function DataTable({
  data = [],
  columns = [],
  loading = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found.",
  itemsPerPage = 5,
  title = "Data",
  onSearch,
  searchQuery = "",
  onEdit,
  onDelete,
  showActions = true,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const offset = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageClick = (selected) => {
    setCurrentPage(selected.selected);
  };

  const handleSearchChange = (e) => {
    if (onSearch) {
      onSearch(e);
    }
  };

  return (
    <div className="card card-bordered card-preview">
      <div className="card-inner-group">
        <div className="card-inner">
          <div className="card-title-group">
            <div className="card-title">
              <h5 className="title">
                {title}
                <span className="badge badge-info ml-2">{filteredData.length}</span>
              </h5>
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
        <div className="card-inner p-0 table-responsive">
          <table className="table table-hover nowrap align-middle dataTable-init">
            <thead style={{ fontSize: "14px", fontWeight: 'bold' }} className="tb-tnx-head">
              <tr>
                <th scope="col">#</th>
                {columns.map((column, index) => (
                  <th key={index}>{column.header}</th>
                ))}
                {showActions && <th scope="col">Action</th>}
              </tr>
            </thead>
            <tbody style={{ fontFamily: "Segoe UI" }} className="tb-tnx-body">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (showActions ? 2 : 1)} className="text-center">
                    <span className="spinner-border text-secondary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (showActions ? 2 : 1)} className="text-center">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={item._id || index}>
                    <td><b>{offset + index + 1}</b></td>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex}>
                        {column.render ? column.render(item) : item[column.accessor]}
                      </td>
                    ))}
                    {showActions && (
                      <td className="text-center">
                        {onDelete && (
                          <button className="btn btn-danger btn-md ml-3" onClick={() => onDelete(item)}>
                            <i className="ni ni-trash-alt"></i>
                          </button>
                        )}
                        {onEdit && (
                          <button className="btn btn-primary btn-md ml-1" onClick={() => onEdit(item)}>
                           <i className="ni ni-edit-fill"></i>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {pageCount > 1 && (
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              pageCount={pageCount}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default DataTable;