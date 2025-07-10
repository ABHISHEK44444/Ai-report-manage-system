import React, { useState } from 'react';
import { User, Permission } from '../App';

const API_URL = 'http://localhost:5000/api';

interface UserManagementProps {
    users: User[];
    permissions: Permission[];
    token: string;
    onDataChange: () => void; // Function to trigger data refresh in parent
}

const UserManagement: React.FC<UserManagementProps> = ({ users, permissions, token, onDataChange }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'User' | 'Admin'>('User');

    const [selectedViewer, setSelectedViewer] = useState('');
    const [selectedViewee, setSelectedViewee] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const apiCall = async (endpoint: string, method: string, body?: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'An API error occurred');
        }
        return res.json();
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!fullName || !username || !password) {
            alert("Please fill all fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            await apiCall('/users/register', 'POST', { fullName, username, password, role });
            setFullName('');
            setUsername('');
            setPassword('');
            setRole('User');
            onDataChange();
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
         if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            try {
                await apiCall(`/users/${userId}`, 'DELETE');
                onDataChange();
            } catch (error) {
                alert((error as Error).message);
            }
        }
    }

    const handleAddPermission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedViewer || !selectedViewee) {
            alert('Please select both a viewer and a user whose reports can be viewed.');
            return;
        }
        if (selectedViewer === selectedViewee) {
            alert('A user cannot be assigned to view their own reports.');
            return;
        }
        try {
            await apiCall('/permissions', 'POST', { viewerId: selectedViewer, vieweeId: selectedViewee });
            setSelectedViewer('');
            setSelectedViewee('');
            onDataChange();
        } catch (error) {
            alert((error as Error).message);
        }
    };
    
    const handleRemovePermission = async (permissionId: string) => {
        try {
            await apiCall(`/permissions/${permissionId}`, 'DELETE');
            onDataChange();
        } catch (error) {
            alert((error as Error).message);
        }
    }

    const getUserNameById = (id: string): string => {
        return users.find(u => u.id === id)?.fullName || 'Unknown User';
    };

    const getRoleClass = (userRole: 'User' | 'Admin') => {
        switch (userRole) {
            case 'Admin': return 'bg-red-100 text-red-800';
            case 'User': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-gray-500 mt-1">Manage users and permissions.</p>
            </div>

            <div className="bg-white rounded-lg shadow p-8 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-2">User Management</h2>
                <p className="text-gray-600 font-semibold mb-6">Add New User</p>

                <form onSubmit={handleAddUser}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select id="role" value={role} onChange={(e) => setRole(e.target.value as 'User' | 'Admin')} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-8">
                        <button type="submit" disabled={isSubmitting} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50">
                             {isSubmitting ? 'Adding...' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow p-8 mb-8">
                 <h2 className="text-xl font-bold text-gray-800 mb-6">All Users</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                           <tr className="border-b border-gray-200">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Name</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Username</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Role</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {users.map(user => (
                            <tr key={user.id}>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600">{user.username}</td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>{user.role}</span>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                                    {user.role !== 'Admin' && (
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => alert('Password reset functionality to be implemented.')} className="text-blue-600 hover:text-blue-800 transition-colors">Reset Password</button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 transition-colors">Delete</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                           ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Permission Management</h2>
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Current Permissions</h3>
                    <div className="space-y-3">
                        {permissions.map(permission => (
                            <div key={permission.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-800">
                                    <span className="font-bold text-blue-600">{getUserNameById(permission.viewerId)}</span> can view reports of <span className="font-bold text-green-600">{getUserNameById(permission.vieweeId)}</span>
                                </p>
                                <button onClick={() => handleRemovePermission(permission.id)} className="text-sm font-medium text-red-500 hover:text-red-700">Remove</button>
                            </div>
                        ))}
                        {permissions.length === 0 && (
                             <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                                <p className="text-sm text-gray-500">No permissions have been set.</p>
                             </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleAddPermission}>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-6">
                        <div>
                            <label htmlFor="viewer" className="block text-sm font-medium text-gray-700 mb-1">Viewer</label>
                            <select id="viewer" value={selectedViewer} onChange={e => setSelectedViewer(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                <option value="">Select User</option>
                                {users.filter(u => u.role === 'User').map(user => ( <option key={user.id} value={user.id}>{user.fullName}</option> ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="viewee" className="block text-sm font-medium text-gray-700 mb-1">Can View Reports Of</label>
                            <select id="viewee" value={selectedViewee} onChange={e => setSelectedViewee(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                <option value="">Select User</option>
                                {users.filter(u => u.role === 'User').map(user => ( <option key={user.id} value={user.id}>{user.fullName}</option> ))}
                            </select>
                        </div>
                        <div className="md:col-start-3">
                           <button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Add Permission</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;
