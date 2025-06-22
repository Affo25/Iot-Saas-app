import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/Auth/Verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
          setUser(data.user);
          if (data.user && data.user.userRole) {
            localStorage.setItem('userRole', data.user.userRole);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await fetch('/api/Auth/Login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.userRole);
        setUser(data.user);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setUser(null);
    setIsAuthenticated(false);

    // Redirect to login page after logging out
    router.push('/auth/login');
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };
};
