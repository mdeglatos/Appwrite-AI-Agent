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
        <footer className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none z-20 flex justify-center">
            <div className="pointer-events-auto w-full max-w-3xl">
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