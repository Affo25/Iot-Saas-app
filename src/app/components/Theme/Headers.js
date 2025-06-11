'use client';

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import useUserRoleStore from '../../store/userRoleStore';
import useLoginStore from '../../store/LoginStore';

export default function Headers() {
  const router = useRouter();
  const setRole = useUserRoleStore((state) => state.setRole);
  const role = useUserRoleStore((state) => state.role);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState('');
  const logout = useLoginStore((state) => state.logout);

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true);
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
    
    // Get user info from localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserName(user.userRole || 'User');
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      // Clear role from userRoleStore
      setRole('');
      // Redirect to login page
      router.push('/Auth/Login');
    }
  };

  const handleLogin = () => {
    router.push('/Auth/Login');
  };

  const handleRoleClick = (role) => {
    setRole(role);
    console.log("Selected Role:", role);
  };

  // Don't render anything until after hydration
  if (!mounted) {
    return null;
  }

  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('token');

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
                  aria-expanded="true"
                  style={{ background: 'transparent', border: 'none' }}
                >
                  <div className="user-toggle">
                    <div className="user-avatar sm">
                      <em className="icon ni ni-user-alt"></em>
                    </div>
                    <div className="user-info d-none d-md-block">
                      {isLoggedIn ? (userName || role || 'User') : 'Guest'}
                    </div>
                  </div>
                
                </button>

                <ul className="dropdown-menu dropdown-menu-md dropdown-menu-end dropdown-menu-s1">
                  {isLoggedIn ? (
                    <>
                      {/* <li>
                        <div className="dropdown-item">
                          <em className="icon ni ni-user-alt mr-2"></em>
                          <span style={{ color: '#333', fontSize: "14px", fontWeight: "bold", fontFamily: "Roboto" }}>
                            {role || 'User'}
                          </span>
                        </div>
                      </li> */}
                      {/* <li className="divider"></li> */}
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={handleLogout}
                        >
                          <em className="icon ni ni-signout mr-2"></em>
                          <span style={{ color: '#007bff', fontSize: "14px", fontWeight: "bold", fontFamily: "Roboto" }}>
                            Logout
                          </span>
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={handleLogin}
                      >
                        <em className="icon ni ni-signin mr-2"></em>
                        <span style={{ color: '#007bff', fontSize: "14px", fontWeight: "bold", fontFamily: "Roboto" }}>
                          Login
                        </span>
                      </button>
                    </li>
                  )}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
