import React, { useRef, useEffect } from 'react';
import type { Models } from 'appwrite';
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

    const renderWelcomeMessage = () => {
        if (isFunctionContextLoading) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <LoadingSpinnerIcon />
                    <p className="mt-2 text-purple-300">Loading function code into context...</p>
                </div>
            );
        }
        if (!activeProject) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <h2 className="text-2xl font-semibold mb-2">Welcome, {currentUser.name}!</h2>
                    <p className="max-w-md">To get started, please add and select an Appwrite project from the sidebar.</p>
                    <button onClick={() => setIsLeftSidebarOpen(true)} className="mt-4 px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700">Open Sidebar</button>
                </div>
            );
        }
        if (isCodeModeActive && !selectedFunction) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <h2 className="text-2xl font-semibold mb-2 text-purple-300">Code Mode Activated</h2>
                    <p className="max-w-lg">Please select a function from the context bar above to load its code for editing.</p>
                    <p className="text-sm mt-2 max-w-lg">If you want to create a new function, you can just ask, for example: "Create a function to handle user signups."</p>
                </div>
            );
        }
        if (!isCodeModeActive) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <h2 className="text-2xl font-semibold mb-2">Project '{activeProject.name}' is active.</h2>
                    <p className="max-w-md">Ask me anything about your project, like "list databases" or "create a document".</p>
                    <p className="text-sm mt-2 max-w-md">You can select a default database, collection, and bucket above to provide more context to the agent.</p>
                </div>
            );
        }
        return null; // A message for code mode with a function selected is handled by the initial message from the hook
    };

    return (
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && renderWelcomeMessage()}
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            {error && (
                <div className="flex justify-start">
                    <div className="bg-red-900/50 text-red-300 p-3 rounded-lg max-w-2xl">
                        <p className="font-bold">System Error</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}
        </main>
    );
};