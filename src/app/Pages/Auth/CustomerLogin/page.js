'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { customerLogin } from '../../../store/slices/authSlice';
import { toast } from 'react-toastify';
import useUserRoleStore from '../../../store/userRoleStore';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const setUserRole = useUserRoleStore((state) => state.setUserRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(customerLogin({ email, password, userRole: 'Customer' })).unwrap();
      if (result.success) {
        const userRole = result.user?.userRole;
        //setUserRole(userRole);
        // Store token and user data
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Show success toast
        toast.success('Login successful! Welcome back Customer.');
        
        // Add delay to allow cookie to be set and toast to show
        setTimeout(() => {
          window.location.href = '/Pages';
        }, 1500);
      } else {
        toast.error(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const message = err?.message || err?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      console.error('Login failed:', err);
    }
  };

   return (
    <div className="min-h-screen flex">
      {/* Left Panel (Form) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md">
         

          <h2 className="text-3xl font-semibold text-gray-900 mb-1">Sign In</h2>
          <p className="text-gray-600 mb-6">Enter your email and password to sign in!</p>

          {/* <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Image src="/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
              Sign in with Google
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <span className="mr-2">X</span> Sign in with X
            </button>
          </div> */}

          {/* <div className="text-center text-sm text-gray-400 my-4">Or</div> */}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="info@gmail.com"
              />
            </div>

            <div style={{marginBottom:'2rem'}}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2  border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                Keep me logged in
              </label>
              {/* <Link href="#" className="text-sm text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </Link> */}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-2 font-semibold hover:bg-indigo-700 transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Admin login?{' '}
            <Link href="/Pages/Auth/Login" className="text-indigo-600 font-medium hover:text-indigo-500">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel (Visual) */}
      <div className="hidden md:block md:w-1/2 bg-[#0e1c4b] text-white flex flex-col justify-center items-center px-8">
        <div className="text-center">
          <Image src="/logo/auth-logo.svg" alt="TailAdmin" width={200} height={200} className="mx-auto mb-4" />
          {/* <h2 className="text-2xl font-bold mb-2">TailAdmin</h2> */}
          <p className="text-gray-300 text-sm">Free and Open-Source Iot Portal Admin Dashboard</p>
        </div>
      </div>
    </div>
  );
}