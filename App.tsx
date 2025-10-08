import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, runAI } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { LoadingSpinnerIcon, MenuIcon, TerminalIcon, UserIcon, LogoutIcon, FileUploadIcon, DeleteIcon } from './components/Icons';
import { LeftSidebar } from './components/LeftSidebar';
import { LogSidebar } from './components/LogSidebar';
import { ChatInput } from './components/ChatInput';
import { ProjectContextSelector } from './components/ProjectContextSelector';
import type { Message, AppwriteProject, UserPrefs, UserMessage, ModelMessage, Database, Collection, Bucket, AIContext } from './types';
import type { NewAppwriteProject } from './services/projectService';
import type { Chat } from '@google/genai';
import type { Models } from 'appwrite';
import { getAccount, logout, updateGeminiPrefs } from './services/authService';
import * as projectService from './services/projectService';
import LoginPage from './components/LoginPage';
import { getSdkDatabases, getSdkStorage, Query } from './services/appwrite';

// Define tool categories as a top-level constant
const toolCategories = ['database', 'storage', 'functions', 'users', 'teams'];
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<Models.User<UserPrefs> | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        setIsAuthLoading(true);
        try {
            const user = await getAccount();
            setCurrentUser(user);
        } catch (e) {
            setCurrentUser(null);
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const handleLogout = async () => {
        await logout();
        setCurrentUser(null);
    };

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
                <LoadingSpinnerIcon />
                <p className="ml-4">Checking session...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLoginSuccess={setCurrentUser} />;
    }
    
    return <AgentApp currentUser={currentUser} onLogout={handleLogout} refreshUser={refreshUser} />;
};

interface AgentAppProps {
    currentUser: Models.User<UserPrefs>;
    onLogout: () => void;
    refreshUser: () => Promise<void>;
}

