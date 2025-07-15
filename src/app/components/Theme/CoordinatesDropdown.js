import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const CoordinatesDropdown = ({ 
  allLocations, 
  logId, 
  index 
}) => {
  const [openDropdowns, setOpenDropdowns] = useState({});

  // Toggle dropdown function
  const toggleDropdown = (dropdownId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownId]: !prev[dropdownId]
    }));
  };

  const dropdownId = `dropdown-${logId || index}`;

  return (
    <>
      {/* Show more locations indicator and dropdown */}
      {allLocations.length > 1 && (
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            id={dropdownId}
            onClick={() => toggleDropdown(dropdownId)}
            style={{ fontSize: '0.75rem', padding: '2px 8px',marginTop:"1rem" }}
            title={`View all ${allLocations.length} locations`}
          >
            +{allLocations.length - 1} more
          </button>
          
          {/* Backdrop to close dropdown when clicking outside */}
          {openDropdowns[dropdownId] && (
            <div 
              className="coordinates-modal-backdrop"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1040,
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => setOpenDropdowns({})}
            />
          )}
          
          <div 
            className={`dropdown-menu coordinates-modal ${openDropdowns[dropdownId] ? 'show' : ''}`}
            style={{ 
              minWidth: '450px', 
              maxWidth: '550px',
              maxHeight: '550px', 
              overflowY: 'auto',
              fontSize: '0.875rem',
              display: openDropdowns[dropdownId] ? 'block' : 'none',
              position: 'fixed',
              zIndex: 1050,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
              border: '1px solid #dee2e6',
              borderRadius: '0.375rem',
              backgroundColor: '#fff',
              padding: '0'
            }}
          >
            <div className="dropdown-header d-flex justify-content-between align-items-center" style={{ 
              fontSize: '0.875rem', 
              fontWeight: 'bold',
              padding: '12px 16px',
              borderBottom: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa',
              borderRadius: '0.375rem 0.375rem 0 0',
              marginBottom: '0'
            }}>
              <span>All Locations ({allLocations.length})</span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setOpenDropdowns({})}
                style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                title="Close"
              >
                <em className="icon ni ni-cross"></em>
              </button>
            </div>
            <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {allLocations.map((loc, i) => (
                <div key={i}>
                  <div className="dropdown-item-text" style={{ 
                    padding: '12px 16px',
                    border: '1px solid #e9ecef',
                    borderRadius: '0.375rem',
                    marginBottom: '8px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ flex: '1' }}>
                        <small className="text-muted d-block mb-2" style={{ fontWeight: 'bold' }}>Location {i + 1}</small>
                        <div className="d-flex gap-1 mb-2 flex-wrap">
                          <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                            Lat: {parseFloat(loc.lat).toFixed(6)}
                          </span>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                            Lng: {parseFloat(loc.lng).toFixed(6)}
                          </span>
                        </div>
                      </div>
                      <div className="btn-group" role="group" style={{ marginLeft: '8px' }}>
                        <a
                          href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          title="View on Google Maps"
                        >
                          <em className="icon ni ni-map"></em>
                        </a>
                        <button
                          className="btn btn-sm btn-outline-success"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => {
                            navigator.clipboard.writeText(`${parseFloat(loc.lat).toFixed(6)},${parseFloat(loc.lng).toFixed(6)}`);
                            toast.success('Coordinates copied!');
                          }}
                          title="Copy coordinates"
                        >
                          <em className="icon ni ni-copy"></em>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer section */}
            <div style={{ 
              padding: '12px 16px',
              borderTop: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa',
              borderRadius: '0 0 0.375rem 0.375rem'
            }}>
              <button
                className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center"
                style={{ fontSize: '0.875rem', padding: '8px 16px' }}
                onClick={() => {
                  const allCoords = allLocations.map(loc => `${parseFloat(loc.lat).toFixed(6)},${parseFloat(loc.lng).toFixed(6)}`).join('\n');
                  navigator.clipboard.writeText(allCoords);
                  toast.success('All coordinates copied!');
                  setOpenDropdowns({});
                }}
              >
                <em className="icon ni ni-copy me-2"></em> Copy All Coordinates
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CoordinatesDropdown;