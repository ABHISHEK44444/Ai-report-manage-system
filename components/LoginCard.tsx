import React, { useState } from 'react';
import LogoIcon from './icons/LogoIcon';
import UserIcon from './icons/UserIcon';
import LockIcon from './icons/LockIcon';
import Pattern from './icons/Pattern';

interface LoginCardProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username && password) {
      setIsLoading(true);
      await onLogin(username, password);
      setIsLoading(false);
    } else {
      alert('Please enter username and password.');
    }
  };

  return (
    <div className="flex w-full max-w-5xl h-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">
      {/* Left Panel */}
      <div className="relative hidden md:flex w-1/2 bg-gradient-to-br from-[#00A7B5] to-[#0063C7] p-12 text-white flex-col justify-between">
        <Pattern />
        <div className="relative z-10">
          <div className="flex items-center mb-24">
            <LogoIcon />
            <span className="text-2xl font-bold tracking-wide">Mint IntelliReport</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">AI-Driven Insights.</h1>
          <p className="text-lg text-cyan-100 font-light">
            Unlock your sales potential and streamline reporting with intelligent analytics.
          </p>
        </div>
        <p className="relative z-10 text-xs text-cyan-200">
          &copy; 2025 Mint IntelliReport Inc. All rights reserved.
        </p>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full md:w-1/2 p-8 sm:p-16 flex flex-col justify-center bg-white">
        <div className="w-full max-w-sm mx-auto">
            <div className="flex items-center mb-8 md:hidden">
              <LogoIcon className="text-[#0070B8]"/>
              <span className="text-2xl font-bold tracking-wide text-gray-800">Mint IntelliReport</span>
            </div>
            <h2 className="text-4xl font-bold text-[#0070B8] mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-10">Please sign in to continue.</p>

            <form onSubmit={handleSubmit}>
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                  <UserIcon />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-12 p-3.5 placeholder-gray-400 transition-colors"
                  placeholder="Username(eg.admin,suresh)"
                  required
                />
              </div>
              <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-12 p-3.5 placeholder-gray-400 transition-colors"
                  placeholder="Password(eg.password)"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white bg-gradient-to-r from-[#00B4D8] via-[#0096C7] to-[#0077B6] hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 font-semibold rounded-lg text-md px-5 py-3.5 text-center transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;
