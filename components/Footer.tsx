import React from 'react';
import { ChatInput } from './ChatInput';

interface FooterProps {
    onSubmit: (text: string) => void;
    selectedFiles: File[];
    onFileSelect: (files: File[] | null) => void;
    isLoading: boolean;
    isDisabled: boolean;
    activeProject: any; // Using `any` to avoid full AppwriteProject type dependency here
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
        <footer className="p-4 border-t border-gray-700 bg-gray-800 shrink-0">
            <ChatInput
                onSubmit={onSubmit}
                selectedFiles={selectedFiles}
                onFileSelect={onFileSelect}
                isLoading={isLoading}
                isDisabled={isDisabled}
                placeholder={activeProject ? "Type a command, paste an image, or drop files..." : "Please select a project to start..."}
            />
        </footer>
    );
};
