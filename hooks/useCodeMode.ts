import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import type { AppwriteProject, AppwriteFunction, ModelMessage } from '../types';
import { downloadAndUnpackDeployment, type UnpackedFile, deployCodeFromString } from '../tools/functionsTools';
import { getSdkFunctions, Query } from '../services/appwrite';

export function useCodeMode(
    activeProject: AppwriteProject | null,
    selectedFunction: AppwriteFunction | null,
    logCallback: (log: string) => void
) {
    const [isCodeModeActive, setIsCodeModeActive] = useState(false);
    const [isFunctionContextLoading, setIsFunctionContextLoading] = useState(false);
    const [functionFiles, setFunctionFiles] = useState<UnpackedFile[] | null>(null);
    const [editedFunctionFiles, setEditedFunctionFiles] = useState<UnpackedFile[] | null>(null);
    const [isCodeViewerSidebarOpen, setIsCodeViewerSidebarOpen] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [codeModeEvent, setCodeModeEvent] = useState<{ message: string } | null>(null);

    const clearCodeModeEvent = useCallback(() => setCodeModeEvent(null), []);
    
    const prevSelectedFunctionId = useRef<string | null | undefined>();
    const isModeSwitching = useRef(false);

    useEffect(() => {
        const functionHasChanged = selectedFunction?.$id !== prevSelectedFunctionId.current;

        const loadFunctionContext = async () => {
            if (!isCodeModeActive || !selectedFunction || !functionHasChanged || isModeSwitching.current) {
                return;
            }

            setIsFunctionContextLoading(true);
            setFunctionFiles(null);
            setEditedFunctionFiles(null);
            setIsCodeViewerSidebarOpen(false);
            logCallback(`Code Mode: Loading context for function "${selectedFunction.name}"...`);
            setError(null);
            
            try {
                if (!activeProject) throw new Error("No active project");
                const projectFunctions = getSdkFunctions(activeProject);
                let deploymentId = selectedFunction.deployment;
                
                if (!deploymentId) {
                    const deploymentsList = await projectFunctions.listDeployments(selectedFunction.$id, [Query.orderDesc('$createdAt')]);
                    const latestReadyDeployment = deploymentsList.deployments.find(d => d.status === 'ready');
                    if (latestReadyDeployment) deploymentId = latestReadyDeployment.$id;
                }
                
                const files = await downloadAndUnpackDeployment(activeProject, selectedFunction.$id, deploymentId);
                
                if (files && files.length > 0) {
                    setFunctionFiles(files);
                    setEditedFunctionFiles(JSON.parse(JSON.stringify(files)));
                    setIsCodeViewerSidebarOpen(true);
                    logCallback(`Code Mode: Found ${files.length} file(s).`);
                    const modelResponseText = `Loaded code for **${selectedFunction.name}**. Files: ${files.map(f => `\`${f.name}\``).join(', ')}. Ready for instructions.`;
                    setCodeModeEvent({ message: modelResponseText });
                } else {
                    setFunctionFiles([]);
                    setEditedFunctionFiles([]);
                    setIsCodeViewerSidebarOpen(true);
                    logCallback(`Code Mode: Function "${selectedFunction.name}" has no deployment. Ready to create files.`);
                    const modelResponseText = `Function **${selectedFunction.name}** has no code. I'm ready to help you write it from scratch.`;
                    setCodeModeEvent({ message: modelResponseText });
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
                setError(`Failed to load function code: ${errorMessage}`);
                logCallback(`ERROR loading function code: ${errorMessage}`);
            } finally {
                setIsFunctionContextLoading(false);
            }
        };

        loadFunctionContext();
        prevSelectedFunctionId.current = selectedFunction?.$id;

    }, [isCodeModeActive, selectedFunction, activeProject, logCallback, setError]);
    
    useEffect(() => {
        if (!isCodeModeActive) {
            setFunctionFiles(null);
            setEditedFunctionFiles(null);
            setIsCodeViewerSidebarOpen(false);
        } else if (!selectedFunction) {
            setFunctionFiles(null);
            setEditedFunctionFiles(null);
            setIsCodeViewerSidebarOpen(false);
        }
        isModeSwitching.current = false;
    }, [isCodeModeActive, selectedFunction]);


    const handleToggleCodeMode = (isChanging: boolean) => {
        isModeSwitching.current = true;
        setIsCodeModeActive(isChanging);
        logCallback(`Switched to ${isChanging ? 'Code Mode' : 'Agent Mode'}. Session will reset.`);
    };

    const handleCodeGenerated = useCallback((newFiles: { name: string; content: string }[]) => {
        logCallback("Code Mode: AI has generated new code. The editor panel has been updated.");
        const unpackedNewFiles: UnpackedFile[] = newFiles.map(file => ({ name: file.name, content: file.content, size: new Blob([file.content]).size }));
        setEditedFunctionFiles(unpackedNewFiles);
        setFunctionFiles(unpackedNewFiles);
    }, [logCallback]);

    const handleFileContentChange = (fileName: string, newContent: string) => {
        setEditedFunctionFiles(prev => prev?.map(f => f.name === fileName ? { ...f, content: newContent } : f) || null);
    };

    const handleFileAdd = (path: string) => {
        setEditedFunctionFiles(prev => {
            const newFiles = prev ? [...prev] : [];
            const pathParts = path.split('/');
            const name = pathParts.pop();
            const parent = pathParts.join('/');

            // Find siblings to check for duplicates
            const siblings = newFiles
                .map(f => {
                    const fParts = f.name.split('/');
                    const fName = fParts.pop();
                    const fParent = fParts.join('/');
                    return { name: fName, parent: fParent };
                })
                .filter(f => f.parent === parent);

            if (siblings.some(f => f.name === name)) {
                setError(`A file or folder with the name "${name}" already exists in this directory.`);
                return newFiles; // Return original state
            }
            
            newFiles.push({ name: path, content: '', size: 0 });
            return newFiles;
        });
    };

    const handleFileDelete = (path: string, type: 'file' | 'folder') => {
        setEditedFunctionFiles(prev => {
            if (!prev) return null;
            if (type === 'file') {
                return prev.filter(f => f.name !== path);
            }
            // For folders, delete the folder itself (if represented by a file like .gitkeep) and all files within it.
            return prev.filter(f => f.name !== path && !f.name.startsWith(path + '/'));
        });
    };
    
    const handleFileRename = (oldPath: string, newPath: string, type: 'file' | 'folder') => {
        setEditedFunctionFiles(prev => {
            if (!prev) return null;

            const newPathParts = newPath.split('/');
            const newName = newPathParts.pop();
            const newParent = newPathParts.join('/');
            
            // Find siblings of the new path to check for duplicates
            const siblings = prev
                .map(f => {
                    const fParts = f.name.split('/');
                    const fName = fParts.pop();
                    const fParent = fParts.join('/');
                    return { name: fName, parent: fParent, path: f.name };
                })
                .filter(f => f.parent === newParent && f.path !== oldPath); // Exclude the file being renamed

            if (siblings.some(f => f.name === newName)) {
                setError(`A file or folder with the name "${newName}" already exists in this directory.`);
                return prev;
            }

            if (type === 'file') {
                return prev.map(f => (f.name === oldPath ? { ...f, name: newPath } : f));
            }
             // For folders, rename all child paths as well
            return prev.map(f => {
                if (f.name.startsWith(oldPath + '/') || f.name === oldPath) {
                    return { ...f, name: f.name.replace(oldPath, newPath) };
                }
                return f;
            });
        });
    };

    const handleDeployChanges = async () => {
        if (!activeProject || !selectedFunction || !editedFunctionFiles || editedFunctionFiles.length === 0) {
            setError("Cannot deploy: Missing project, function, or files.");
            return;
        }
        setIsDeploying(true);
        setError(null);
        logCallback(`Manual Deploy: Starting deployment for function "${selectedFunction.name}"...`);
        try {
            let entrypoint = selectedFunction.entrypoint;
            let commands = selectedFunction.commands;
            const packageJsonFile = editedFunctionFiles.find(f => f.name === 'package.json');
            if (packageJsonFile) {
                try {
                    const packageJson = JSON.parse(packageJsonFile.content);
                    if (packageJson.main) entrypoint = packageJson.main;
                    // Only set npm install if there are dependencies
                    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
                        commands = "npm install";
                    }
                } catch (e) {
                    console.warn("Could not parse package.json, using existing function settings.");
                }
            }
            const deployment = await deployCodeFromString(activeProject, selectedFunction.$id, editedFunctionFiles, true, entrypoint, commands);
            logCallback(`Deployment successfully created with ID: ${deployment.$id}. Build in progress...`);
            setFunctionFiles(JSON.parse(JSON.stringify(editedFunctionFiles)));
            setCodeModeEvent({ 
                message: `✅ Deployment for function **${selectedFunction.name}** initiated. Build is running.` 
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during deployment.';
            setError(errorMessage);
        } finally {
            setIsDeploying(false);
        }
    };
    
    return {
        isCodeModeActive,
        isFunctionContextLoading,
        functionFiles,
        editedFunctionFiles,
        isCodeViewerSidebarOpen,
        isDeploying,
        setIsCodeViewerSidebarOpen,
        handleToggleCodeMode,
        handleCodeGenerated,
        handleFileContentChange,
        handleFileAdd,
        handleFileDelete,
        handleFileRename,
        handleDeployChanges,
        error,
        setError,
        codeModeEvent,
        clearCodeModeEvent,
    };
}
