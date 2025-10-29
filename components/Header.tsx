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
        <header className="p-4 border-b border-gray-700 shadow-md bg-gray-800 flex justify-between items-center flex-shrink-0 z-10">
            <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} className="p-2 hover:bg-gray-700 rounded-lg" aria-label="Toggle projects and tools sidebar">
                    <MenuIcon />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-cyan-400">Appwrite AI Agent</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Active Project: <span className="font-semibold text-cyan-300">{activeProject?.name || 'None Selected'}</span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2" title={`Current mode: ${isCodeModeActive ? 'Code Mode' : 'Agent Mode'}. Click to switch.`}>
                    <span className={`font-semibold transition-colors ${!isCodeModeActive ? 'text-cyan-300' : 'text-gray-500'}`}>Agent</span>
                    <button
                        onClick={handleToggleCodeMode}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${isCodeModeActive ? 'bg-purple-600' : 'bg-gray-600'}`}
                        aria-pressed={isCodeModeActive} aria-label="Toggle Code Mode"
                    >
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isCodeModeActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`font-semibold transition-colors ${isCodeModeActive ? 'text-purple-300' : 'text-gray-500'}`}>Code</span>
                </div>

                <button onClick={handleClearChat} disabled={messages.length === 0} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-red-800 rounded-lg text-red-300 hover:text-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Clear chat history">
                    <DeleteIcon />
                    <span className="hidden sm:inline">Clear Chat</span>
                </button>
                <button onClick={() => setIsCodeViewerSidebarOpen(true)} disabled={!isCodeModeActive || !selectedFunction} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Toggle code viewer">
                    <CodeIcon />
                    <span className="hidden sm:inline">Code</span>
                </button>
                <button onClick={() => setIsLogSidebarOpen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-cyan-300" aria-label="Toggle logs sidebar">
                    <TerminalIcon />
                    <span className="hidden sm:inline">Logs</span>
                </button>
                <div className="flex items-center gap-2 p-1 pr-2 bg-gray-700/50 rounded-full border border-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon /></div>
                    <span className="text-sm font-medium hidden sm:inline truncate max-w-28">{currentUser.name}</span>
                    <button onClick={onLogout} className="ml-1 text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-600" aria-label="Logout"><LogoutIcon /></button>
                </div>
            </div>
        </header>
    );
};