// The original App component is renamed to AgentApp and represents the authenticated view
const AgentApp: React.FC<AgentAppProps> = ({ currentUser, onLogout, refreshUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [projects, setProjects] = useState<AppwriteProject[]>([]);
  const [activeProject, setActiveProject] = useState<AppwriteProject | null>(null);

  const [isLogSidebarOpen, setIsLogSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true); // Default to open on desktop
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const [activeTools, setActiveTools] = useState(() =>
    toolCategories.reduce((acc, tool) => ({ ...acc, [tool]: true }), {})
  );
  const [chat, setChat] = useState<Chat | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const geminiApiKey = currentUser.prefs.geminiApiKey || null;
  const geminiModel = currentUser.prefs.geminiModel || DEFAULT_GEMINI_MODEL;
  const geminiThinkingEnabled = currentUser.prefs.geminiThinking ?? true; // Default to enabled

  // New state for project context
  const [databases, setDatabases] = useState<Database[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(false);
  
  const CONTEXT_FETCH_LIMIT = 100;

  
  const logCallback = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSessionLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  }, []);
  
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const userProjects = await projectService.getProjects(currentUser.$id);
        setProjects(userProjects);
        
        const activeProjectId = currentUser.prefs.activeProjectId;
        if (activeProjectId) {
          const active = userProjects.find(p => p.$id === activeProjectId);
          if (active) {
            setActiveProject(active);
          } else {
            // Active project ID in prefs is stale, clear it.
            await projectService.setActiveProjectPreference(null);
            await refreshUser();
          }
        }
      } catch (e) {
        console.error("Failed to load projects from Appwrite DB", e);
        setError("Could not load your projects. Please check your Appwrite DB setup and permissions.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser, refreshUser]);

  const resetContext = useCallback(() => {
    setDatabases([]);
    setCollections([]);
    setBuckets([]);
    setSelectedDatabase(null);
    setSelectedCollection(null);
    setSelectedBucket(null);
  }, []);

  const refreshContextData = useCallback(async () => {
    if (!activeProject) {
        resetContext();
        return;
    }

    logCallback(`Refreshing context for project "${activeProject.name}"...`);
    setIsContextLoading(true);
    setError(null);

    try {
        const projectDatabases = getSdkDatabases(activeProject);
        const projectStorage = getSdkStorage(activeProject);

        // Fetch top-level context items
        const [dbResponse, bucketResponse] = await Promise.all([
            projectDatabases.list([Query.limit(CONTEXT_FETCH_LIMIT)]),
            projectStorage.listBuckets([Query.limit(CONTEXT_FETCH_LIMIT)])
        ]);
        const newDatabases: Database[] = dbResponse.databases;
        const newBuckets: Bucket[] = bucketResponse.buckets;
        setDatabases(newDatabases);
        setBuckets(newBuckets);

        // Validate selected database
        const dbStillExists = selectedDatabase && newDatabases.some(db => db.$id === selectedDatabase.$id);
        if (!dbStillExists) {
            // DB is gone, clear it and its dependents.
            setSelectedDatabase(null);
            setCollections([]);
            setSelectedCollection(null);
        } else {
            // DB still exists, refresh its collections
            logCallback(`Refreshing collections for database "${selectedDatabase.name}"...`);
            const collectionsResponse = await projectDatabases.listCollections(selectedDatabase.$id, [Query.limit(CONTEXT_FETCH_LIMIT)]);
            const newCollections: Collection[] = collectionsResponse.collections;
            setCollections(newCollections);
            
            // Validate selected collection
            const collectionStillExists = selectedCollection && newCollections.some(c => c.$id === selectedCollection.$id);
            if (!collectionStillExists) {
                setSelectedCollection(null);
            }
        }
        
        // Validate selected bucket
        const bucketStillExists = selectedBucket && newBuckets.some(b => b.$id === selectedBucket.$id);
        if (!bucketStillExists) {
            setSelectedBucket(null);
        }
        
        logCallback(`Refreshed context: Found ${newDatabases.length} databases and ${newBuckets.length} buckets.`);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to fetch project context.';
        setError(errorMessage);
        logCallback(`ERROR fetching context: ${errorMessage}`);
    } finally {
        setIsContextLoading(false);
    }
}, [activeProject, logCallback, resetContext, selectedDatabase, selectedCollection, selectedBucket, CONTEXT_FETCH_LIMIT]);


  // Fetch context data (DBs and Buckets) when active project changes
  useEffect(() => {
    if (activeProject) {
        refreshContextData();
    } else {
        resetContext();
    }
  }, [activeProject, refreshContextData, resetContext]);


  // Fetch collections when selected database changes
  useEffect(() => {
      if (!selectedDatabase || !activeProject) {
          setCollections([]);
          setSelectedCollection(null);
          return;
      }

      const fetchCollections = async () => {
          logCallback(`Fetching collections for database "${selectedDatabase.name}"...`);
          setIsContextLoading(true);
          setError(null);
          try {
              const projectDatabases = getSdkDatabases(activeProject);
              const response = await projectDatabases.listCollections(selectedDatabase.$id, [Query.limit(CONTEXT_FETCH_LIMIT)]);
              const newCollections: Collection[] = response.collections;
              setCollections(newCollections);
              logCallback(`Found ${newCollections.length} collections.`);

              // Check if selected collection still exists
              setSelectedCollection(currentCollection => {
                  if (currentCollection && !newCollections.some(c => c.$id === currentCollection.$id)) {
                      return null;
                  }
                  return currentCollection;
              });

          } catch (e) {
              const errorMessage = e instanceof Error ? e.message : 'Failed to fetch collections.';
              setError(errorMessage);
              logCallback(`ERROR fetching collections: ${errorMessage}`);
              setCollections([]);
          } finally {
              setIsContextLoading(false);
          }
      };
      fetchCollections();

  }, [selectedDatabase, activeProject, logCallback, CONTEXT_FETCH_LIMIT]);

  // Re-initialize chat session when project, tools, model, or context selection changes
  // This does NOT clear messages, to preserve history on context refreshes.
  // Message clearing is handled separately when the project is changed or cleared.
  useEffect(() => {
    if (activeProject) {
        const context: AIContext = {
            project: activeProject,
            database: selectedDatabase,
            collection: selectedCollection,
            bucket: selectedBucket
        };
        const contextDescription = [
            context.database ? `DB: ${context.database.name}` : '',
            context.collection ? `Collection: ${context.collection.name}` : '',
            context.bucket ? `Bucket: ${context.bucket.name}` : ''
        ].filter(Boolean).join(', ');

      logCallback(`Project context updated. ${contextDescription || 'No specific context.'} Initializing new AI session... (Thinking: ${geminiThinkingEnabled ? 'Enabled' : 'Disabled'})`);
      try {
        const newChat = createChatSession(activeTools, geminiModel, context, geminiThinkingEnabled, geminiApiKey);
        setChat(newChat);
        setError(null);
        logCallback('AI session ready.');
      } catch (e) {
         const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
         setError(errorMessage);
         logCallback(`ERROR: ${errorMessage}`);
         setChat(null);
      }
    } else {
      setChat(null);
      setMessages([]); // Clear messages only when there is no active project
    }
  }, [activeProject, activeTools, logCallback, geminiApiKey, geminiModel, geminiThinkingEnabled, selectedDatabase, selectedCollection, selectedBucket]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveProject = useCallback(async (projectData: NewAppwriteProject) => {
    if (!currentUser) return;
    try {
        const newProject = await projectService.addProject(projectData, currentUser.$id);
        setProjects(prev => [newProject, ...prev]);
        // Automatically select the new project
        handleSelectProject(newProject);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to save project: ${errorMessage}`);
        logCallback(`ERROR saving project: ${errorMessage}`);
    }
  }, [currentUser, logCallback]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
        await projectService.deleteProject(projectId);
        setProjects(prevProjects => {
            const newProjects = prevProjects.filter(p => p.$id !== projectId);
            if (activeProject?.$id === projectId) {
                setActiveProject(null);
                projectService.setActiveProjectPreference(null).then(refreshUser);
            }
            return newProjects;
        });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to delete project: ${errorMessage}`);
        logCallback(`ERROR deleting project: ${errorMessage}`);
    }
  }, [activeProject, logCallback, refreshUser]);

  const handleSelectProject = useCallback(async (project: AppwriteProject) => {
    if (activeProject?.$id !== project.$id) {
        setMessages([]); // Clear chat if switching to a DIFFERENT project
        resetContext(); // Clear context selections like DB, Collection, Bucket
    }
    setActiveProject(project);
    setIsLeftSidebarOpen(false); // Close sidebar on project selection
    try {
        await projectService.setActiveProjectPreference(project.$id);
        await refreshUser();
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to set active project: ${errorMessage}`);
        logCallback(`ERROR setting active project: ${errorMessage}`);
    }
  }, [logCallback, refreshUser, activeProject, resetContext]);

  const handleSaveGeminiSettings = useCallback(async (settings: { apiKey: string; model: string; thinkingEnabled: boolean; }) => {
      try {
          await updateGeminiPrefs({ 
              apiKey: settings.apiKey.trim() || null, 
              model: settings.model,
              thinking: settings.thinkingEnabled,
          });
          await refreshUser();
          logCallback('Gemini settings updated successfully.');
      } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
          setError(`Failed to save Gemini settings: ${errorMessage}`);
          logCallback(`ERROR saving Gemini settings: ${errorMessage}`);
      }
  }, [refreshUser, logCallback]);


  const handleSendMessage = async (input: string) => {
    const hasText = input.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if ((!hasText && !hasFiles) || isLoading || !activeProject || !chat) return;
    
    const userMessage: UserMessage = { 
        id: crypto.randomUUID(),
        role: 'user', 
        content: input, 
        files: selectedFiles,
    };
    
    setSessionLogs(prev => [...prev, `\n--- USER: ${input.trim()} ${hasFiles ? `(with files: ${selectedFiles.map(f => f.name).join(', ')})` : ''} ---\n`]);
    setMessages(prev => [...prev, userMessage]);
    setSelectedFiles([]); // Clear files after adding to message
    setIsLoading(true);
    setError(null);

    const updateChatCallback = (message: Message) => {
        setMessages(prev => {
            const existingIndex = prev.findIndex(m => m.id === message.id);
            if (existingIndex > -1) {
                // Update existing message for tool call status changes
                const newMessages = [...prev];
                newMessages[existingIndex] = message;
                return newMessages;
            } else {
                // Add new message (model response, new tool call)
                return [...prev, message];
            }
        });
    };

    try {
      const context: AIContext = {
          project: activeProject,
          database: selectedDatabase,
          collection: selectedCollection,
          bucket: selectedBucket
      };
      await runAI(chat, input, context, logCallback, updateChatCallback, userMessage.files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      logCallback(`ERROR: ${errorMessage}`);
      const errorMsg: ModelMessage = { id: crypto.randomUUID(), role: 'model', content: `Error: ${errorMessage}` };
      setMessages(prev => [...prev, errorMsg]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    logCallback('Chat history cleared by user.');
    // Also re-initialize the chat session for a completely clean slate
    if (activeProject) {
        try {
            const context: AIContext = {
                project: activeProject,
                database: selectedDatabase,
                collection: selectedCollection,
                bucket: selectedBucket
            };
            const newChat = createChatSession(activeTools, geminiModel, context, geminiThinkingEnabled, geminiApiKey);
            setChat(newChat);
            logCallback('AI session has been reset.');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to reset AI session: ${errorMessage}`);
            logCallback(`ERROR resetting AI session: ${errorMessage}`);
            setChat(null);
        }
    }
  };
  
  const handleFileSelect = (files: File[] | null) => {
    if (!files || files.length === 0) {
        setSelectedFiles([]);
        return;
    }

    if (files.length > 5) { // Arbitrary limit, good for UX
        setError("You can select a maximum of 5 files at a time.");
        return;
    }

    for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
            setError(`File "${file.name}" is too large. Max size is 10MB.`);
            return; // Don't add any files if one is invalid
        }
    }
    setError(null);
    setSelectedFiles(files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
        setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(Array.from(e.dataTransfer.files));
        e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isChatDisabled = isLoading || !activeProject;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <LeftSidebar
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
        projects={projects}
        activeProject={activeProject}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        onSelect={handleSelectProject}
        activeTools={activeTools}
        onToolsChange={setActiveTools}
        toolCategories={toolCategories}
        geminiApiKey={geminiApiKey}
        geminiModel={geminiModel}
        geminiModels={GEMINI_MODELS}
        geminiThinkingEnabled={geminiThinkingEnabled}
        onSaveGeminiSettings={handleSaveGeminiSettings}
      />
      <div className="flex flex-1 flex-col min-w-0 relative" onDragEnter={handleDragEnter}>
        <header className="p-4 border-b border-gray-700 shadow-md bg-gray-800 flex justify-between items-center flex-shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                className="p-2 hover:bg-gray-700 rounded-lg"
                aria-label="Toggle projects and tools sidebar"
            >
                <MenuIcon />
            </button>
            <div>
                 <h1 className="text-xl sm:text-2xl font-bold text-cyan-400">
                    Appwrite AI Agent
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                    Active Project: <span className="font-semibold text-cyan-300">{activeProject?.name || 'None Selected'}</span>
                </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <button
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-red-800 rounded-lg text-red-300 hover:text-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Clear chat history"
            >
                <DeleteIcon />
                <span className="hidden sm:inline">Clear Chat</span>
            </button>
            <button
                onClick={() => setIsLogSidebarOpen(!isLogSidebarOpen)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-cyan-300"
                aria-label="Toggle logs sidebar"
            >
                <TerminalIcon />
                <span className="hidden sm:inline">Logs</span>
            </button>
            <div className="flex items-center gap-2 p-1 pr-2 bg-gray-700/50 rounded-full border border-gray-600">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <UserIcon />
                </div>
                <span className="text-sm font-medium hidden sm:inline truncate max-w-28">{currentUser.name}</span>
                <button 
                    onClick={onLogout} 
                    className="ml-1 text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-600"
                    aria-label="Logout"
                >
                    <LogoutIcon />
                </button>
            </div>
          </div>
        </header>

        {activeProject && (
            <div className="p-2 border-b border-gray-700 bg-gray-800/60 flex-shrink-0 shadow-inner">
                <ProjectContextSelector 
                    databases={databases}
                    collections={collections}
                    buckets={buckets}
                    selectedDatabase={selectedDatabase}
                    selectedCollection={selectedCollection}
                    selectedBucket={selectedBucket}
                    onDatabaseSelect={setSelectedDatabase}
                    onCollectionSelect={setSelectedCollection}
                    onBucketSelect={setSelectedBucket}
                    isLoading={isContextLoading}
                    onRefresh={refreshContextData}
                />
            </div>
        )}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && !activeProject && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <h2 className="text-2xl font-semibold mb-2">Welcome, {currentUser.name}!</h2>
                <p className="max-w-md">To get started, please add and select an Appwrite project from the sidebar.</p>
                <button onClick={() => setIsLeftSidebarOpen(true)} className="mt-4 px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700">Open Sidebar</button>
            </div>
          )}
            {messages.length === 0 && activeProject && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <h2 className="text-2xl font-semibold mb-2">Project '{activeProject.name}' is active.</h2>
                <p className="max-w-md">Ask me anything about your project, like "list databases", "create a document", or "delete user with id 123".</p>
                <p className="text-sm mt-2 max-w-md">You can select a default database, collection, and bucket above to provide more context to the agent.</p>
            </div>
            )}
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
          <div ref={chatEndRef} />
        </main>

        <footer className="p-4 border-t border-gray-700 bg-gray-800 shrink-0">
             <ChatInput
                onSubmit={handleSendMessage}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
                isDisabled={isChatDisabled}
                placeholder={activeProject ? "Type a command, paste an image, or drop files..." : "Please select a project to start..."}
            />
        </footer>

        {isDragging && (
          <div
            className="absolute inset-0 z-20"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pointer-events-none absolute inset-0 bg-cyan-900/40 backdrop-blur-sm border-4 border-dashed border-cyan-400 rounded-2xl m-4 flex items-center justify-center">
                <div className="text-center text-cyan-200">
                    <FileUploadIcon />
                    <p className="text-xl font-bold mt-2">Drop your files here</p>
                    <p className="text-sm text-cyan-300">Maximum 5 files. 10MB per file.</p>
                </div>
            </div>
          </div>
        )}

      </div>
      <LogSidebar
        isOpen={isLogSidebarOpen}
        onClose={() => setIsLogSidebarOpen(false)}
        logs={sessionLogs}
        onClear={() => setSessionLogs([])}
      />
    </div>
  );
};

export default App;