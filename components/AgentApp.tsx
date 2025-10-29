import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Models } from 'appwrite';
import type { UserPrefs, AppwriteProject, ModelMessage } from '../types';

// Custom Hooks
import { useProjects } from '../hooks/useProjects';
import { useAppContext } from '../hooks/useAppContext';
import { useSettings } from '../hooks/useSettings';
import { useChatSession } from '../hooks/useChatSession';
import { useCodeMode } from '../hooks/useCodeMode';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

// UI Components
import { LeftSidebar } from './LeftSidebar';
import { LogSidebar } from './LogSidebar';
import { CodeViewerSidebar } from './CodeViewerSidebar';
import { ConfirmationModal } from './ConfirmationModal';
import { Header } from './Header';
import { ContextBar } from './ContextBar';
import { MainContent } from './MainContent';
import { Footer } from './Footer';
import { DragAndDropOverlay } from './DragAndDropOverlay';

interface AgentAppProps {
    currentUser: Models.User<UserPrefs>;
    onLogout: () => void;
    refreshUser: () => Promise<void>;
}

const MIN_SIDEBAR_WIDTH = 288; // w-72
const MAX_SIDEBAR_WIDTH = 640; // w-160

export const AgentApp: React.FC<AgentAppProps> = ({ currentUser, onLogout, refreshUser }) => {
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [isLogSidebarOpen, setIsLogSidebarOpen] = useState(false);
    const [sessionLogs, setSessionLogs] = useState<string[]>([]);
    
    const [confirmationState, setConfirmationState] = useState<{
        isOpen: boolean; title: string; message: string; confirmText: string; confirmButtonClass: string; onConfirm: () => void;
    } | null>(null);

    const logCallback = useCallback((log: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setSessionLogs(prev => [...prev, `[${timestamp}] ${log}`]);
    }, []);

    const {
        projects, activeProject, handleSaveProject, handleDeleteProject, handleSelectProject,
        error: projectError, setError: setProjectError
    } = useProjects(currentUser, refreshUser, logCallback);

    const {
        activeTools, handleToolsChange,
        geminiApiKey, geminiModel, GEMINI_MODELS, geminiThinkingEnabled, handleSaveGeminiSettings,
        sidebarWidth, handleSidebarWidthChange
    } = useSettings(currentUser, refreshUser, logCallback);
    
    const [currentSidebarWidth, setCurrentSidebarWidth] = useState(sidebarWidth);
    const [isResizing, setIsResizing] = useState(false);

    const widthRef = useRef(currentSidebarWidth);
    useEffect(() => {
        widthRef.current = currentSidebarWidth;
    }, [currentSidebarWidth]);

    useEffect(() => {
        if (!isResizing) {
            setCurrentSidebarWidth(sidebarWidth);
        }
    }, [sidebarWidth]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) {
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = e.clientX;
            const constrainedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(newWidth, MAX_SIDEBAR_WIDTH));
            setCurrentSidebarWidth(constrainedWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            handleSidebarWidthChange(widthRef.current);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleSidebarWidthChange]);

    const {
        databases, collections, buckets, functions,
        selectedDatabase, selectedCollection, selectedBucket, selectedFunction,
        setSelectedDatabase, setSelectedCollection, setSelectedBucket, setSelectedFunction,
        isContextLoading, error: contextError, setError: setContextError, refreshContextData,
    } = useAppContext(activeProject, logCallback);

    const {
        isCodeModeActive, isFunctionContextLoading, functionFiles, editedFunctionFiles,
        isCodeViewerSidebarOpen, isDeploying, setIsCodeViewerSidebarOpen,
        handleToggleCodeMode, handleCodeGenerated, handleFileContentChange,
        handleFileAdd, handleFileDelete, handleFileRename, handleDeployChanges,
        error: codeModeError, setError: setCodeModeError,
        codeModeEvent, clearCodeModeEvent,
    } = useCodeMode(activeProject, selectedFunction, logCallback);
    
    const {
        messages, setMessages, isLoading, error: chatError, setError: setChatError,
        selectedFiles, handleSendMessage, handleClearChat, handleFileSelect
    } = useChatSession({
        activeProject, selectedDatabase, selectedCollection, selectedBucket, selectedFunction,
        isCodeModeActive, activeTools, geminiModel, geminiThinkingEnabled, geminiApiKey, logCallback,
        onCodeGenerated: isCodeModeActive ? handleCodeGenerated : undefined,
    });
    
    useEffect(() => {
        if (codeModeEvent) {
            const modelMessage: ModelMessage = {
                id: crypto.randomUUID(), role: 'model', content: codeModeEvent.message,
            };
            setMessages(prev => [...prev, modelMessage]);
            clearCodeModeEvent();
        }
    }, [codeModeEvent, setMessages, clearCodeModeEvent]);

    const error = projectError || contextError || chatError || codeModeError;
    const setError = useCallback((msg: string | null) => {
        setProjectError(msg);
        setContextError(msg);
        setChatError(msg);
        setCodeModeError(msg);
    }, [setProjectError, setContextError, setChatError, setCodeModeError]);

    // Confirmation Modals Logic
    const requestProjectDeletion = useCallback((projectId: string, projectName: string) => {
        setConfirmationState({
            isOpen: true, title: `Delete Project "${projectName}"?`, message: 'This action is irreversible.',
            confirmText: 'Delete Project', confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: () => { handleDeleteProject(projectId); setConfirmationState(null); },
        });
    }, [handleDeleteProject]);
    
    const requestModeChange = useCallback(() => {
        const changingTo = !isCodeModeActive;
        if (messages.length > 0) {
            setConfirmationState({
                isOpen: true, title: `Switch to ${changingTo ? "'Code Mode'" : "'Agent Mode'"}?`,
                message: 'Switching modes will start a new session and clear your current chat history.',
                confirmText: 'Switch Mode', confirmButtonClass: 'bg-cyan-600 hover:bg-cyan-700',
                onConfirm: () => { 
                    setMessages([]);
                    handleToggleCodeMode(!isCodeModeActive); 
                    setConfirmationState(null); 
                },
            });
        } else {
            handleToggleCodeMode(!isCodeModeActive);
        }
    }, [isCodeModeActive, messages.length, handleToggleCodeMode, setMessages]);

    const requestFileDelete = useCallback((path: string, type: 'file' | 'folder') => {
        setConfirmationState({
            isOpen: true, title: `Delete ${type} "${path}"?`, message: `This action is irreversible.`,
            confirmText: `Delete ${type}`, confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: () => { handleFileDelete(path, type); setConfirmationState(null); },
        });
    }, [handleFileDelete]);
    
    const { isDragging, ...dragHandlers } = useDragAndDrop(handleFileSelect);
    
    const isChatDisabled = isLoading || !activeProject || isFunctionContextLoading || isDeploying;
    const hasUnsavedCodeChanges = functionFiles && editedFunctionFiles ? JSON.stringify(functionFiles) !== JSON.stringify(editedFunctionFiles) : false;

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
             <LeftSidebar
                isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)}
                projects={projects} activeProject={activeProject} onSave={handleSaveProject}
                onDelete={requestProjectDeletion} onSelect={(p: AppwriteProject) => { handleSelectProject(p); if (window.innerWidth < 768) { setIsLeftSidebarOpen(false); } }}
                activeTools={activeTools} onToolsChange={handleToolsChange}
                geminiApiKey={geminiApiKey} geminiModel={geminiModel} geminiModels={GEMINI_MODELS}
                geminiThinkingEnabled={geminiThinkingEnabled} onSaveGeminiSettings={handleSaveGeminiSettings}
                width={isLeftSidebarOpen ? currentSidebarWidth : 0} 
                isResizing={isResizing} 
                onResizeStart={handleResizeMouseDown}
            />
            <div className="flex flex-1 flex-col min-w-0 relative" {...dragHandlers}>
                <Header
                    isLeftSidebarOpen={isLeftSidebarOpen} setIsLeftSidebarOpen={setIsLeftSidebarOpen}
                    activeProject={activeProject} currentUser={currentUser} onLogout={onLogout}
                    isCodeModeActive={isCodeModeActive} handleToggleCodeMode={requestModeChange}
                    messages={messages} handleClearChat={handleClearChat}
                    selectedFunction={selectedFunction} isCodeViewerSidebarOpen={isCodeViewerSidebarOpen}
                    setIsCodeViewerSidebarOpen={setIsCodeViewerSidebarOpen} setIsLogSidebarOpen={setIsLogSidebarOpen}
                />
                
                {activeProject && (
                    <ContextBar 
                        databases={databases} collections={collections} buckets={buckets} functions={functions}
                        selectedDatabase={selectedDatabase} selectedCollection={selectedCollection}
                        selectedBucket={selectedBucket} selectedFunction={selectedFunction}
                        onDatabaseSelect={setSelectedDatabase} onCollectionSelect={setSelectedCollection}
                        onBucketSelect={setSelectedBucket} onFunctionSelect={setSelectedFunction}
                        isLoading={isContextLoading} onRefresh={refreshContextData}
                    />
                )}
                
                <MainContent
                    messages={messages} activeProject={activeProject}
                    isCodeModeActive={isCodeModeActive} selectedFunction={selectedFunction}
                    isFunctionContextLoading={isFunctionContextLoading} error={error}
                    currentUser={currentUser} isLeftSidebarOpen={isLeftSidebarOpen} setIsLeftSidebarOpen={setIsLeftSidebarOpen}
                />
                
                <Footer
                    onSubmit={handleSendMessage} selectedFiles={selectedFiles}
                    onFileSelect={handleFileSelect} isLoading={isLoading}
                    isDisabled={isChatDisabled} activeProject={activeProject}
                />

                <DragAndDropOverlay isDragging={isDragging} />
            </div>

            <CodeViewerSidebar
                isOpen={isCodeViewerSidebarOpen} onClose={() => setIsCodeViewerSidebarOpen(false)}
                files={editedFunctionFiles || []} originalFiles={functionFiles || []}
                functionName={selectedFunction?.name || '...'}
                onFileContentChange={handleFileContentChange} onDeploy={handleDeployChanges}
                isDeploying={isDeploying} hasUnsavedChanges={hasUnsavedCodeChanges}
                onFileAdd={handleFileAdd} onFileDelete={requestFileDelete} onFileRename={handleFileRename}
            />
            <LogSidebar isOpen={isLogSidebarOpen} onClose={() => setIsLogSidebarOpen(false)} logs={sessionLogs} onClear={() => setSessionLogs([])} />

            {confirmationState?.isOpen && (
                <ConfirmationModal {...confirmationState} onClose={() => setConfirmationState(null)} />
            )}
        </div>
    );
};
