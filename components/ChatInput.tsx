
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

const PreviewItem: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const isImage = file.type.startsWith('image/');

    useEffect(() => {
        let objectUrl: string | null = null;
        if (isImage) {
            objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file, isImage]);

    return (
         <div className="flex items-center justify-between text-sm bg-gray-900/50 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-700 rounded-md">
                    {isImage && previewUrl ? (
                        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <FileIcon size={20} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                    </p>
                </div>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-600 flex-shrink-0 ml-2">
                <CloseIcon size={18} />
            </button>
        </div>
    );
};

const FilePreviewList: React.FC<{ files: File[]; onRemove: (file: File) => void }> = ({ files, onRemove }) => {
    return (
        <div className="p-2 border-b border-gray-600 max-h-48 overflow-y-auto">
            <div className="space-y-2">
                {files.map((file, index) => (
                    <PreviewItem key={`${file.name}-${index}`} file={file} onRemove={() => onRemove(file)} />
                ))}
            </div>
        </div>
    );
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, selectedFiles, onFileSelect, isLoading, isDisabled, placeholder }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 200; // 200px max height
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    }, [input]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() || selectedFiles.length > 0) {
            onSubmit(input);
            setInput('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFormSubmit(e as any);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(Array.from(files));
        }
        if (e.target) {
            e.target.value = ''; // Reset to allow selecting the same file again
        }
    };

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (e.clipboardData.files.length > 0) {
            e.preventDefault();
            onFileSelect(Array.from(e.clipboardData.files));
        }
    }, [onFileSelect]);
    
    const handleRemoveFile = (fileToRemove: File) => {
        const newFiles = selectedFiles.filter(f => f !== fileToRemove);
        onFileSelect(newFiles.length > 0 ? newFiles : null);
    };

    const canSubmit = !isDisabled && (!!input.trim() || selectedFiles.length > 0);

    return (
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleFormSubmit}>
                <div className="bg-gray-700/70 border border-gray-600 rounded-2xl overflow-hidden shadow-lg focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow duration-200">
                    {selectedFiles.length > 0 && <FilePreviewList files={selectedFiles} onRemove={handleRemoveFile} />}
                    <div className="flex items-end p-2 gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            aria-hidden="true"
                            accept="image/*,text/*,application/pdf,.json,.csv,.md"
                            multiple
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isDisabled}
                            className="p-2 text-gray-300 hover:text-cyan-400 hover:bg-gray-600 rounded-full disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            aria-label="Attach file"
                        >
                            <AttachmentIcon size={24} />
                        </button>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            placeholder={placeholder}
                            className="flex-1 py-2 bg-transparent focus:outline-none text-gray-100 placeholder-gray-400 resize-none overflow-y-auto disabled:bg-transparent disabled:cursor-not-allowed"
                            style={{maxHeight: '10rem'}}
                            disabled={isDisabled}
                            aria-label="Chat input"
                        />
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-10 h-10 flex-shrink-0 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                            aria-label="Send message"
                        >
                            {isLoading ? <LoadingSpinnerIcon /> : <SendIcon />}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
