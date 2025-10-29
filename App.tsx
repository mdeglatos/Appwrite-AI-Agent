
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, runAI } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { LoadingSpinnerIcon, MenuIcon, TerminalIcon, UserIcon, LogoutIcon, FileUploadIcon, DeleteIcon, CodeIcon } from './components/Icons';
import { LeftSidebar } from './components/LeftSidebar';
import { LogSidebar } from './components/LogSidebar';
import { ChatInput } from './components/ChatInput';
import { ProjectContextSelector } from './components/ProjectContextSelector';
import type { Message, AppwriteProject, UserPrefs, UserMessage, ModelMessage, Database, Collection, Bucket, AIContext, AppwriteFunction } from './types';
import type { NewAppwriteProject } from './services/projectService';
import type { Chat, Content } from '@google/genai';
import type { Models } from 'appwrite';
import { getAccount, logout, updateGeminiPrefs, updateToolsPrefs } from './services/authService';
import * as projectService from './services/projectService';
import LoginPage from './components/LoginPage';
import { getSdkDatabases, getSdkStorage, getSdkFunctions, Query } from './services/appwrite';
import { downloadAndUnpackDeployment, type UnpackedFile, deployCodeFromString } from './tools/functionsTools';
import { CodeViewerSidebar } from './components/CodeViewerSidebar';
import { ConfirmationModal } from './components/ConfirmationModal';

