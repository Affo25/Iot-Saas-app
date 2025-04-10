'use client';

import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import useUserRoleStore from '../../app/store/userRoleStore';

export default function Headers() {
  const router = useRouter();
  const setRole = useUserRoleStore((state) => state.setRole);

  // Dynamically import Bootstrap JS on client only
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  const handleRedirect = () => {
    router.push('/Auth/Login'); // Redirects to login
  };

  const handleRoleClick = (role) => {
    setRole(role); // Save role to global store
    console.log("Selected Role:", role);
  };

  return (
    <div className="nk-header is-light">
      <div className="container-fluid">
        <div className="nk-header-wrap">
          <div className="nk-header-tools">
            <ul className="nk-quick-nav">
              <li className="dropdown user-dropdown">
                <button
                  className="dropdown-toggle btn btn-clean"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ background: 'transparent', border: 'none' }}
                >
                  <div className="user-toggle">
                    <div className="user-avatar sm">
                      <em className="icon ni ni-user-alt"></em>
                    </div>
                    <div className="user-info d-none d-md-block">
                      Admin
                    </div>
                  </div>
                </button>

                <ul className="dropdown-menu dropdown-menu-md dropdown-menu-end dropdown-menu-s1 show">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleRoleClick('Admin')}
                    >
                      <em className="icon ni ni-user mr-2"></em>
                      <span style={{ color: '#007bff' ,fontSize:"14px" ,fontWeight:"bold",fontFamily:"Roboto" }}>Admin</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleRoleClick('Customer')}
                    >
                      <em className="icon ni ni-users mr-2"></em>
                      <span style={{ color: '#007bff' ,fontSize:"14px" ,fontWeight:"bold",fontFamily:"Roboto"}}>Customer</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleRedirect}
                    >
                      <em className="icon ni ni-signout mr-2 "></em>
                      <span style={{ color: '#007bff' ,fontSize:"14px" ,fontWeight:"bold",fontFamily:"Roboto" }}>Login</span>
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
