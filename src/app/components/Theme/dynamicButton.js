import React from 'react'

function ThemeButton({ onClick, text, icon,color }) {
  return (
    <button
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
