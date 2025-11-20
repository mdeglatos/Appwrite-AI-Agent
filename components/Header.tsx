
import React from 'react';
import type { Models } from 'appwrite';
import type { UserPrefs, AppwriteProject, Message, AppwriteFunction } from '../types';
import { MenuIcon, DeleteIcon, CodeIcon, TerminalIcon, UserIcon, LogoutIcon } from './Icons';

interface HeaderProps {
    isLeftSidebarOpen: boolean;
    setIsLeftSidebarOpen: (isOpen: boolean) => void;
    activeProject: AppwriteProject | null;
    currentUser: Models.User<UserPrefs>;
    onLogout: () => void;
    isCodeModeActive: boolean;
    handleToggleCodeMode: () => void;
    messages: Message[];
    handleClearChat: () => void;
    selectedFunction: AppwriteFunction | null;
    isCodeViewerSidebarOpen: boolean;
    setIsCodeViewerSidebarOpen: (isOpen: boolean) => void;
    setIsLogSidebarOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    isLeftSidebarOpen, setIsLeftSidebarOpen,
    activeProject, currentUser, onLogout,
    isCodeModeActive, handleToggleCodeMode,
    messages, handleClearChat,
    selectedFunction, setIsCodeViewerSidebarOpen,
    setIsLogSidebarOpen
}) => {
    return (
        <header className="h-16 px-4 sm:px-6 border-b border-white/5 bg-gray-900/60 backdrop-blur-md flex justify-between items-center flex-shrink-0 z-20 relative">
            <div className="flex items-center gap-3 sm:gap-5">
                <button 
                    onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
                    className={`p-2 rounded-lg transition-colors ${isLeftSidebarOpen ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    aria-label="Toggle sidebar"
                >
                    <MenuIcon />
                </button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        <h1 className="text-lg font-bold tracking-tight text-gray-100">DV Appwrite Studio</h1>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        Project: 
                        <span className={`font-medium truncate max-w-[120px] sm:max-w-xs ${activeProject ? 'text-cyan-300' : 'text-gray-500'}`}>
                            {activeProject?.name || 'No Project Selected'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Mode Switcher */}
                <div className="hidden md:flex items-center bg-gray-800/50 p-1 rounded-full border border-white/5">
                    <button
                        onClick={isCodeModeActive ? handleToggleCodeMode : undefined}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${!isCodeModeActive ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Agent
                    </button>
                    <button
                        onClick={!isCodeModeActive ? handleToggleCodeMode : undefined}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${isCodeModeActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Code
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-700/50 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleClearChat} 
                        disabled={messages.length === 0} 
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30" 
                        title="Clear Chat"
                    >
                        <DeleteIcon />
                    </button>
                    <button 
                        onClick={() => setIsCodeViewerSidebarOpen(true)} 
                        disabled={!isCodeModeActive || !selectedFunction} 
                        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30"
                        title="View Code"
                    >
                        <CodeIcon />
                    </button>
                    <button 
                        onClick={() => setIsLogSidebarOpen(true)} 
                        className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="View Logs"
                    >
                        <TerminalIcon />
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-700/50 mx-1 hidden sm:block"></div>

                <div className="group relative">
                    <div className="flex items-center gap-2 p-1 pl-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full border border-white/5 transition-colors cursor-default">
                        <span className="text-xs font-medium text-gray-300 hidden sm:block max-w-[80px] truncate">{currentUser.name}</span>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-gray-300 border border-gray-600">
                            <UserIcon />
                        </div>
                    </div>
                    <div className="absolute right-0 top-full mt-2 w-32 py-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700/50 flex items-center gap-2">
                            <LogoutIcon /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};