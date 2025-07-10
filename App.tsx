import React, { useState, useEffect } from 'react';
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';
import AdminLayout from './components/AdminLayout';

export interface User {
    id: string; // Changed to string for MongoDB ObjectId
    fullName: string;
    username: string;
    role: 'User' | 'Admin';
}

export interface Permission {
    id: string;
    viewerId: string;
    vieweeId: string;
}

const API_URL = 'https://ai-report-manage-system-frontend.onrender.com/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Effect to check for existing token on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }
      const { token: receivedToken, user } = await res.json();
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(receivedToken);
      setCurrentUser(user);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <main className="bg-slate-100 min-h-screen w-full font-sans">
      {!currentUser ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <LoginCard onLogin={handleLogin} />
        </div>
      ) : currentUser.role === 'Admin' ? (
        <AdminLayout
            currentUser={currentUser}
            token={token!}
            onLogout={handleLogout}
        />
      ) : (
        <Dashboard
            currentUser={currentUser}
            token={token!}
            onLogout={handleLogout}
        />
      )}
    </main>
  );
};

export default App;
