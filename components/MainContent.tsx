import React, { useRef, useEffect } from 'react';
import type { Models } from 'appwrite';
import { RiRobot2Line } from 'react-icons/ri';
import type { Message, AppwriteProject, AppwriteFunction, UserPrefs } from '../types';
import { ChatMessage } from './ChatMessage';
import { LoadingSpinnerIcon } from './Icons';

interface MainContentProps {
    messages: Message[];
    activeProject: AppwriteProject | null;
    isCodeModeActive: boolean;
    selectedFunction: AppwriteFunction | null;
    isFunctionContextLoading: boolean;
    error: string | null;
    currentUser: Models.User<UserPrefs>;
    isLeftSidebarOpen: boolean;
    setIsLeftSidebarOpen: (isOpen: boolean) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
    messages,
    activeProject,
    isCodeModeActive,
    selectedFunction,
    isFunctionContextLoading,
    error,
    currentUser,
    setIsLeftSidebarOpen,
}) => {
    const chatContainerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const EmptyState = ({ title, description, icon, action }: { title: string, description: string, icon?: React.ReactNode, action?: React.ReactNode }) => (
         <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-cyan-900/10 border border-gray-800">
                {icon || <RiRobot2Line size={40} className="text-cyan-500" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-200 mb-2">{title}</h2>
            <p className="text-gray-400 max-w-md mb-8 leading-relaxed">{description}</p>
            {action}
        </div>
    );

    const renderWelcomeMessage = () => {
        if (isFunctionContextLoading) {
             return <EmptyState 
                title="Syncing Context" 
                description="Loading function code and dependencies..." 
                icon={<LoadingSpinnerIcon />} 
             />;
        }
        if (!activeProject) {
            return <EmptyState 
                title={`Welcome, ${currentUser.name}`} 
                description="To get started, create or select an Appwrite project from the sidebar."
                action={
                     <button onClick={() => setIsLeftSidebarOpen(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-[1.02]">
                        Open Project Menu
                    </button>
                }
            />;
        }
        if (isCodeModeActive && !selectedFunction) {
             return <EmptyState 
                title="Code Mode Active" 
                description="Select a function from the context bar to start editing, or ask me to create a new one."
                icon={<span className="text-4xl">👨‍💻</span>}
             />;
        }
        if (!isCodeModeActive) {
             return <EmptyState 
                title="Agent Ready" 
                description={`I'm connected to "${activeProject.name}". Ask me to list documents, check logs, or manage your database.`}
             />;
        }
        return null;
    };

    return (
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 relative">
             {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
                backgroundSize: '24px 24px' 
            }}></div>

            <div className="relative z-0 max-w-4xl mx-auto min-h-full flex flex-col space-y-6 pb-4">
                {messages.length === 0 && renderWelcomeMessage()}
                
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                
                {error && (
                    <div className="mx-auto w-full max-w-2xl mt-4 animate-fade-in">
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl backdrop-blur-sm flex items-start gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <p className="font-semibold text-red-400">System Error</p>
                                <p className="text-sm opacity-90">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};