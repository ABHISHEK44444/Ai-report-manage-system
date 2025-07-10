import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import PlusIcon from './icons/PlusIcon';
import SummaryIcon from './icons/SummaryIcon';

const API_URL = 'http://localhost:5000/api';

interface ActivityData {
  id: string; // Changed to string for MongoDB ObjectId
  date: string;
  day: string;
  accountName: string;
  contactPerson: string;
  contactNumber: string;
  workDone: string;
  outcome: string;
  supportRequired: string;
  managerRemarks: string;
}

interface ActivityTableProps {
    salesPersonName: string;
    userId: string;
    token: string;
}

const emptyNewEntry: Omit<ActivityData, 'id' | 'managerRemarks'> = {
    date: '',
    day: '',
    accountName: '',
    contactPerson: '',
    contactNumber: '',
    workDone: '',
    outcome: '',
    supportRequired: '',
};

const ActivityTable: React.FC<ActivityTableProps> = ({ salesPersonName, userId, token }) => {
    const [data, setData] = useState<ActivityData[]>([]);
    const [newEntry, setNewEntry] = useState(emptyNewEntry);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ActivityData>>({});
    const [summary, setSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const apiCall = useCallback(async (endpoint: string, method: string, body?: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'API Error');
        }
        return res.json();
    }, [token]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const reports = await apiCall(`/reports/daily/${userId}`, 'GET');
            setData(reports);
        } catch (error) {
            console.error("Failed to fetch daily reports", error);
            setData([]); // Reset data on error
        } finally {
            setLoading(false);
        }
    }, [userId, apiCall]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (newEntry.date) {
            const dateObj = new Date(newEntry.date + 'T00:00:00');
            const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            setNewEntry(prev => ({ ...prev, day: dayOfWeek }));
        } else {
             setNewEntry(prev => ({...prev, day: ''}));
        }
    }, [newEntry.date]);

    const handleNewEntryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRow = async () => {
        if (!newEntry.date || !newEntry.accountName || !newEntry.workDone) {
            alert('Please fill out Date, Account Name, and Work Done fields.');
            return;
        }
        try {
            await apiCall('/reports/daily', 'POST', newEntry);
            setNewEntry(emptyNewEntry);
            fetchData();
        } catch(error) {
            alert((error as Error).message);
        }
    };

    const handleEditClick = (row: ActivityData) => {
        setEditingId(row.id);
        setEditFormData(row);
    };
    
    const handleCancelClick = () => {
        setEditingId(null);
    };

    const handleUpdateRow = async () => {
        if (!editingId || !editFormData) return;
        try {
            await apiCall(`/reports/daily/${editingId}`, 'PUT', editFormData);
            setEditingId(null);
            fetchData();
        } catch(error) {
            alert((error as Error).message);
        }
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => {
            const updated = {...prev, [name]: value};
            if (name === 'date') {
                 const dateObj = new Date(value + 'T00:00:00');
                 updated.day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            }
            return updated;
        });
    };

    const handleDeleteClick = async (id: string) => {
        if(window.confirm('Are you sure you want to delete this entry?')) {
            try {
                await apiCall(`/reports/daily/${id}`, 'DELETE');
                fetchData();
            } catch(error) {
                alert((error as Error).message);
            }
        }
    };

    const handleGenerateSummary = async () => {
        if (data.length === 0) {
            alert("No data available to generate a summary.");
            return;
        }
        setIsGenerating(true);
        setSummary('');
        const reportText = data.map(row => `On ${row.date}, they worked on account '${row.accountName}' (Contact: ${row.contactPerson}). The task was '${row.workDone}' with the outcome being '${row.outcome}'. Support required: '${row.supportRequired || 'None'}'`).join('\n');
        const prompt = `You are an expert sales performance analyst. Based on the following activity report for sales person ${salesPersonName}, provide a concise summary... Activity Data:\n${reportText}`;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setSummary(response.text);
        } catch (error) {
            console.error("Error generating summary:", error);
            setSummary("<p class='text-red-500'>Sorry, there was an error generating the summary.</p>");
        } finally {
            setIsGenerating(false);
        }
    };

    const renderRow = (row: ActivityData) => {
        const isEditing = editingId === row.id;
        const currentData = isEditing ? editFormData : row;
        const handleChange = isEditing ? handleEditFormChange : () => {};

        return (
            <tr key={row.id} className={isEditing ? 'bg-yellow-50' : ''}>
                 <td className="px-4 py-3"><input type="date" name="date" value={currentData.date} onChange={handleChange} readOnly={!isEditing} className={`w-32 p-2 rounded-md text-sm ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`}/></td>
                 <td className="px-4 py-3"><input type="text" name="day" value={currentData.day} readOnly className={`w-28 p-2 rounded-md text-sm bg-gray-100 ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`} /></td>
                 <td className="px-4 py-3"><input type="text" name="accountName" value={currentData.accountName} onChange={handleChange} readOnly={!isEditing} className={`w-full p-2 rounded-md text-sm ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`} /></td>
                 <td className="px-4 py-3"><input type="text" name="contactPerson" value={currentData.contactPerson} onChange={handleChange} readOnly={!isEditing} className={`w-full p-2 rounded-md text-sm ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`} /></td>
                 <td className="px-4 py-3"><input type="text" name="contactNumber" value={currentData.contactNumber} onChange={handleChange} readOnly={!isEditing} className={`w-full p-2 rounded-md text-sm ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`} /></td>
                 <td className="px-4 py-3 min-w-[150px]"><input type="text" name="workDone" value={currentData.workDone} onChange={handleChange} readOnly={!isEditing} className={`w-full p-2 rounded-md text-sm ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`} /></td>
                 <td className="px-4 py-3 min-w-[200px]"><input type="text" name="outcome" value={currentData.outcome} onChange={handleChange} readOnly={!isEditing} className={`w-full p-2 rounded-md text-sm ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`} /></td>
                 <td className="px-4 py-3"><input type="text" name="supportRequired" value={currentData.supportRequired} onChange={handleChange} readOnly={!isEditing} className={`w-full p-2 rounded-md text-sm ${isEditing ? 'border border-gray-300' : 'border-none bg-transparent'}`} /></td>
                 <td className="px-4 py-3 text-gray-500 italic">{row.managerRemarks}</td>
                 <td className="px-4 py-3 whitespace-nowrap">
                     {isEditing ? (
                         <div className="flex items-center gap-2">
                             <button onClick={handleUpdateRow} className="text-sm text-green-600 hover:text-green-800 font-semibold">Save</button>
                             <button onClick={handleCancelClick} className="text-sm text-gray-600 hover:text-gray-800 font-semibold">Cancel</button>
                         </div>
                     ) : (
                         <div className="flex items-center gap-4">
                             <button onClick={() => handleEditClick(row)} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                             <button onClick={() => handleDeleteClick(row.id)} className="text-sm text-red-600 hover:text-red-800 font-semibold">Delete</button>
                         </div>
                     )}
                 </td>
            </tr>
        )
    }

    if (loading) return <div className="text-center py-10">Loading activities...</div>;

    return (
        <div>
            <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#E6FFFA]">
                        <tr>
                            {['Dated', 'Day', 'Account Name', 'Contact Person', 'Contact Number', 'Requirement/Work Done', 'Outcome/Result/Remarks/Response', 'Support Required', 'Manager Remarks', 'Actions'].map(header => (
                                <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                        {data.map(renderRow)}
                        {/* New Entry Row */}
                        <tr className="bg-gray-50">
                            <td className="px-4 py-2">
                               <div className="flex items-center gap-2">
                                <button onClick={handleAddRow} className="text-blue-600 hover:text-blue-800" aria-label="Add new row"><PlusIcon /></button>
                                <input type="date" name="date" value={newEntry.date} onChange={handleNewEntryChange} className="w-32 p-2 border border-gray-300 rounded-md text-sm" />
                               </div>
                            </td>
                            <td className="px-4 py-2"><input type="text" name="day" placeholder="Day" value={newEntry.day} readOnly className="w-full p-2 border-none rounded-md text-sm bg-gray-100" /></td>
                            <td className="px-4 py-2"><input type="text" name="accountName" placeholder="Account Name" value={newEntry.accountName} onChange={handleNewEntryChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></td>
                            <td className="px-4 py-2"><input type="text" name="contactPerson" placeholder="Contact Person" value={newEntry.contactPerson} onChange={handleNewEntryChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></td>
                            <td className="px-4 py-2"><input type="text" name="contactNumber" placeholder="Contact Number" value={newEntry.contactNumber} onChange={handleNewEntryChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></td>
                            <td className="px-4 py-2"><input type="text" name="workDone" placeholder="Work Done" value={newEntry.workDone} onChange={handleNewEntryChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></td>
                            <td className="px-4 py-2"><input type="text" name="outcome" placeholder="Outcome" value={newEntry.outcome} onChange={handleNewEntryChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></td>
                            <td className="px-4 py-2"><input type="text" name="supportRequired" placeholder="Support Required" value={newEntry.supportRequired} onChange={handleNewEntryChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" /></td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-8">
                <button onClick={handleGenerateSummary} disabled={isGenerating} className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SummaryIcon />
                    {isGenerating ? "Generating..." : `Generate ${salesPersonName}'s Summary`}
                </button>
            </div>
            
            {summary && (
                <div className="mt-8 p-6 bg-slate-50 rounded-lg shadow-inner">
                     <h3 className="text-xl font-bold text-gray-800 mb-4">AI Generated Summary</h3>
                     <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: summary }}></div>
                </div>
            )}
        </div>
    );
};

export default ActivityTable;
