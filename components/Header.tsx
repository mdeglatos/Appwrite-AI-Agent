
import React from 'react';
import type { Models } from 'appwrite';
import type { UserPrefs, AppwriteProject, Message, AppwriteFunction } from '../types';
import { MenuIcon, DeleteIcon, CodeIcon, TerminalIcon, UserIcon, LogoutIcon, StudioIcon } from './Icons';
import { RiRobot2Line } from 'react-icons/ri';

interface HeaderProps {
    isLeftSidebarOpen: boolean;
    setIsLeftSidebarOpen: (isOpen: boolean) => void;
    activeProject: AppwriteProject | null;
    currentUser: Models.User<UserPrefs>;
    onLogout: () => void;
    messages: Message[];
    handleClearChat: () => void;
    selectedFunction: AppwriteFunction | null;
    isCodeViewerSidebarOpen: boolean;
    setIsCodeViewerSidebarOpen: (isOpen: boolean) => void;
    setIsLogSidebarOpen: (isOpen: boolean) => void;
    viewMode: 'agent' | 'studio';
    setViewMode: (mode: 'agent' | 'studio') => void;
}

export const Header: React.FC<HeaderProps> = ({
    isLeftSidebarOpen, setIsLeftSidebarOpen,
    activeProject, currentUser, onLogout,
    messages, handleClearChat,
    selectedFunction, setIsCodeViewerSidebarOpen,
    setIsLogSidebarOpen,
    viewMode, setViewMode
}) => {
    return (
        <header className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
            <div className="bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-2 flex items-center gap-4 pointer-events-auto max-w-5xl w-full justify-between">
                
                {/* Left Section: Branding & Sidebar Toggle */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
                        className={`p-2 rounded-xl transition-all duration-200 border border-transparent ${isLeftSidebarOpen ? 'bg-gray-800 text-white shadow-sm border-white/5' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        aria-label="Toggle sidebar"
                    >
                        <MenuIcon />
                    </button>
                    
                    <div className="flex items-center gap-2 select-none">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-gray-950 rounded-full p-1.5 text-cyan-400 border border-gray-800">
                                 <RiRobot2Line size={18} />
                            </div>
                        </div>
                        <span className="hidden sm:block font-bold text-sm tracking-tight text-gray-200">
                            DV <span className="text-gray-500 font-normal">Studio</span>
                        </span>
                        
                        {activeProject && (
                            <div className="flex items-center gap-2 ml-1 animate-fade-in border-l border-gray-700/50 pl-3">
                                <span className="text-sm font-medium text-cyan-100 truncate max-w-[150px] sm:max-w-[200px]" title={activeProject.name}>
                                    {activeProject.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Section: View Mode Switcher */}
                <div className="flex p-1 bg-gray-950/50 border border-gray-800 rounded-xl">
                    <button
                        onClick={() => setViewMode('agent')}
                        className={`
                            relative flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                            ${viewMode === 'agent' 
                                ? 'bg-cyan-600/90 text-white shadow-lg shadow-cyan-900/20' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                        `}
                    >
                        <RiRobot2Line size={14} /> 
                        <span className="hidden sm:inline">Agent</span>
                    </button>
                    <button
                        onClick={() => setViewMode('studio')}
                        className={`
                            relative flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                            ${viewMode === 'studio' 
                                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-900/20' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                        `}
                    >
                        <StudioIcon /> 
                        <span className="hidden sm:inline">Studio</span>
                    </button>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-950/50 p-1 rounded-xl border border-gray-800">
                        {viewMode === 'agent' && (
                            <button 
                                onClick={handleClearChat} 
                                disabled={messages.length === 0} 
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent" 
                                title="Clear Chat"
                            >
                                <DeleteIcon />
                            </button>
                        )}
                        <button 
                            onClick={() => setIsCodeViewerSidebarOpen(true)} 
                            disabled={!selectedFunction} 
                            className={`p-2 rounded-lg transition-colors ${selectedFunction ? 'text-purple-400 hover:bg-purple-500/10' : 'text-gray-600 cursor-not-allowed'}`}
                            title={selectedFunction ? "View Function Code" : "Select a function to view code"}
                        >
                            <CodeIcon />
                        </button>
                        <button 
                            onClick={() => setIsLogSidebarOpen(true)} 
                            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="View Logs"
                        >
                            <TerminalIcon />
                        </button>
                    </div>

                    <div className="group relative z-50">
                        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-gray-300 hover:border-cyan-500/50 hover:text-white transition-all shadow-md">
                            <UserIcon />
                        </button>
                        <div className="absolute right-0 top-full mt-3 w-56 py-1 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
                            <div className="px-4 py-3 border-b border-gray-800">
                                 <p className="text-sm text-white font-medium truncate">{currentUser.name}</p>
                                 <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                            </div>
                            <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2">
                                <LogoutIcon /> Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
