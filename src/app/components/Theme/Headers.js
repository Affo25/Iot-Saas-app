'use client';

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import useUserRoleStore from '../../store/userRoleStore';
import useUserInfo from '../../hooks/useUserInfo';
import { toast } from 'react-toastify';
import Image from 'next/image';


export default function Headers() {
  const router = useRouter();
  const dispatch = useDispatch();
  const setRole = useUserRoleStore((state) => state.setRole);
  const role = useUserRoleStore((state) => state.role);
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    // You can emit an event or call a parent function to actually toggle the sidebar
    // For example: onSidebarToggle(!sidebarCollapsed);
    const sidebarEvent = new CustomEvent('toggleSidebar', { 
      detail: { collapsed: !sidebarCollapsed } 
    });
    window.dispatchEvent(sidebarEvent);
  };

  // Don't render anything until after hydration
  if (!mounted) {
    return null;
  }

  // isLoggedIn is now coming from useUserInfo hook

  return (
    <div className="nk-header is-light" style={{ width: '100%', position: 'relative' }}>
      <div className="container-fluid" style={{ width: '100%', maxWidth: 'none', padding: '0 20px' }}>
        <div className="nk-header-wrap">
          {/* Sidebar Toggle Button */}
          <div className="nk-header-brand">
            <button
              className="btn btn-clean sidebar-toggle"
              onClick={toggleSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f5f6fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <em 
                className={`icon ni ${sidebarCollapsed ? 'ni-menu-right' : 'ni-menu-left'}`}
                style={{ 
                  fontSize: '18px', 
                  color: '#526484',
                  transition: 'transform 0.3s ease'
                }}
              ></em>
            </button>
          </div>
          
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
                       
                        <Image
                          src="/images/user-1.jpg"  // Replace with your actual image path
                          alt="User Icon"
                          width={50}
                          height={50}
                          className="inline-block"
                        />
                        // <em className="icon ni ni-user" style={{ color: '#e85347' }}></em>
                      ) : userInfo.userRole === 'Customer' ? (
                        <Image
                          src="/images/user-1.jpg"  // Replace with your actual image path
                          alt="User Icon"
                          width={50}
                          height={50}
                          className="inline-block"
                        />
                      ) : (
                        <Image
                          src="/images/user-1.jpg"  // Replace with your actual image path
                          alt="User Icon"
                          width={50}
                          height={50}
                          className="inline-block"
                        />
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
                               <Image
                          src="/images/user-1.jpg"  // Replace with your actual image path
                          alt="User Icon"
                          width={50}
                          height={50}
                          className="inline-block"
                        />
                            ) : userInfo.userRole === 'Customer' ? (
                              <Image
                          src="/images/user-1.jpg"  // Replace with your actual image path
                          alt="User Icon"
                          width={50}
                          height={50}
                          className="inline-block"
                        />
                            ) : (
                               <Image
                          src="/images/user-1.jpg"  // Replace with your actual image path
                          alt="User Icon"
                          width={50}
                          height={50}
                          className="inline-block"
                        />
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
                              backgroundColor: userInfo.userRole === 'Admin' ? '#006389' : '#8fce00',
                              color: userInfo.userRole === 'Admin' ? 'white' : 'white',
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
