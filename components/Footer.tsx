
import React from 'react';
import { ChatInput } from './ChatInput';

interface FooterProps {
    onSubmit: (text: string) => void;
    selectedFiles: File[];
    onFileSelect: (files: File[] | null) => void;
    isLoading: boolean;
    isDisabled: boolean;
    activeProject: any; 
}

export const Footer: React.FC<FooterProps> = ({
    onSubmit,
    selectedFiles,
    onFileSelect,
    isLoading,
    isDisabled,
    activeProject
}) => {
    return (
        <footer className="flex-shrink-0 z-20 w-full px-4 py-4 flex justify-center bg-gray-950/20 backdrop-blur-sm border-t border-white/5">
            <div className="w-full max-w-3xl">
                <ChatInput
                    onSubmit={onSubmit}
                    selectedFiles={selectedFiles}
                    onFileSelect={onFileSelect}
                    isLoading={isLoading}
                    isDisabled={isDisabled}
                    placeholder={activeProject ? "Ask AI to manage resources or write code..." : "Select a project..."}
                />
            </div>
        </footer>
    );
};
