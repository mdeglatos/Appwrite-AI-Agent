
import { useState, useEffect, useCallback } from 'react';
import type { Models } from 'appwrite';
import type { AppwriteProject, UserPrefs } from '../types';
import type { NewAppwriteProject } from '../services/projectService';
import * as projectService from '../services/projectService';

export function useProjects(
    currentUser: Models.User<UserPrefs> | null, 
    refreshUser: () => Promise<void>,
    logCallback: (log: string) => void
) {
    const [projects, setProjects] = useState<AppwriteProject[]>([]);
    const [activeProject, setActiveProject] = useState<AppwriteProject | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                        await projectService.setActiveProjectPreference(null);
                        await refreshUser();
                    }
                } else {
                    setActiveProject(null);
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

    const handleSaveProject = useCallback(async (projectData: NewAppwriteProject) => {
        if (!currentUser) return;
        try {
            const newProject = await projectService.addProject(projectData, currentUser.$id);
            setProjects(prev => [newProject, ...prev]);
            setActiveProject(newProject);
            await projectService.setActiveProjectPreference(newProject.$id);
            await refreshUser();
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to save project: ${errorMessage}`);
            logCallback(`ERROR saving project: ${errorMessage}`);
        }
    }, [currentUser, logCallback, refreshUser]);

    const handleUpdateProject = useCallback(async (project: AppwriteProject) => {
        try {
            const { $id, name, endpoint, projectId, apiKey } = project;
            const projectData: NewAppwriteProject = { name, endpoint, projectId, apiKey };
            const updatedProject = await projectService.updateProject($id, projectData);
            
            setProjects(prevProjects => prevProjects.map(p => p.$id === $id ? updatedProject : p));
            
            if (activeProject?.$id === $id) {
                setActiveProject(updatedProject);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to update project: ${errorMessage}`);
            logCallback(`ERROR updating project: ${errorMessage}`);
        }
    }, [activeProject, logCallback]);

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

    const handleSelectProject = useCallback(async (project: AppwriteProject | null) => {
        setActiveProject(project);
        try {
            await projectService.setActiveProjectPreference(project?.$id ?? null);
            await refreshUser();
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to set active project: ${errorMessage}`);
            logCallback(`ERROR setting active project: ${errorMessage}`);
        }
    }, [logCallback, refreshUser]);

    return {
        projects,
        activeProject,
        setActiveProject,
        handleSaveProject,
        handleUpdateProject,
        handleDeleteProject,
        handleSelectProject,
        isLoading,
        error,
        setError
    };
}