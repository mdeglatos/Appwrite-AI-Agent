import React, { useState, useEffect, useMemo } from 'react';
import type { UnpackedFile } from '../tools/functionsTools';
import { CloseIcon, CopyIcon, FileIcon, CheckIcon, CodeIcon, LoadingSpinnerIcon, FolderIcon, FileAddIcon, FolderAddIcon, EditIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

// =================================================================
// Types and Helpers for File Tree
// =================================================================

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: { [key: string]: TreeNode };
}

const buildFileTree = (files: UnpackedFile[]): TreeNode => {
    const root: TreeNode = { name: 'root', path: '', type: 'folder', children: {} };

    for (const file of files) {
        const parts = file.name.split('/');
        let currentNode = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!currentNode.children) {
                currentNode.children = {};
            }

            if (!currentNode.children[part]) {
                const isFile = i === parts.length - 1;
                currentNode.children[part] = {
                    name: part,
                    path: parts.slice(0, i + 1).join('/'),
                    type: isFile ? 'file' : 'folder',
                    children: isFile ? undefined : {},
                };
            }
            currentNode = currentNode.children[part];
        }
    }
    return root;
};


// =================================================================
// Sub-Components
// =================================================================

interface FileTreeItemProps {
    node: TreeNode;
    level: number;
    activeFilePath: string | null;
    onFileSelect: (path: string) => void;
    originalFiles: UnpackedFile[];
    editedFiles: UnpackedFile[];
    onFileAdd: (path: string) => void;
    onFileDelete: (path: string, type: 'file' | 'folder') => void;
    onFileRename: (oldPath: string, newPath: string, type: 'file' | 'folder') => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level, activeFilePath, onFileSelect, originalFiles, editedFiles, onFileAdd, onFileDelete, onFileRename }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isRenaming, setIsRenaming] = useState(false);
    const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming || isCreating) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming, isCreating]);

    if (!node) return null;

    const hasChanged = useMemo(() => {
        if (node.type === 'file') {
            const original = originalFiles.find(f => f.name === node.path)?.content;
            const edited = editedFiles.find(f => f.name === node.path)?.content;
            return original !== edited;
        }
        return false;
    }, [node.path, node.type, originalFiles, editedFiles]);

    const handleRenameSubmit = (newName: string) => {
        setIsRenaming(false);
        if (newName && newName !== node.name) {
            const parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
            const newPath = parentPath ? `${parentPath}/${newName}` : newName;
            onFileRename(node.path, newPath, node.type);
        }
    };

    const handleCreateSubmit = (newName: string) => {
        if (newName && isCreating) {
            const newPath = node.path ? `${node.path}/${newName}` : newName;
            if (isCreating === 'file') {
                onFileAdd(newPath);
            } else { // folder
                // Creating a folder is implicit when a file is added to its path.
                // Here, we can add a placeholder file to make the folder appear.
                // An improved implementation might handle "empty" folders differently.
                onFileAdd(`${newPath}/.gitkeep`);
            }
        }
        setIsCreating(null);
    };


    const renderInput = (defaultValue: string, onConfirm: (value: string) => void) => (
        <div className="pl-4" style={{ paddingLeft: `${level * 1 + 1}rem`}}>
            <div className="flex items-center gap-1.5 py-1">
                 {isCreating === 'folder' || node.type === 'folder' ? <FolderIcon /> : <FileIcon size={16} />}
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={defaultValue}
                    className="w-full bg-gray-600 text-gray-100 text-sm p-0.5 rounded-sm outline-none focus:ring-1 focus:ring-cyan-500"
                    onBlur={(e) => onConfirm(e.target.value)}
                    onKeyDown={(e) => { 
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onConfirm(e.currentTarget.value);
                        } else if (e.key === 'Escape') {
                            setIsRenaming(false); 
                            setIsCreating(null);
                        } 
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
    
    if (isRenaming) {
        return renderInput(node.name, handleRenameSubmit);
    }


    const children = node.children ? Object.values(node.children).sort((a: TreeNode, b: TreeNode) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
    }) : [];

    return (
        <div>
            <div
                className={`group flex items-center justify-between gap-1 p-1 rounded-md transition-colors text-sm ${activeFilePath === node.path ? 'bg-purple-600/20' : 'hover:bg-gray-700/60'}`}
                style={{ paddingLeft: `${level * 1}rem` }}
            >
                <div 
                    className="flex items-center gap-1.5 flex-1 cursor-pointer truncate" 
                    onClick={() => {
                        if (node.type === 'file') onFileSelect(node.path);
                        if (node.type === 'folder') setIsExpanded(!isExpanded);
                    }}
                >
                    {node.type === 'folder' ? (
                        <>
                            {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
                            <FolderIcon />
                        </>
                    ) : <FileIcon size={16} />}
                    <span className="truncate">{node.name}</span>
                    {hasChanged && <span className="ml-1 w-1.5 h-1.5 bg-cyan-400 rounded-full" title="Unsaved changes"></span>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    {node.type === 'folder' && <>
                        <button onClick={(e) => { e.stopPropagation(); setIsCreating('file'); }} className="p-0.5 rounded hover:bg-gray-600" title="New File"><FileAddIcon size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setIsCreating('folder'); }} className="p-0.5 rounded hover:bg-gray-600" title="New Folder"><FolderAddIcon size={16} /></button>
                    </>}
                    <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="p-0.5 rounded hover:bg-gray-600" title="Rename"><EditIcon size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onFileDelete(node.path, node.type); }} className="p-0.5 rounded hover:bg-gray-600" title="Delete"><DeleteIcon /></button>
                </div>
            </div>
            
            {isCreating && renderInput('', handleCreateSubmit)}
            
            {node.type === 'folder' && isExpanded && (
                <div>
                    {children.map((child: TreeNode) => (
                        <FileTreeItem
                            key={child.path}
                            node={child}
                            level={level + 1}
                            activeFilePath={activeFilePath}
                            onFileSelect={onFileSelect}
                            originalFiles={originalFiles}
                            editedFiles={editedFiles}
                            onFileAdd={onFileAdd}
                            onFileDelete={onFileDelete}
                            onFileRename={onFileRename}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


// =================================================================
// Main Component
// =================================================================

interface CodeViewerSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    files: UnpackedFile[];
    originalFiles: UnpackedFile[];
    functionName: string;
    onFileContentChange: (fileName: string, newContent: string) => void;
    onDeploy: () => void;
    isDeploying: boolean;
    hasUnsavedChanges: boolean;
    onFileAdd: (path: string) => void;
    onFileDelete: (path: string, type: 'file' | 'folder') => void;
    onFileRename: (oldPath: string, newPath: string, type: 'file' | 'folder') => void;
}

export const CodeViewerSidebar: React.FC<CodeViewerSidebarProps> = ({ 
    isOpen, 
    onClose, 
    files, 
    originalFiles,
    functionName, 
    onFileContentChange, 
    onDeploy, 
    isDeploying,
    hasUnsavedChanges,
    onFileAdd,
    onFileDelete,
    onFileRename
}) => {
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    useEffect(() => {
        // When the function or its base files change, select the first file as the default view.
        // We use `originalFiles` as a dependency because it doesn't change on every keystroke in the editor,
        // which was causing the active file to reset while typing.
        if (originalFiles.length > 0) {
            const firstFile = originalFiles.find(f => f.name.endsWith('.js') || f.name.endsWith('.ts')) || originalFiles[0];
            setActiveFilePath(firstFile.name);
        } else {
            setActiveFilePath(null);
        }
        // We also depend on functionName to ensure this runs if the function changes but files are momentarily the same.
    }, [originalFiles, functionName]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const fileTree = useMemo(() => buildFileTree(files), [files]);
    const activeFile = useMemo(() => files.find(f => f.name === activeFilePath), [files, activeFilePath]);

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
        onFileContentChange(activeFile.name, e.target.value);
    };
    
    const rootNode = buildFileTree(files);

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`fixed inset-y-0 right-0 z-40 bg-gray-800/90 backdrop-blur-sm text-gray-300 flex flex-col border-l border-gray-700 transition-transform duration-300 ease-in-out w-full max-w-4xl transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
                                disabled={!hasUnsavedChanges || isDeploying || files.length === 0}
                                className="flex items-center justify-center gap-2 px-4 py-2 w-24 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeploying ? <LoadingSpinnerIcon /> : 'Deploy'}
                            </button>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-600" aria-label="Close code viewer">
                                <CloseIcon />
                            </button>
                        </div>
                    </header>
                    
                    <div className="flex flex-1 min-h-0">
                        {/* File Explorer Pane */}
                        <div className="w-64 flex-shrink-0 bg-gray-800/50 border-r border-gray-700 flex flex-col">
                            <div className="flex-1 overflow-y-auto p-2">
                                {rootNode.children && Object.keys(rootNode.children).length > 0 ? (
                                    <FileTreeItem
                                        node={rootNode}
                                        level={0}
                                        activeFilePath={activeFilePath}
                                        onFileSelect={setActiveFilePath}
                                        originalFiles={originalFiles}
                                        editedFiles={files}
                                        onFileAdd={onFileAdd}
                                        onFileDelete={onFileDelete}
                                        onFileRename={onFileRename}
                                    />
                                ) : (
                                    <div className="text-center text-sm text-gray-400 p-4">
                                        <p>No files in this function.</p>
                                        <button onClick={() => onFileAdd('index.js')} className="mt-2 text-cyan-400 hover:underline">Create index.js</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Editor Pane */}
                        <div className="relative flex-1 min-h-0 bg-gray-900/70">
                            {activeFile ? (
                                <>
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
                                        value={activeFile.content}
                                        onChange={handleFileContentChange}
                                        className="w-full h-full p-4 bg-transparent text-sm text-gray-200 font-mono whitespace-pre resize-none focus:outline-none"
                                        spellCheck="false"
                                        aria-label={`Code editor for ${activeFile.name}`}
                                    />
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    {files.length > 0 ? 'Select a file to view its content' : 'Create a file to start coding'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
