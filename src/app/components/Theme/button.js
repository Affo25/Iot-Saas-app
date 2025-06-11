import React from 'react'

function Button({onClick}) {
  return (
     <button
                  type="button"
                  className="btn btn-primary ml-1"
                  onClick={onClick}
                >
                 {/* <i style={{fontSize:'20px'}} className='ni ni-plus-medi'></i> */}
                 <span>Add New</span>
                </button>
  )
}

export default Button;