import React, {useState, useEffect, useCallback} from 'react';
import Header from './Header';
import ReportView from './ReportView';
import { User, Permission } from '../App';

const API_URL = 'http://localhost:5000/api';

interface DashboardProps {
    onLogout: () => void;
    currentUser: User;
    token: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, currentUser, token }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    // In a real app with more granular permissions, you might have separate endpoints
    // for users to fetch data. Here, we'll use the admin endpoints for simplicity
    // assuming a user needs to know about other users for the dropdown.
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, permissionsRes] = await Promise.all([
                fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/permissions`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            if (!usersRes.ok || !permissionsRes.ok) {
                 throw new Error('Failed to fetch dashboard data');
            }
            const usersData = await usersRes.json();
            const permissionsData = await permissionsRes.json();
            
            setUsers(usersData);
            setPermissions(permissionsData);

        } catch (error) {
            console.error(error);
            // Non-admins might not have access to these routes, handle gracefully
            // For now, we'll just show an empty state, but in a real app, adjust endpoints
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Fallback if data fetch fails for a regular user
    const finalUsers = users.length > 0 ? users : [currentUser];

    if (loading && users.length === 0) {
        return <div className="flex justify-center items-center min-h-screen">Loading Dashboard...</div>
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header onLogout={onLogout} currentUser={currentUser} />
            <ReportView 
                currentUser={currentUser}
                allUsers={finalUsers}
                permissions={permissions}
                token={token}
            />
        </div>
    );
};

export default Dashboard;
