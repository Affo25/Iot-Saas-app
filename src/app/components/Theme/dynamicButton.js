import React from 'react'

function ThemeButton({ onClick, text, icon,color }) {
  return (
    <button
    style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
       onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = 'none';
                              }}
      type="button"
     className={`btn ${color} btn-md ml-1`}
      onClick={onClick}
    >
     
      <i style={{ fontSize: '20px' }} className={`ni ${icon}`}></i> 
       <span style={{marginRight:'5px',marginLeft:'3px'}}>{text}</span>
    </button>
  )
}

export default ThemeButton;
