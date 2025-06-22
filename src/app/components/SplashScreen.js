'use client';

import React from 'react';
import Image from 'next/image';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <Image
            src="/logo/auth-logo.svg"
            alt="IoT SaaS App Logo"
            width={300}
            height={100}
            priority
            className="logo-image"
          />
        </div>
        <h1 className="app-name">IoT SaaS Platform</h1>
        <p className="app-tagline">Connecting your devices, simplifying your life</p>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
        <div className="app-version">Version 1.0.0</div>
      </div>

      <style jsx>{`
        .splash-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100%;
          background: #0e1c4b;
          color: white;
          text-align: center;
          opacity: 1;
          transition: opacity 0.5s ease-out;
        }
        
        .splash-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 2rem;
        }
        
        .logo-container {
          animation: pulse 2s infinite;
          margin-bottom: 1rem;
        }
        
        .logo-image {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
        
        .app-name {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          letter-spacing: 1px;
        }
        
        .app-tagline {
          font-size: 1.2rem;
          opacity: 0.9;
          max-width: 80%;
          margin: 0 auto;
          animation: fadeIn 1s ease-out 1s both;
        }
        
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 2rem;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        .loading-indicator p {
          margin-top: 1rem;
          font-size: 1.2rem;
          opacity: 0.8;
        }
        
        .app-version {
          position: absolute;
          bottom: 2rem;
          font-size: 0.9rem;
          opacity: 0.7;
          animation: fadeIn 1s ease-out 2s both;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .app-name {
            font-size: 2rem;
          }
          
          .app-tagline {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;