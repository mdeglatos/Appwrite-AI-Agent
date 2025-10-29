import { useState, useEffect, useCallback } from 'react';
import type { AppwriteProject, Database, Collection, Bucket, AppwriteFunction } from '../types';
import { getSdkDatabases, getSdkStorage, getSdkFunctions, Query } from '../services/appwrite';

const CONTEXT_FETCH_LIMIT = 100;

export function useAppContext(activeProject: AppwriteProject | null, logCallback: (log: string) => void) {
    const [databases, setDatabases] = useState<Database[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [functions, setFunctions] = useState<AppwriteFunction[]>([]);
    const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
    const [selectedFunction, setSelectedFunction] = useState<AppwriteFunction | null>(null);
    const [isContextLoading, setIsContextLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            const dbStillExists = selectedDatabase && newDatabases.some(db => db.$id === selectedDatabase.$id);
            if (!dbStillExists) {
                setSelectedDatabase(null);
                setCollections([]);
                setSelectedCollection(null);
            } else if (selectedDatabase) {
                logCallback(`Refreshing collections for database "${selectedDatabase.name}"...`);
                const collectionsResponse = await projectDatabases.listCollections(selectedDatabase.$id, [Query.limit(CONTEXT_FETCH_LIMIT)]);
                const newCollections: Collection[] = collectionsResponse.collections;
                setCollections(newCollections);
                
                const collectionStillExists = selectedCollection && newCollections.some(c => c.$id === selectedCollection.$id);
                if (!collectionStillExists) {
                    setSelectedCollection(null);
                }
            }
            
            if (selectedBucket && !newBuckets.some(b => b.$id === selectedBucket.$id)) setSelectedBucket(null);
            if (selectedFunction && !newFunctions.some(f => f.$id === selectedFunction.$id)) setSelectedFunction(null);

            logCallback(`Refreshed context: Found ${newDatabases.length} databases, ${newBuckets.length} buckets, and ${newFunctions.length} functions.`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to fetch project context.';
            setError(errorMessage);
            logCallback(`ERROR fetching context: ${errorMessage}`);
        } finally {
            setIsContextLoading(false);
        }
    }, [activeProject, logCallback, resetContext, selectedDatabase, selectedCollection, selectedBucket, selectedFunction]);

    useEffect(() => {
        if (activeProject) {
            refreshContextData();
        } else {
            resetContext();
        }
    }, [activeProject, resetContext]); // refreshContextData is not needed here as it will cause loops

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
                setSelectedCollection(current => current && !newCollections.some(c => c.$id === current.$id) ? null : current);
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
    }, [selectedDatabase, activeProject, logCallback]);

    return {
        databases,
        collections,
        buckets,
        functions,
        selectedDatabase,
        selectedCollection,
        selectedBucket,
        selectedFunction,
        setSelectedDatabase,
        setSelectedCollection,
        setSelectedBucket,
        setSelectedFunction,
        isContextLoading,
        error,
        setError,
        refreshContextData,
    };
}
