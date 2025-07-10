
import React from 'react';
import LogoIcon from './icons/LogoIcon';
import LogoutIcon from './icons/LogoutIcon';
import { User } from '../App';

interface HeaderProps {
    onLogout: () => void;
    currentUser: User;
    activeView?: 'dashboard' | 'userManagement';
    onNavClick?: (view: 'dashboard' | 'userManagement') => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, currentUser, activeView, onNavClick }) => {
    
    const getNavButtonClasses = (view: 'dashboard' | 'userManagement') => {
        return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === view
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;
    };

    return (
        <header className="bg-[#2D3748] shadow-md text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center">
                            <LogoIcon className="h-8 w-8 mr-2 text-cyan-400" />
                            <span className="font-bold text-xl">Mint IntelliReport</span>
                        </div>
                        <nav className="hidden md:flex items-center space-x-4">
                            {currentUser.role === 'Admin' && onNavClick ? (
                                <>
                                    <button 
                                        onClick={() => onNavClick('dashboard')} 
                                        className={getNavButtonClasses('dashboard')}
                                    >
                                        Dashboard
                                    </button>
                                    <button 
                                        onClick={() => onNavClick('userManagement')} 
                                        className={getNavButtonClasses('userManagement')}
                                    >
                                        User Management
                                    </button>
                                </>
                            ) : (
                                <a href="#" className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                            )}
                        </nav>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-300 text-sm mr-4 hidden sm:block">Welcome, {currentUser.fullName}</span>
                        <button 
                            onClick={onLogout}
                            className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
                            aria-label="Logout"
                        >
                            <LogoutIcon />
                            <span className="ml-2 text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
