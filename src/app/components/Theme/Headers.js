'use client';

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import useUserRoleStore from '../../store/userRoleStore';
import useUserInfo from '../../hooks/useUserInfo';
import { toast } from 'react-toastify';

export default function Headers() {
  const router = useRouter();
  const dispatch = useDispatch();
  const setRole = useUserRoleStore((state) => state.setRole);
  const role = useUserRoleStore((state) => state.role);
  const [mounted, setMounted] = useState(false);
  const { userInfo, isLoggedIn, updateUserInfo } = useUserInfo();
  const { loading } = useSelector((state) => state.auth);

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true);
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear role from userRoleStore
      setRole('');
      // Update user info to reflect logout
      updateUserInfo();
      // Show success message
      toast.success('Logged out successfully');
      // Redirect to login page
      router.push('/Pages/Auth/Login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const handleLogin = () => {
    router.push('/Pages/Auth/Login');
  };

  const handleRoleClick = (role) => {
    setRole(role);
    console.log("Selected Role:", role);
  };

  // Don't render anything until after hydration
  if (!mounted) {
    return null;
  }

  // isLoggedIn is now coming from useUserInfo hook

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
                      {userInfo.userRole === 'Admin' ? (
                        <em className="icon ni ni-shield-check" style={{ color: '#e85347' }}></em>
                      ) : userInfo.userRole === 'Customer' ? (
                        <em className="icon ni ni-users" style={{ color: '#0fac81' }}></em>
                      ) : (
                        <em className="icon ni ni-user-alt"></em>
                      )}
                    </div>
                    <div className="user-info d-none d-md-block">
                      <div className="user-name" style={{ fontSize: '14px', fontWeight: '500' }}>
                        {isLoggedIn ? (userInfo.email ? userInfo.email.split('@')[0] : 'User') : 'Guest'}
                      </div>
                      {isLoggedIn && userInfo.userRole && (
                        <div className="user-role" style={{ 
                          fontSize: '12px', 
                          color: userInfo.userRole === 'Admin' ? '#e85347' : '#0fac81',
                          fontWeight: '600'
                        }}>
                          {userInfo.userRole}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                <ul className="dropdown-menu dropdown-menu-md dropdown-menu-end dropdown-menu-s1">
                  {isLoggedIn ? (
                    <>
                      {/* User Profile Section */}
                      <li className="dropdown-header">
                        <div className="d-flex align-items-center p-3 border-bottom">
                          <div className="user-avatar me-3">
                            {userInfo.userRole === 'Admin' ? (
                              <em className="icon ni ni-shield-check" style={{ color: '#e85347', fontSize: '24px' }}></em>
                            ) : userInfo.userRole === 'Customer' ? (
                              <em className="icon ni ni-users" style={{ color: '#0fac81', fontSize: '24px' }}></em>
                            ) : (
                              <em className="icon ni ni-user-alt" style={{ fontSize: '24px' }}></em>
                            )}
                          </div>
                          <div className="user-details">
                            <div className="user-name" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                              {userInfo.email ? userInfo.email.split('@')[0] : 'User'}
                            </div>
                            <div className="user-email" style={{ fontSize: '13px', color: '#8094ae', marginBottom: '2px' }}>
                              {userInfo.email}
                            </div>
                            <div className="user-role" style={{ 
                              fontSize: '12px',
                              padding: '2px 8px',
                              backgroundColor: userInfo.userRole === 'Admin' ? '#e853471a' : '#0fac811a',
                              color: userInfo.userRole === 'Admin' ? '#e85347' : '#0fac81',
                              borderRadius: '4px',
                              display: 'inline-block',
                              fontWeight: '600'
                            }}>
                              {userInfo.userRole}
                            </div>
                          </div>
                        </div>
                      </li>

                      {/* Profile Actions */}
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => router.push('/Pages')}
                        >
                          <em className="icon ni ni-dashboard mr-2"></em>
                          <span style={{ fontSize: "14px", fontFamily: "Roboto" }}>
                            Dashboard
                          </span>
                        </button>
                      </li>

                      {/* Account Settings */}
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => toast.info('Profile settings coming soon!')}
                        >
                          <em className="icon ni ni-user-c mr-2"></em>
                          <span style={{ fontSize: "14px", fontFamily: "Roboto" }}>
                            Profile Settings
                          </span>
                        </button>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      {/* Logout */}
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={handleLogout}
                          disabled={loading}
                          style={{ color: '#e85347' }}
                        >
                          <em className="icon ni ni-signout mr-2"></em>
                          <span style={{ fontSize: "14px", fontWeight: "bold", fontFamily: "Roboto" }}>
                            {loading ? 'Logging out...' : 'Logout'}
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