// Define tool categories as a top-level constant
const toolCategories = ['database', 'storage', 'functions', 'users', 'teams', 'search'];
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

  const [activeTools, setActiveTools] = useState(() => {
    const savedTools = currentUser.prefs.activeTools;
    if (savedTools && typeof savedTools === 'object') {
        // Ensure all categories from the constant are present, defaulting to true for any new ones.
        return toolCategories.reduce((acc, tool) => ({
            ...acc,
            [tool]: savedTools.hasOwnProperty(tool) ? savedTools[tool] : true,
        }), {});
    }
    // Default if nothing is saved: all tools are on.
    return toolCategories.reduce((acc, tool) => ({ ...acc, [tool]: true }), {});
  });

  const [chat, setChat] = useState<Chat | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevContextForReset = useRef({ projectId: activeProject?.$id, isCodeModeActive: false });
  const prevSelectedFunctionId = useRef<string | null | undefined>();

  const geminiApiKey = currentUser.prefs.geminiApiKey || null;
  const geminiModel = currentUser.prefs.geminiModel || DEFAULT_GEMINI_MODEL;
  const geminiThinkingEnabled = currentUser.prefs.geminiThinking ?? true; // Default to enabled

  // New state for project context
  const [databases, setDatabases] = useState<Database[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [functions, setFunctions] = useState<AppwriteFunction[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<AppwriteFunction | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(false);
  
  // New state for Code Mode
  const [isCodeModeActive, setIsCodeModeActive] = useState(false);
  const [isFunctionContextLoading, setIsFunctionContextLoading] = useState(false);
  const [functionFiles, setFunctionFiles] = useState<UnpackedFile[] | null>(null); // Original files
  const [editedFunctionFiles, setEditedFunctionFiles] = useState<UnpackedFile[] | null>(null); // Editable copy
  const [isCodeViewerSidebarOpen, setIsCodeViewerSidebarOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmButtonClass: string;
    onConfirm: () => void;
  } | null>(null);

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
    setFunctions([]);
    setSelectedDatabase(null);
    setSelectedCollection(null);
    setSelectedBucket(null);
    setSelectedFunction(null);
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
        const projectFunctions = getSdkFunctions(activeProject);

        // Fetch top-level context items
        const [dbResponse, bucketResponse, funcResponse] = await Promise.all([
            projectDatabases.list([Query.limit(CONTEXT_FETCH_LIMIT)]),
            projectStorage.listBuckets([Query.limit(CONTEXT_FETCH_LIMIT)]),
            projectFunctions.list([Query.limit(CONTEXT_FETCH_LIMIT)])
        ]);
        const newDatabases: Database[] = dbResponse.databases;
        const newBuckets: Bucket[] = bucketResponse.buckets;
        const newFunctions: AppwriteFunction[] = funcResponse.functions;
        setDatabases(newDatabases);
        setBuckets(newBuckets);
        setFunctions(newFunctions);

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
        
        // Validate selected function
        const funcStillExists = selectedFunction && newFunctions.some(f => f.$id === selectedFunction.$id);
        if (!funcStillExists) {
            setSelectedFunction(null);
        }

        logCallback(`Refreshed context: Found ${newDatabases.length} databases, ${newBuckets.length} buckets, and ${newFunctions.length} functions.`);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to fetch project context.';
        setError(errorMessage);
        logCallback(`ERROR fetching context: ${errorMessage}`);
    } finally {
        setIsContextLoading(false);
    }
}, [activeProject, logCallback, resetContext, selectedDatabase, selectedCollection, selectedBucket, selectedFunction, CONTEXT_FETCH_LIMIT]);


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

  // This central useEffect hook manages the AI chat session's lifecycle.
  // It intelligently decides whether to perform a "hard reset" (clearing chat history)
  // or a "soft reset" (preserving history while updating settings).
  useEffect(() => {
    const functionHasChanged = selectedFunction?.$id !== prevSelectedFunctionId.current;
    
    // Check for conditions that require a hard reset of the chat history.
    const didProjectChange = prevContextForReset.current.projectId !== activeProject?.$id;
    const didModeChange = prevContextForReset.current.isCodeModeActive !== isCodeModeActive;
    const isHardReset = didProjectChange || didModeChange;

    const initializeSession = async () => {
        if (!activeProject) {
            setChat(null);
            setMessages([]);
            return;
        }

        const context: AIContext = {
            project: activeProject,
            database: selectedDatabase,
            collection: selectedCollection,
            bucket: selectedBucket,
            fn: selectedFunction,
        };
        
        let initialHistory: Content[] | undefined;

        // On a hard reset (project/mode change), clear history and messages.
        // Otherwise, preserve the history from the previous chat session.
        if (isHardReset) {
            setMessages([]);
            initialHistory = undefined;
        } else {
            initialHistory = chat?.history;
        }

        if (isCodeModeActive && selectedFunction) {
            // A function change in code mode is a special type of reset,
            // as it needs to load a new code context.
            if (functionHasChanged) {
                setIsFunctionContextLoading(true);
                setMessages([]); // Start fresh for the new function context
                setFunctionFiles(null);
                setEditedFunctionFiles(null);
                setIsCodeViewerSidebarOpen(false);
                logCallback(`Code Mode: Loading context for function "${selectedFunction.name}"...`);
                setError(null);
                
                try {
                    const projectFunctions = getSdkFunctions(activeProject);
                    let deploymentId = selectedFunction.deployment;
                    
                    if (!deploymentId) {
                        logCallback(`Deployment ID not found on initial function object. Fetching details for "${selectedFunction.name}"...`);
                        const fullFunctionDetails = await projectFunctions.get(selectedFunction.$id);
                        deploymentId = fullFunctionDetails.deployment;
                    }

                    if (!deploymentId) {
                        logCallback(`Function "${selectedFunction.name}" has no active deployment set. Searching for the latest successful deployment...`);
                        const deploymentsList = await projectFunctions.listDeployments(
                            selectedFunction.$id, 
                            [Query.orderDesc('$createdAt')]
                        );
                        
                        const latestReadyDeployment = deploymentsList.deployments.find(d => d.status === 'ready');
                        
                        if (latestReadyDeployment) {
                            deploymentId = latestReadyDeployment.$id;
                            logCallback(`Found latest ready deployment: ${deploymentId}. Using it for Code Mode.`);
                        } else {
                            logCallback(`No ready deployments found for function "${selectedFunction.name}".`);
                        }
                    } else {
                        logCallback(`Found active deployment ID: ${deploymentId}`);
                    }
                    
                    const files = await downloadAndUnpackDeployment(activeProject, selectedFunction.$id, deploymentId);
                    
                    if (files && files.length > 0) {
                        setFunctionFiles(files);
                        setEditedFunctionFiles(JSON.parse(JSON.stringify(files))); // Deep copy for editing
                        setIsCodeViewerSidebarOpen(true);
                        logCallback(`Code Mode: Found ${files.length} file(s). Building context message.`);
                        
                        const fileParts = files.map(file => `File: \`${file.name}\`\n\`\`\`\n${file.content}\n\`\`\``).join('\n\n');
                        const userPrompt = `I need to work on an existing Appwrite function named "${selectedFunction.name}". Please load the following files from its active deployment into your context. I will provide further instructions in my next prompt.\n\n${fileParts}`;
                        const modelResponseText = `Understood. I have loaded the code for the function **${selectedFunction.name}**. I am now operating with the full context of this function, including the following files: ${files.map(f => `\`${f.name}\``).join(', ')}. I am ready for your instructions. You can ask me to make changes, or you can edit the code directly in the side panel and deploy your changes.`;

                        initialHistory = [
                            { role: 'user', parts: [{ text: userPrompt }] },
                            { role: 'model', parts: [{ text: modelResponseText }] },
                        ];

                        const contextMessage: ModelMessage = { id: crypto.randomUUID(), role: 'model', content: modelResponseText };
                        setMessages([contextMessage]);
                    } else {
                        setFunctionFiles(null);
                        setEditedFunctionFiles(null);
                        logCallback(`Code Mode: Active deployment for "${selectedFunction.name}" is empty or could not be downloaded.`);
                        const modelResponseText = `The context is set to the function **${selectedFunction.name}**. Its active deployment appears to be empty or could not be found. I'm ready to help you write the initial code from scratch.`;
                        const contextMessage: ModelMessage = { id: crypto.randomUUID(), role: 'model', content: modelResponseText };
                        setMessages([contextMessage]);
                    }
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
                    setError(`Failed to load function code: ${errorMessage}`);
                    logCallback(`ERROR loading function code: ${errorMessage}`);
                } finally {
                    setIsFunctionContextLoading(false);
                }
            }
        } else if (isCodeModeActive && !selectedFunction) {
            // If in code mode but no function is selected, ensure the chat is clear.
            if (functionHasChanged || isHardReset) {
                setMessages([]); 
                setFunctionFiles(null);
                setEditedFunctionFiles(null);
                setIsCodeViewerSidebarOpen(false);
            }
        } else if (!isCodeModeActive) {
            setFunctionFiles(null);
            setEditedFunctionFiles(null);
            setIsCodeViewerSidebarOpen(false);
        }

        const mode = isCodeModeActive ? 'Code Mode' : 'Agent Mode';
        const contextDescription = [
            context.database ? `DB: ${context.database.name}` : '',
            context.collection ? `Collection: ${context.collection.name}` : '',
            context.bucket ? `Bucket: ${context.bucket.name}` : '',
            context.fn ? `Function: ${context.fn.name}` : '',
        ].filter(Boolean).join(', ');

        logCallback(`(${mode}) Project context updated. ${contextDescription || 'No specific context.'} Initializing new AI session...`);
        try {
            const newChat = createChatSession(activeTools, geminiModel, context, geminiThinkingEnabled, geminiApiKey, isCodeModeActive, initialHistory);
            setChat(newChat);
            if (!isFunctionContextLoading) setError(null); // Don't clear a function-loading error
            logCallback('AI session ready.');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            logCallback(`ERROR: ${errorMessage}`);
            setChat(null);
        }
    };

    initializeSession();
    // After the effect runs, update the refs for the next render to track changes.
    prevContextForReset.current = { projectId: activeProject?.$id, isCodeModeActive };
    prevSelectedFunctionId.current = selectedFunction?.$id;
  }, [activeProject, activeTools, logCallback, geminiApiKey, geminiModel, geminiThinkingEnabled, selectedDatabase, selectedCollection, selectedBucket, selectedFunction, isCodeModeActive]);


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

  const requestProjectDeletion = useCallback((projectId: string, projectName: string) => {
    setConfirmationState({
        isOpen: true,
        title: `Delete Project "${projectName}"?`,
        message: 'This action is irreversible. The project will be permanently removed from your list.',
        confirmText: 'Delete Project',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700',
        onConfirm: () => {
            handleDeleteProject(projectId);
            setConfirmationState(null);
        },
    });
  }, [handleDeleteProject]);

  const handleSelectProject = useCallback(async (project: AppwriteProject) => {
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
  }, [logCallback, refreshUser]);

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

  const handleToolsChange = useCallback(async (newTools: { [key: string]: boolean }) => {
    setActiveTools(newTools);
    try {
        await updateToolsPrefs(newTools);
        logCallback('Agent tools selection saved.');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to save tool preferences: ${errorMessage}`);
        logCallback(`ERROR saving tool preferences: ${errorMessage}`);
    }
  }, [logCallback]);

  const handleCodeGenerated = useCallback((newFiles: { name: string; content: string }[]) => {
      logCallback("Code Mode: AI has generated new code. The editor panel has been updated.");
      
      const unpackedNewFiles: UnpackedFile[] = newFiles.map(file => ({
          name: file.name,
          content: file.content,
          size: new Blob([file.content]).size, 
      }));

      // The AI-generated code is the new "source of truth".
      // Update both the editable copy and the original copy to reflect this.
      // This also resets the "hasUnsavedChanges" state.
      setEditedFunctionFiles(unpackedNewFiles);
      setFunctionFiles(unpackedNewFiles);
  }, [logCallback]);

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
          bucket: selectedBucket,
          fn: selectedFunction,
      };
      await runAI(
          chat, 
          input, 
          context, 
          logCallback, 
          updateChatCallback, 
          userMessage.files,
          isCodeModeActive ? handleCodeGenerated : undefined
      );
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
    if (activeProject) {
        try {
            const context: AIContext = {
                project: activeProject,
                database: selectedDatabase,
                collection: selectedCollection,
                bucket: selectedBucket,
                fn: selectedFunction,
            };
            // Create a new session with empty history.
            const newChat = createChatSession(activeTools, geminiModel, context, geminiThinkingEnabled, geminiApiKey, isCodeModeActive);
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
  
    const handleToggleCodeMode = () => {
        const changingTo = !isCodeModeActive;
        if (messages.length > 0) {
            setConfirmationState({
                isOpen: true,
                title: `Switch to ${changingTo ? "'Code Mode'" : "'Agent Mode'"}?`,
                message: 'Switching modes will start a new session and clear your current chat history. Are you sure you want to continue?',
                confirmText: 'Switch Mode',
                confirmButtonClass: 'bg-cyan-600 hover:bg-cyan-700',
                onConfirm: () => {
                    setIsCodeModeActive(prev => !prev);
                    logCallback(`Switched to ${changingTo ? 'Code Mode' : 'Agent Mode'}. Session will reset.`);
                    setConfirmationState(null);
                },
            });
        } else {
            // If no messages, switch directly
            setIsCodeModeActive(prev => !prev);
            logCallback(`Switched to ${changingTo ? 'Code Mode' : 'Agent Mode'}. Session will reset.`);
        }
    };
    
    const handleCodeChange = (fileName: string, newContent: string) => {
        setEditedFunctionFiles(prevFiles => {
            if (!prevFiles) return null;
            return prevFiles.map(file => 
                file.name === fileName ? { ...file, content: newContent } : file
            );
        });
    };

    const handleDeployChanges = async () => {
        if (!activeProject || !selectedFunction || !editedFunctionFiles) {
            const errorMsg = "Cannot deploy: Missing project, function, or code context.";
            setError(errorMsg);
            logCallback(`ERROR: ${errorMsg}`);
            return;
        }

        setIsDeploying(true);
        setError(null);
        logCallback(`Manual Deploy: Starting deployment for function "${selectedFunction.name}"...`);

        try {
            let entrypoint = selectedFunction.entrypoint; // Default to existing
            let commands = selectedFunction.commands;   // Default to existing

            const packageJsonFile = editedFunctionFiles.find(f => f.name === 'package.json');
            if (packageJsonFile) {
                logCallback('Found package.json, parsing for deployment config...');
                try {
                    const packageJson = JSON.parse(packageJsonFile.content);
                    if (packageJson.main) {
                        entrypoint = packageJson.main;
                        logCallback(`Found entrypoint in package.json: "${entrypoint}"`);
                    }
                    // Appwrite's standard build command for Node.js functions is 'npm install'.
                    commands = "npm install"; 
                    logCallback(`Setting build commands to: "${commands}"`);
                } catch (e) {
                    const parseError = `Failed to parse package.json: ${e instanceof Error ? e.message : 'Unknown error'}. Using existing deployment settings.`;
                    setError(parseError);
                    logCallback(`ERROR: ${parseError}`);
                }
            }
            
            const deployment = await deployCodeFromString(
                activeProject,
                selectedFunction.$id,
                editedFunctionFiles,
                true, // activate
                entrypoint,
                commands
            );

            logCallback(`Deployment successfully created with ID: ${deployment.$id}. Build is in progress...`);
            
            // After successful deploy, the edited code becomes the new "original"
            setFunctionFiles(JSON.parse(JSON.stringify(editedFunctionFiles)));

            const successMessage: ModelMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `✅ Deployment for function **${selectedFunction.name}** has been successfully initiated. The build process is now running in the background. You can check the function's deployment status in your Appwrite console.`
            };
            setMessages(prev => [...prev, successMessage]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during deployment.';
            setError(errorMessage);
            logCallback(`ERROR deploying function: ${errorMessage}`);
        } finally {
            setIsDeploying(false);
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
    setSelectedFiles(Array.from(files));
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

  const isChatDisabled = isLoading || !activeProject || isFunctionContextLoading || isDeploying;
  const hasUnsavedCodeChanges = functionFiles && editedFunctionFiles && JSON.stringify(functionFiles) !== JSON.stringify(editedFunctionFiles);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <LeftSidebar
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
        projects={projects}
        activeProject={activeProject}
        onSave={handleSaveProject}
        onDelete={requestProjectDeletion}
        onSelect={handleSelectProject}
        activeTools={activeTools}
        onToolsChange={handleToolsChange}
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
             <div className="flex items-center gap-2" title={`Current mode: ${isCodeModeActive ? 'Code Mode' : 'Agent Mode'}. Click to switch.`}>
                <span className={`font-semibold transition-colors ${!isCodeModeActive ? 'text-cyan-300' : 'text-gray-500'}`}>Agent</span>
                <button
                    onClick={handleToggleCodeMode}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${isCodeModeActive ? 'bg-purple-600' : 'bg-gray-600'}`}
                    aria-pressed={isCodeModeActive}
                    aria-label="Toggle Code Mode"
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isCodeModeActive ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
                <span className={`font-semibold transition-colors ${isCodeModeActive ? 'text-purple-300' : 'text-gray-500'}`}>Code</span>
            </div>

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
                onClick={() => setIsCodeViewerSidebarOpen(!isCodeViewerSidebarOpen)}
                disabled={!isCodeModeActive || !functionFiles || functionFiles.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Toggle code viewer"
            >
                <CodeIcon />
                <span className="hidden sm:inline">Code</span>
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
                    functions={functions}
                    selectedDatabase={selectedDatabase}
                    selectedCollection={selectedCollection}
                    selectedBucket={selectedBucket}
                    selectedFunction={selectedFunction}
                    onDatabaseSelect={setSelectedDatabase}
                    onCollectionSelect={setSelectedCollection}
                    onBucketSelect={setSelectedBucket}
                    onFunctionSelect={setSelectedFunction}
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
            {messages.length === 0 && activeProject && !isCodeModeActive && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <h2 className="text-2xl font-semibold mb-2">Project '{activeProject.name}' is active.</h2>
                <p className="max-w-md">Ask me anything about your project, like "list databases", "create a document", or "delete user with id 123".</p>
                <p className="text-sm mt-2 max-w-md">You can select a default database, collection, and bucket above to provide more context to the agent.</p>
            </div>
            )}
            {isFunctionContextLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <LoadingSpinnerIcon />
                    <p className="mt-2 text-purple-300">Loading function code into context...</p>
                </div>
            )}
            {messages.length === 0 && activeProject && isCodeModeActive && !selectedFunction && !isFunctionContextLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <h2 className="text-2xl font-semibold mb-2 text-purple-300">Code Mode Activated</h2>
                <p className="max-w-lg">Please select a function from the context bar above to load its code for editing.</p>
                <p className="text-sm mt-2 max-w-lg">If you want to create a new function, you can just ask, for example: "Create a function to handle user signups and add them to the 'profiles' collection."</p>
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
      <CodeViewerSidebar
        isOpen={isCodeViewerSidebarOpen}
        onClose={() => setIsCodeViewerSidebarOpen(false)}
        files={editedFunctionFiles || []}
        originalFiles={functionFiles || []}
        functionName={selectedFunction?.name || '...'}
        onCodeChange={handleCodeChange}
        onDeploy={handleDeployChanges}
        isDeploying={isDeploying}
        hasUnsavedChanges={!!hasUnsavedCodeChanges}
      />
      <LogSidebar
        isOpen={isLogSidebarOpen}
        onClose={() => setIsLogSidebarOpen(false)}
        logs={sessionLogs}
        onClear={() => setSessionLogs([])}
      />
       {confirmationState?.isOpen && (
        <ConfirmationModal
            isOpen={confirmationState.isOpen}
            title={confirmationState.title}
            message={confirmationState.message}
            onConfirm={confirmationState.onConfirm}
            onClose={() => setConfirmationState(null)}
            confirmText={confirmationState.confirmText}
            confirmButtonClass={confirmationState.confirmButtonClass}
        />
      )}
    </div>
  );
};

export default App;
