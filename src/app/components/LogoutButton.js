'use client';

import { useRouter } from 'next/navigation';
import { logout } from '../utils/auth';

/**
 * Logout button component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactNode} Logout button
 */
export default function LogoutButton({ className = '' }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/Auth/Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className={`btn btn-icon btn-trigger ${className}`}
      title="Logout"
    >
      <em className="icon ni ni-signout"></em>
    </button>
  );
}