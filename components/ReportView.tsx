import React, { useState, useMemo } from 'react';
import ActivityTable from './ActivityTable';
import WeeklyPlanTable from './WeeklyPlanTable';
import { User, Permission } from '../App';

interface ReportViewProps {
    currentUser: User;
    allUsers: User[];
    permissions: Permission[];
    token: string;
}

const ReportView: React.FC<ReportViewProps> = ({ currentUser, allUsers, permissions, token }) => {
    const [activeTab, setActiveTab] = useState('daily');
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);

    const viewableUsers = useMemo(() => {
        if (currentUser.role === 'Admin') {
            return allUsers.filter(u => u.role === 'User');
        }
        
        const permittedUserIds = permissions
            .filter(p => p.viewerId === currentUser.id)
            .map(p => p.vieweeId);
            
        const uniqueIds = new Set([currentUser.id, ...permittedUserIds]);

        return allUsers.filter(u => uniqueIds.has(u.id));
    }, [currentUser, allUsers, permissions]);

    const selectedSalesPerson = allUsers.find(u => u.id === selectedUserId) || currentUser;

    const getTitle = () => {
        if (activeTab === 'weekly') {
            return "Week Plan Format";
        }
        return "Daily Activity and Call Report";
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
           <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
                        <p className="text-gray-500 mt-1">Sales Person: {selectedSalesPerson.fullName}</p>
                    </div>
                   {viewableUsers.length > 1 && (
                    <div className="flex items-center">
                        <label htmlFor="sales-person-select" className="text-sm font-medium text-gray-700 mr-2">View Reports For</label>
                        <select 
                            id="sales-person-select" 
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[180px]"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            {viewableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.fullName}</option>
                            ))}
                        </select>
                    </div>
                   )}
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('daily')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'daily' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Daily Activity
                        </button>
                        <button onClick={() => setActiveTab('weekly')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'weekly' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Weekly Plan
                        </button>
                    </nav>
                </div>
                
                {activeTab === 'daily' ? (
                    <ActivityTable 
                        salesPersonName={selectedSalesPerson.fullName}
                        userId={selectedSalesPerson.id}
                        token={token}
                    /> 
                ) : (
                    <WeeklyPlanTable 
                        salesPersonName={selectedSalesPerson.fullName} 
                        userId={selectedSalesPerson.id}
                        token={token}
                    />
                )}
            </div>
        </div>
    );
};

export default ReportView;