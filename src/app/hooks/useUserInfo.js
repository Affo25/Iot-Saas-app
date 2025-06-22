'use client';

import { useState, useEffect } from 'react';

export default function useUserInfo() {
  const [userInfo, setUserInfo] = useState({
    email: '',
    userRole: '',
    _id: '',
    created_at: '',
    isLoggedIn: false
  });

  const updateUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (userStr && token) {
        try {
          const user = JSON.parse(userStr);
          setUserInfo({
            email: user.email || '',
            userRole: user.userRole || '',
            _id: user._id || '',
            created_at: user.created_at || '',
            isLoggedIn: true
          });
        } catch (e) {
          console.error('Error parsing user data:', e);
          setUserInfo({
            email: '',
            userRole: '',
            _id: '',
            created_at: '',
            isLoggedIn: false
          });
        }
      } else {
        setUserInfo({
          email: '',
          userRole: '',
          _id: '',
          created_at: '',
          isLoggedIn: false
        });
      }
    }
  };

  useEffect(() => {
    updateUserInfo();

    // Listen for storage changes
    const handleStorageChange = () => {
      updateUserInfo();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  return {
    userInfo,
    updateUserInfo,
    isLoggedIn: userInfo.isLoggedIn,
    isAdmin: userInfo.userRole === 'Admin',
    isCustomer: userInfo.userRole === 'Customer'
  };
}