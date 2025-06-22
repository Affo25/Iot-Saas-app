'use client';

import React from 'react';
import useUserInfo from '../hooks/useUserInfo';

export default function UserStatus({ showEmail = true, showRole = true, compact = false }) {
  const { userInfo, isLoggedIn } = useUserInfo();

  if (!isLoggedIn) {
    return (
      <div className="user-status">
        <span className="text-muted">Not logged in</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="user-status-compact d-flex align-items-center">
        <div className="user-avatar-sm me-2">
          {userInfo.userRole === 'Admin' ? (
            <em className="icon ni ni-shield-check" style={{ color: '#e85347', fontSize: '16px' }}></em>
          ) : userInfo.userRole === 'Customer' ? (
            <em className="icon ni ni-users" style={{ color: '#0fac81', fontSize: '16px' }}></em>
          ) : (
            <em className="icon ni ni-user-alt" style={{ fontSize: '16px' }}></em>
          )}
        </div>
        <div>
          <div className="user-name" style={{ fontSize: '12px', fontWeight: '500' }}>
            {userInfo.email ? userInfo.email.split('@')[0] : 'User'}
          </div>
          {showRole && userInfo.userRole && (
            <div className="user-role" style={{ 
              fontSize: '10px',
              color: userInfo.userRole === 'Admin' ? '#e85347' : '#0fac81',
              fontWeight: '600'
            }}>
              {userInfo.userRole}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="user-status">
      <div className="d-flex align-items-center">
        <div className="user-avatar me-3">
          {userInfo.userRole === 'Admin' ? (
            <em className="icon ni ni-shield-check" style={{ color: '#e85347', fontSize: '20px' }}></em>
          ) : userInfo.userRole === 'Customer' ? (
            <em className="icon ni ni-users" style={{ color: '#0fac81', fontSize: '20px' }}></em>
          ) : (
            <em className="icon ni ni-user-alt" style={{ fontSize: '20px' }}></em>
          )}
        </div>
        <div>
          <div className="user-name" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
            {userInfo.email ? userInfo.email.split('@')[0] : 'User'}
          </div>
          {showEmail && userInfo.email && (
            <div className="user-email" style={{ fontSize: '12px', color: '#8094ae', marginBottom: '2px' }}>
              {userInfo.email}
            </div>
          )}
          {showRole && userInfo.userRole && (
            <div className="user-role" style={{ 
              fontSize: '11px',
              padding: '2px 6px',
              backgroundColor: userInfo.userRole === 'Admin' ? '#e853471a' : '#0fac811a',
              color: userInfo.userRole === 'Admin' ? '#e85347' : '#0fac81',
              borderRadius: '3px',
              display: 'inline-block',
              fontWeight: '600'
            }}>
              {userInfo.userRole}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}