import React, { useState, useEffect } from 'react';
import type { UnpackedFile } from '../tools/functionsTools';
import { CloseIcon, CopyIcon, FileIcon, CheckIcon, CodeIcon, LoadingSpinnerIcon } from './Icons';

interface CodeViewerSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    files: UnpackedFile[];
    originalFiles: UnpackedFile[];
    functionName: string;
    onCodeChange: (fileName: string, newContent: string) => void;
    onDeploy: () => void;
    isDeploying: boolean;
    hasUnsavedChanges: boolean;
}

export const CodeViewerSidebar: React.FC<CodeViewerSidebarProps> = ({ 
    isOpen, 
    onClose, 
    files, 
    originalFiles,
    functionName, 
    onCodeChange, 
    onDeploy, 
    isDeploying,
    hasUnsavedChanges 
}) => {
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    // Reset to first file when the function context changes (i.e., new files are loaded)
    useEffect(() => {
        setActiveFileIndex(0);
    }, [files]);
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const activeFile = files[activeFileIndex];

    const handleCopy = () => {
        if (!activeFile) return;
        navigator.clipboard.writeText(activeFile.content).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus(null), 2000);
        }, (err) => {
            setCopyStatus('Failed!');
            console.error('Could not copy text: ', err);
            setTimeout(() => setCopyStatus(null), 2000);
        });
    };
    
    const handleFileContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!activeFile) return;
        onCodeChange(activeFile.name, e.target.value);
    };


    if (files.length === 0) {
        return null; // Don't render anything if there are no files
    }

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`
                    fixed inset-y-0 right-0 z-40
                    bg-gray-800/90 backdrop-blur-sm text-gray-300 flex flex-col border-l border-gray-700
                    transition-transform duration-300 ease-in-out
                    w-full max-w-2xl
                    transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
                aria-labelledby="code-viewer-sidebar-title"
            >
                <div className="flex flex-col h-full">
                    <header className="p-4 border-b border-gray-700 shadow-md bg-gray-900/50 flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <CodeIcon />
                            <h2 id="code-viewer-sidebar-title" className="text-lg font-bold text-purple-300">
                                Code: <span className="font-mono text-purple-200">{functionName}</span>
                            </h2>
                        </div>
                         <div className="flex items-center gap-2">
                            <button
                                onClick={onDeploy}
                                disabled={!hasUnsavedChanges || isDeploying}
                                className="flex items-center justify-center gap-2 px-4 py-2 w-24 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeploying ? <LoadingSpinnerIcon /> : 'Deploy'}
                            </button>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-600" aria-label="Close code viewer">
                                <CloseIcon />
                            </button>
                        </div>
                    </header>
                    
                    <div className="flex border-b border-gray-700 bg-gray-800/50 overflow-x-auto flex-shrink-0">
                        {files.map((file, index) => {
                             const hasChanged = originalFiles.find(f => f.name === file.name)?.content !== file.content;
                             return (
                                <button
                                    key={file.name}
                                    onClick={() => setActiveFileIndex(index)}
                                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                                        index === activeFileIndex
                                            ? 'border-purple-400 text-purple-300 bg-gray-700/50'
                                            : 'border-transparent text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                                    }`}
                                    aria-current={index === activeFileIndex ? 'page' : undefined}
                                >
                                    {hasChanged && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full" title="Unsaved changes"></span>
                                    )}
                                    <FileIcon size={16} />
                                    {file.name}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative flex-1 min-h-0 bg-gray-900/70">
                        <div className="absolute top-2 right-2 z-10">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-xs font-semibold transition-all"
                            >
                                {copyStatus === 'Copied!' ? <CheckIcon /> : <CopyIcon />}
                                {copyStatus || 'Copy'}
                            </button>
                        </div>
                        <textarea
                            value={activeFile ? activeFile.content : 'No file selected.'}
                            onChange={handleFileContentChange}
                            disabled={!activeFile}
                            className="w-full h-full p-4 bg-transparent text-sm text-gray-200 font-mono whitespace-pre resize-none focus:outline-none"
                            spellCheck="false"
                            aria-label={`Code editor for ${activeFile?.name}`}
                        />
                    </div>
                </div>
            </aside>
        </>
    );
};