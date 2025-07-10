import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import ReportView from './ReportView';
import UserManagement from './UserManagement';
import { User, Permission } from '../App';

const API_URL = 'http://localhost:5000/api';

interface AdminLayoutProps {
    currentUser: User;
    token: string;
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, token, onLogout }) => {
    const [activeView, setActiveView] = useState<'dashboard' | 'userManagement'>('dashboard');
    const [users, setUsers] = useState<User[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, permissionsRes] = await Promise.all([
                fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/permissions`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const usersData = await usersRes.json();
            const permissionsData = await permissionsRes.json();
            if (!usersRes.ok || !permissionsRes.ok) {
                throw new Error(usersData.message || permissionsData.message || 'Failed to fetch admin data');
            }
            setUsers(usersData);
            setPermissions(permissionsData);
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading Admin Panel...</div>;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header 
                onLogout={onLogout} 
                currentUser={currentUser}
                activeView={activeView} 
                onNavClick={setActiveView} 
            />
            {activeView === 'dashboard' ? (
                <ReportView 
                    currentUser={currentUser}
                    allUsers={users}
                    permissions={permissions}
                    token={token}
                />
            ) : (
                <UserManagement 
                    users={users}
                    permissions={permissions}
                    token={token}
                    onDataChange={fetchData} // Refresh data after user/permission change
                />
            )}
        </div>
    );
};

export default AdminLayout;
