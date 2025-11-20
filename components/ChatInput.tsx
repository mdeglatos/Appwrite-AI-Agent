import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AttachmentIcon, SendIcon, LoadingSpinnerIcon, CloseIcon, FileIcon } from './Icons';

interface ChatInputProps {
    onSubmit: (text: string) => void;
    selectedFiles: File[];
    onFileSelect: (files: File[] | null) => void;
    isLoading: boolean;
    isDisabled: boolean;
    placeholder: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, selectedFiles, onFileSelect, isLoading, isDisabled, placeholder }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${Math.min(scrollHeight, 160)}px`;
        }
    }, [input]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() || selectedFiles.length > 0) {
            onSubmit(input);
            setInput('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFormSubmit(e as any);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(Array.from(e.target.files));
        }
        if (e.target) e.target.value = '';
    };

    const handleRemoveFile = (fileToRemove: File) => {
        const newFiles = selectedFiles.filter(f => f !== fileToRemove);
        onFileSelect(newFiles.length > 0 ? newFiles : null);
    };

    const canSubmit = !isDisabled && (!!input.trim() || selectedFiles.length > 0);

    return (
        <div className="max-w-4xl mx-auto w-full px-4 pb-6 pt-2">
            <form onSubmit={handleFormSubmit} className="relative">
                {/* File Preview Area */}
                {selectedFiles.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-3 flex flex-wrap gap-2 w-full px-1 animate-fade-in">
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-800/90 backdrop-blur border border-gray-700 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-200">
                                <FileIcon size={16} />
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)}KB</span>
                                <button onClick={() => handleRemoveFile(file)} className="ml-1 text-gray-400 hover:text-red-400 p-0.5 rounded-full hover:bg-gray-700">
                                    <CloseIcon size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`
                    relative flex items-end gap-2 bg-gray-900/80 backdrop-blur-xl border rounded-2xl p-2 shadow-2xl transition-all duration-200
                    ${isDisabled ? 'border-gray-800 opacity-70' : 'border-gray-700 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50'}
                `}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                    />
                    
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isDisabled}
                        className="p-3 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-xl transition-colors disabled:cursor-not-allowed"
                        title="Attach Files"
                    >
                        <AttachmentIcon size={20} />
                    </button>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent py-3 max-h-40 min-h-[44px] focus:outline-none text-gray-100 placeholder-gray-500 resize-none custom-scrollbar text-[15px] leading-relaxed"
                        disabled={isDisabled}
                    />

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`
                            p-3 rounded-xl flex-shrink-0 transition-all duration-200
                            ${canSubmit 
                                ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/30 transform active:scale-95' 
                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
                        `}
                    >
                        {isLoading ? <LoadingSpinnerIcon /> : <SendIcon />}
                    </button>
                </div>
                
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-600">AI can make mistakes. Check important info.</p>
                </div>
            </form>
        </div>
    );
};