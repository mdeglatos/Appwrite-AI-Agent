
import React, { useState, useEffect, useRef } from 'react';
import { ID, Query } from '../services/appwrite';
import { getSdkDatabases, getSdkStorage, getSdkFunctions, getSdkUsers, getSdkTeams } from '../services/appwrite';
import type { AppwriteProject, Database, Bucket, AppwriteFunction, StudioTab } from '../types';
import type { Models } from 'node-appwrite';
import { Modal } from './Modal';
import { LoadingSpinnerIcon, ChevronDownIcon } from './Icons';
import type { ModalState, FormField } from './studio/types';
import { CopyButton } from './studio/ui/CopyButton';

// Tab Components
import { StudioNavBar } from './studio/ui/StudioNavBar';
import { OverviewTab } from './studio/tabs/OverviewTab';
import { DatabasesTab } from './studio/tabs/DatabasesTab';
import { StorageTab } from './studio/tabs/StorageTab';
import { FunctionsTab } from './studio/tabs/FunctionsTab';
import { UsersTab } from './studio/tabs/UsersTab';
import { TeamsTab } from './studio/tabs/TeamsTab';
import { MigrationsTab } from './studio/tabs/MigrationsTab';

interface StudioProps {
    activeProject: AppwriteProject;
    projects: AppwriteProject[];
    databases: Database[];
    buckets: Bucket[];
    functions: AppwriteFunction[];
    refreshData: () => void;
    onCreateFunction: () => void;
    activeTab: StudioTab;
    onTabChange: (tab: StudioTab) => void;
    onEditCode: (func: AppwriteFunction) => void;
}

export const Studio: React.FC<StudioProps> = ({ activeProject, projects, databases, buckets, functions, refreshData, onCreateFunction, activeTab, onTabChange, onEditCode }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    // -- Data States --
    const [users, setUsers] = useState<Models.User<any>[]>([]);
    const [teams, setTeams] = useState<Models.Team<any>[]>([]);
    
    // -- Drill Down States --
    const [selectedDb, setSelectedDb] = useState<Database | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<Models.Collection | null>(null);
    const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
    const [selectedFunction, setSelectedFunction] = useState<AppwriteFunction | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Models.Team<any> | null>(null);

    // -- Sub-resource Data States --
    const [collections, setCollections] = useState<Models.Collection[]>([]);
    const [documents, setDocuments] = useState<Models.Document[]>([]);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [indexes, setIndexes] = useState<any[]>([]);
    const [files, setFiles] = useState<Models.File[]>([]);
    const [deployments, setDeployments] = useState<Models.Deployment[]>([]);
    const [executions, setExecutions] = useState<Models.Execution[]>([]);
    const [memberships, setMemberships] = useState<Models.Membership[]>([]);

    // -- Modal State --
    const [modal, setModal] = useState<ModalState | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [formValues, setFormValues] = useState<any>({});
    
    const closeModal = () => {
        setModal(null);
        setFormValues({});
        setModalLoading(false);
    };

    // -- Helper to Open Modals --
    const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title,
            message,
            confirmLabel: 'Confirm',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm
        });
    };

    const openForm = (
        title: string, 
        fields: FormField[], 
        onConfirm: (data: any) => Promise<void>, 
        confirmLabel = "Create"
    ) => {
        const initialValues: any = {};
        fields.forEach(f => {
            if (f.defaultValue !== undefined) initialValues[f.name] = f.defaultValue;
        });
        setFormValues(initialValues);
        
        setModal({
            isOpen: true,
            type: 'form',
            title,
            fields,
            confirmLabel,
            confirmClass: 'bg-cyan-600 hover:bg-cyan-500',
            onConfirm
        });
    };

    // -- Tab Switching Reset --
    useEffect(() => {
        setSelectedDb(null);
        setSelectedCollection(null);
        setSelectedBucket(null);
        setSelectedFunction(null);
        setSelectedTeam(null);
    }, [activeTab]);

    // -- Real-time Polling for Executions --
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (selectedFunction && activeTab === 'functions') {
            // Initial Fetch
            fetchFunctionExecutionsOnly(selectedFunction.$id);

            // Poll every 3 seconds to update executions
            interval = setInterval(() => {
                fetchFunctionExecutionsOnly(selectedFunction.$id);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [selectedFunction, activeTab]);

    // -- Fetchers --
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const sdk = getSdkUsers(activeProject);
            const res = await sdk.list([Query.limit(100), Query.orderDesc('$createdAt')]);
            setUsers(res.users);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchTeams = async () => {
        setIsLoading(true);
        try {
            const sdk = getSdkTeams(activeProject);
            const res = await sdk.list([Query.limit(100), Query.orderDesc('$createdAt')]);
            setTeams(res.teams);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchCollections = async (dbId: string) => {
        setIsLoading(true);
        try {
            const sdk = getSdkDatabases(activeProject);
            const res = await sdk.listCollections(dbId, [Query.limit(100)]);
            setCollections(res.collections);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchCollectionDetails = async (dbId: string, collId: string) => {
        setIsLoading(true);
        try {
            const sdk = getSdkDatabases(activeProject);
            const [docs, coll] = await Promise.all([
                sdk.listDocuments(dbId, collId, [Query.limit(100), Query.orderDesc('$createdAt')]),
                sdk.getCollection(dbId, collId)
            ]);
            setDocuments(docs.documents);
            setAttributes((coll.attributes || []).map((a: any) => ({ ...a, $id: a.key })));
            setIndexes((coll.indexes || []).map((i: any) => ({ ...i, $id: i.key })));
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchFiles = async (bucketId: string) => {
        setIsLoading(true);
        try {
            const sdk = getSdkStorage(activeProject);
            const res = await sdk.listFiles(bucketId, [Query.limit(100), Query.orderDesc('$createdAt')]);
            setFiles(res.files);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchFunctionDetails = async (funcId: string) => {
        setIsLoading(true);
        try {
            const sdk = getSdkFunctions(activeProject);
            const [deps, execs] = await Promise.all([
                sdk.listDeployments(funcId, [Query.limit(50), Query.orderDesc('$createdAt')]),
                sdk.listExecutions(funcId, [Query.limit(20), Query.orderDesc('$createdAt')]),
            ]);
            setDeployments(deps.deployments);
            setExecutions(execs.executions);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchFunctionExecutionsOnly = async (funcId: string) => {
        try {
            const sdk = getSdkFunctions(activeProject);
            const execs = await sdk.listExecutions(funcId, [Query.limit(20), Query.orderDesc('$createdAt')]);
            setExecutions(execs.executions);
        } catch (e) { console.error(e); }
    };

    const fetchMemberships = async (teamId: string) => {
        setIsLoading(true);
        try {
            const sdk = getSdkTeams(activeProject);
            const res = await sdk.listMemberships(teamId);
            setMemberships(res.memberships);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    // -- Effects --
    useEffect(() => { if (activeTab === 'users' || activeTab === 'overview') fetchUsers(); }, [activeTab]);
    useEffect(() => { if (activeTab === 'teams' || activeTab === 'overview') fetchTeams(); }, [activeTab]);
    useEffect(() => { if (selectedDb) fetchCollections(selectedDb.$id); }, [selectedDb]);
    useEffect(() => { if (selectedCollection && selectedDb) fetchCollectionDetails(selectedDb.$id, selectedCollection.$id); }, [selectedCollection?.$id, selectedDb?.$id]);
    useEffect(() => { if (selectedBucket) fetchFiles(selectedBucket.$id); }, [selectedBucket]);
    useEffect(() => { if (selectedFunction) fetchFunctionDetails(selectedFunction.$id); }, [selectedFunction]);
    useEffect(() => { if (selectedTeam) fetchMemberships(selectedTeam.$id); }, [selectedTeam]);


    // -- Action Handlers --

    // Database
    const handleCreateDatabase = () => {
        openForm("Create Database", [
            { name: 'databaseId', label: 'Database ID', defaultValue: 'unique()', required: true, placeholder: 'unique() or custom_id', description: 'Enter "unique()" to auto-generate.' },
            { name: 'name', label: 'Database Name', required: true }
        ], async (data) => {
            const id = data.databaseId === 'unique()' ? ID.unique() : data.databaseId;
            await getSdkDatabases(activeProject).create(id, data.name);
            refreshData();
        });
    };
    const handleDeleteDatabase = (db: Database) => {
        confirmAction("Delete Database", `Are you sure you want to delete "${db.name}"? This cannot be undone.`, async () => {
            await getSdkDatabases(activeProject).delete(db.$id);
            refreshData();
        });
    };
    
    // Collection
    const handleCreateCollection = () => {
        if (!selectedDb) return;
        openForm("Create Collection", [
            { name: 'collectionId', label: 'Collection ID', defaultValue: 'unique()', required: true, placeholder: 'unique() or custom_id', description: 'Enter "unique()" to auto-generate.' },
            { name: 'name', label: 'Collection Name', required: true },
            { name: 'permissions', label: 'Permissions (Comma Separated)', placeholder: 'e.g. read("any"), create("users")' },
            { name: 'documentSecurity', label: 'Document Security', type: 'checkbox', defaultValue: false },
            { name: 'enabled', label: 'Enabled', type: 'checkbox', defaultValue: true }
        ], async (data) => {
            const id = data.collectionId === 'unique()' ? ID.unique() : data.collectionId;
            const permsArray = data.permissions ? data.permissions.split(',').map((p: string) => p.trim()).filter((p: string) => p) : undefined;
            await getSdkDatabases(activeProject).createCollection(selectedDb.$id, id, data.name, permsArray, data.documentSecurity, data.enabled);
            fetchCollections(selectedDb.$id);
        });
    };
    
    const handleUpdateCollectionSettings = async (data: any) => {
         if (!selectedDb || !selectedCollection) return;
         const permsArray = data.permissions ? data.permissions.split(',').map((p: string) => p.trim()).filter((p: string) => p) : [];
         const sdk = getSdkDatabases(activeProject);
         const updated = await sdk.updateCollection(selectedDb.$id, selectedCollection.$id, data.name, permsArray, data.documentSecurity, data.enabled);
         setSelectedCollection(updated);
    }

    const handleDeleteCollection = (coll: Models.Collection) => {
        if (!selectedDb) return;
        confirmAction("Delete Collection", `Delete collection "${coll.name}"?`, async () => {
            await getSdkDatabases(activeProject).deleteCollection(selectedDb.$id, coll.$id);
            fetchCollections(selectedDb.$id);
            setSelectedCollection(null);
        });
    };

    // Documents
    const handleCreateDocument = () => {
        if (!selectedDb || !selectedCollection) return;
        openForm("Create Document", [
            { name: 'documentId', label: 'Document ID', defaultValue: 'unique()', required: true, placeholder: 'unique() or custom_id' },
            { name: 'data', label: 'JSON Data', type: 'textarea', placeholder: '{"key": "value"}', required: true, description: "Enter valid JSON object." },
            { name: 'permissions', label: 'Permissions (Comma Separated)', placeholder: 'e.g. read("user:123")' }
        ], async (formData) => {
            try {
                const id = formData.documentId === 'unique()' ? ID.unique() : formData.documentId;
                const data = JSON.parse(formData.data);
                const permsArray = formData.permissions ? formData.permissions.split(',').map((p: string) => p.trim()).filter((p: string) => p) : undefined;
                await getSdkDatabases(activeProject).createDocument(selectedDb.$id, selectedCollection.$id, id, data, permsArray);
                fetchCollectionDetails(selectedDb.$id, selectedCollection.$id);
            } catch (e) {
                alert("Invalid JSON format");
                throw e; 
            }
        });
    };
    const handleUpdateDocument = (doc: Models.Document) => {
        if (!selectedDb || !selectedCollection) return;
        const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = doc;
        const jsonStr = JSON.stringify(data, null, 2);
        const permsStr = $permissions.join(', ');

        openForm("Edit Document", [
            { name: 'data', label: 'JSON Data', type: 'textarea', defaultValue: jsonStr, required: true, description: "Modify document fields." },
            { name: 'permissions', label: 'Permissions', defaultValue: permsStr }
        ], async (formData) => {
            try {
                const updatedData = JSON.parse(formData.data);
                const permsArray = formData.permissions ? formData.permissions.split(',').map((p: string) => p.trim()).filter((p: string) => p) : undefined;
                const sdk = getSdkDatabases(activeProject);
                await sdk.updateDocument(selectedDb.$id, selectedCollection.$id, doc.$id, updatedData, permsArray);
                fetchCollectionDetails(selectedDb.$id, selectedCollection.$id);
            } catch (e) {
                alert("Invalid JSON format");
                throw e;
            }
        }, "Save Changes");
    };
    const handleDeleteDocument = (doc: Models.Document) => {
        if (!selectedDb || !selectedCollection) return;
        confirmAction("Delete Document", `Delete document ${doc.$id}?`, async () => {
            await getSdkDatabases(activeProject).deleteDocument(selectedDb.$id, selectedCollection.$id, doc.$id);
            fetchCollectionDetails(selectedDb.$id, selectedCollection.$id);
        });
    };

    // Attributes
    const handleCreateAttribute = (type: string) => {
         if (!selectedDb || !selectedCollection) return;
         const sdk = getSdkDatabases(activeProject);
         const dbId = selectedDb.$id;
         const collId = selectedCollection.$id;
         const baseFields: FormField[] = [
             { name: 'key', label: 'Key', required: true },
             { name: 'required', label: 'Required', type: 'checkbox', defaultValue: false },
             { name: 'array', label: 'Array', type: 'checkbox', defaultValue: false },
         ];
         switch (type) {
             case 'string':
                 openForm("Create String Attribute", [...baseFields, { name: 'size', label: 'Size', type: 'number', defaultValue: 256, required: true }, { name: 'default', label: 'Default Value' }], async (d) => {
                     await sdk.createStringAttribute(dbId, collId, d.key, Number(d.size), d.required, d.default, d.array);
                     fetchCollectionDetails(dbId, collId);
                 });
                 break;
             case 'integer':
                openForm("Create Integer Attribute", [...baseFields, { name: 'min', label: 'Min', type: 'number' }, { name: 'max', label: 'Max', type: 'number' }, { name: 'default', label: 'Default Value', type: 'number' }], async (d) => {
                    await sdk.createIntegerAttribute(dbId, collId, d.key, d.required, d.min ? Number(d.min) : undefined, d.max ? Number(d.max) : undefined, d.default ? Number(d.default) : undefined, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
             case 'float':
                openForm("Create Float Attribute", [...baseFields, { name: 'min', label: 'Min', type: 'number' }, { name: 'max', label: 'Max', type: 'number' }, { name: 'default', label: 'Default Value', type: 'number' }], async (d) => {
                    await sdk.createFloatAttribute(dbId, collId, d.key, d.required, d.min ? Number(d.min) : undefined, d.max ? Number(d.max) : undefined, d.default ? Number(d.default) : undefined, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
             case 'boolean':
                openForm("Create Boolean Attribute", [...baseFields, { name: 'default', label: 'Default (true/false)', type: 'select', options: [{label: 'None', value: ''}, {label: 'True', value: 'true'}, {label: 'False', value: 'false'}] }], async (d) => {
                    const defVal = d.default === 'true' ? true : d.default === 'false' ? false : undefined;
                    await sdk.createBooleanAttribute(dbId, collId, d.key, d.required, defVal, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
             case 'email':
                openForm("Create Email Attribute", [...baseFields, { name: 'default', label: 'Default Value' }], async (d) => {
                    await sdk.createEmailAttribute(dbId, collId, d.key, d.required, d.default, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
             case 'url':
                openForm("Create URL Attribute", [...baseFields, { name: 'default', label: 'Default Value' }], async (d) => {
                    await sdk.createUrlAttribute(dbId, collId, d.key, d.required, d.default, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
             case 'ip':
                openForm("Create IP Attribute", [...baseFields, { name: 'default', label: 'Default Value' }], async (d) => {
                    await sdk.createIpAttribute(dbId, collId, d.key, d.required, d.default, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
             case 'datetime':
                openForm("Create Datetime Attribute", [...baseFields, { name: 'default', label: 'Default (ISO String)' }], async (d) => {
                    await sdk.createDatetimeAttribute(dbId, collId, d.key, d.required, d.default, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
             case 'enum':
                openForm("Create Enum Attribute", [...baseFields, { name: 'elements', label: 'Elements (Comma Separated)', required: true }, { name: 'default', label: 'Default Value' }], async (d) => {
                    const els = d.elements.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                    await sdk.createEnumAttribute(dbId, collId, d.key, els, d.required, d.default, d.array);
                    fetchCollectionDetails(dbId, collId);
                });
                break;
         }
    };

    const handleCreateIndex = () => {
        if (!selectedDb || !selectedCollection) return;
        openForm("Create Index", [
            { name: 'key', label: 'Key', required: true },
            { name: 'type', label: 'Type', type: 'select', required: true, options: [{label: 'Key', value: 'key'}, {label: 'Unique', value: 'unique'}, {label: 'Fulltext', value: 'fulltext'}] },
            { name: 'attributes', label: 'Attributes (Comma Separated)', required: true, description: "List the attribute keys to index." }
        ], async (d) => {
            const attrs = d.attributes.split(',').map((s: string) => s.trim()).filter((s: string) => s);
            await getSdkDatabases(activeProject).createIndex(selectedDb.$id, selectedCollection.$id, d.key, d.type, attrs);
            fetchCollectionDetails(selectedDb.$id, selectedCollection.$id);
        });
    }

    const handleDeleteAttribute = (attr: any) => {
        if (!selectedDb || !selectedCollection) return;
        confirmAction("Delete Attribute", `Delete attribute "${attr.key}"?`, async () => {
            await getSdkDatabases(activeProject).deleteAttribute(selectedDb.$id, selectedCollection.$id, attr.key);
            fetchCollectionDetails(selectedDb.$id, selectedCollection.$id);
        });
    };
    const handleDeleteIndex = (idx: any) => {
        if (!selectedDb || !selectedCollection) return;
        confirmAction("Delete Index", `Delete index "${idx.key}"?`, async () => {
            await getSdkDatabases(activeProject).deleteIndex(selectedDb.$id, selectedCollection.$id, idx.key);
            fetchCollectionDetails(selectedDb.$id, selectedCollection.$id);
        });
    };

    // Storage
    const handleCreateBucket = () => {
        openForm("Create Bucket", [
            { name: 'bucketId', label: 'Bucket ID', defaultValue: 'unique()', required: true, placeholder: 'unique() or custom_id', description: 'Enter "unique()" to auto-generate.' },
            { name: 'name', label: 'Bucket Name', required: true },
            { name: 'enabled', label: 'Enabled', type: 'checkbox', defaultValue: true },
            { name: 'fileSecurity', label: 'File Security', type: 'checkbox', defaultValue: false },
            { name: 'encryption', label: 'Encryption', type: 'checkbox', defaultValue: true },
            { name: 'antivirus', label: 'Antivirus', type: 'checkbox', defaultValue: true },
            { name: 'maximumFileSize', label: 'Max File Size (Bytes)', type: 'number', placeholder: 'Optional' },
            { name: 'allowedFileExtensions', label: 'Allowed Extensions', placeholder: 'jpg, png, pdf (Optional)' },
            { name: 'compression', label: 'Compression', type: 'select', defaultValue: 'none', options: [{label: 'None', value: 'none'}, {label: 'Gzip', value: 'gzip'}, {label: 'Zstd', value: 'zstd'}] }
        ], async (data) => {
            const id = data.bucketId === 'unique()' ? ID.unique() : data.bucketId;
            const exts = data.allowedFileExtensions ? data.allowedFileExtensions.split(',').map((s:string) => s.trim()).filter(Boolean) : undefined;
            const maxSize = data.maximumFileSize ? Number(data.maximumFileSize) : undefined;
            
            await getSdkStorage(activeProject).createBucket(
                id, data.name, undefined, data.fileSecurity, data.enabled, 
                maxSize, exts, data.compression, data.encryption, data.antivirus
            );
            refreshData();
        });
    };
    const handleDeleteBucket = (bucket: Bucket) => {
        confirmAction("Delete Bucket", `Delete bucket "${bucket.name}"?`, async () => {
            await getSdkStorage(activeProject).deleteBucket(bucket.$id);
            refreshData();
        });
    };
    const handleDeleteFile = (file: Models.File) => {
        if (!selectedBucket) return;
        confirmAction("Delete File", `Delete file "${file.name}"?`, async () => {
            await getSdkStorage(activeProject).deleteFile(selectedBucket.$id, file.$id);
            fetchFiles(selectedBucket.$id);
        });
    };

    // Functions
    const handleDeleteFunction = (func: AppwriteFunction) => {
        confirmAction("Delete Function", `Delete function "${func.name}"?`, async () => {
            await getSdkFunctions(activeProject).delete(func.$id);
            refreshData();
        });
    };
    
    const handleActivateDeployment = (depId: string) => {
        if (!selectedFunction) return;
        confirmAction("Activate Deployment", "Are you sure you want to activate this deployment?", async () => {
            (getSdkFunctions(activeProject) as any).updateDeployment(selectedFunction.$id, depId);
            fetchFunctionDetails(selectedFunction.$id);
        });
    };
    
    // New: Bulk Delete Deployments
    const handleBulkDeleteDeployments = (deploymentIds: string[]) => {
        if (!selectedFunction) return;
        confirmAction(
            "Delete Deployments", 
            `Are you sure you want to delete ${deploymentIds.length} deployments? This cannot be undone.`, 
            async () => {
                const sdk = getSdkFunctions(activeProject);
                const promises = deploymentIds.map(id => sdk.deleteDeployment(selectedFunction.$id, id));
                await Promise.all(promises);
                fetchFunctionDetails(selectedFunction.$id);
            }
        );
    };

    // New Functionality: Delete All Executions
    const handleDeleteAllExecutions = () => {
        if (!selectedFunction) return;
        confirmAction(
            "Clear All Execution History", 
            `Are you sure you want to delete ALL executions for function "${selectedFunction.name}"? This will delete executions recursively until none remain. This might take a while for thousands of logs.`, 
            async () => {
                const sdk = getSdkFunctions(activeProject);
                
                let deletedCount = 0;
                while (true) {
                    // Fetch the next batch of 100
                    const res = await sdk.listExecutions(selectedFunction.$id, [
                        Query.limit(100)
                    ]);
                    
                    if (res.executions.length === 0) break;

                    // Delete them concurrently
                    await Promise.all(res.executions.map(ex => 
                        sdk.deleteExecution(selectedFunction.$id, ex.$id).catch(e => console.warn(`Failed to delete execution ${ex.$id}`, e))
                    ));
                    
                    deletedCount += res.executions.length;
                    
                    // If less than 100 were returned, we are done
                    if (res.executions.length < 100) break;
                }
                
                console.log(`Successfully deleted ${deletedCount} executions.`);
                fetchFunctionDetails(selectedFunction.$id);
            }
        );
    };

    // Formatted Headers Helper
    const formatHeaders = (headers: any[]) => {
        if (!headers || !Array.isArray(headers) || headers.length === 0) return <span className="text-gray-500 italic">No headers</span>;
        return (
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono">
                {headers.map((h, i) => (
                    <React.Fragment key={i}>
                        <span className="text-gray-400 text-right select-none">{h.name}:</span>
                        <span className="text-gray-200 break-all">{h.value}</span>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Updated: View Execution Logs with separated details
    const handleViewExecution = (exec: Models.Execution) => {
        const e = exec as any;
        const logs = e.logs || e.stdout || '';
        const errors = e.errors || e.stderr || '';
        const requestMethod = e.requestMethod || 'GET';
        const requestPath = e.requestPath || '/';
        const statusCode = e.responseStatusCode || 200;
        const duration = e.duration || 0;
        const trigger = e.trigger || 'http';

        setModal({
            isOpen: true,
            type: 'custom',
            title: `Execution Details`,
            size: '3xl',
            hideCancel: true,
            confirmLabel: "Close",
            confirmClass: "bg-gray-700 hover:bg-gray-600",
            content: (
                <div className="space-y-6">
                    {/* Header Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Status</span>
                            <span className={`text-sm font-bold ${e.status === 'completed' ? 'text-green-400' : e.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {e.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Method</span>
                            <span className="text-sm font-mono text-purple-300">{requestMethod}</span>
                        </div>
                         <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Duration</span>
                            <span className="text-sm font-mono text-gray-300">{duration.toFixed(3)}s</span>
                        </div>
                         <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Status Code</span>
                            <span className={`text-sm font-mono ${statusCode >= 400 ? 'text-red-400' : 'text-green-400'}`}>{statusCode}</span>
                        </div>
                    </div>

                    {/* General Info */}
                    <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 space-y-2 text-xs">
                         <div className="flex justify-between border-b border-gray-800 pb-2 group">
                            <span className="text-gray-500">Execution ID</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-gray-300 select-all">{e.$id}</span>
                                <CopyButton text={e.$id} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <div className="flex justify-between border-b border-gray-800 pb-2">
                            <span className="text-gray-500">Trigger</span>
                            <span className="text-gray-300 capitalize">{trigger}</span>
                        </div>
                         <div className="flex justify-between border-b border-gray-800 pb-2">
                            <span className="text-gray-500">Created At</span>
                            <span className="text-gray-300">{new Date(e.$createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Path</span>
                            <span className="font-mono text-gray-300 break-all">{requestPath}</span>
                        </div>
                    </div>

                    {/* Request Details */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Request Headers</h4>
                        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3 max-h-40 overflow-y-auto custom-scrollbar">
                             {formatHeaders(e.requestHeaders)}
                        </div>
                    </div>

                    {/* Response Details */}
                     <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Response</h4>
                        
                        <div className="space-y-2">
                            {/* Response Body */}
                            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                                <div className="bg-gray-800/50 px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-800">Body</div>
                                <div className="p-3 overflow-x-auto max-h-40 custom-scrollbar">
                                    <pre className="text-xs font-mono text-blue-200 whitespace-pre-wrap">{e.responseBody || '(Empty)'}</pre>
                                </div>
                            </div>
                            
                            {/* Response Headers */}
                            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                                <div className="bg-gray-800/50 px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-800">Headers</div>
                                <div className="p-3 max-h-40 overflow-y-auto custom-scrollbar">
                                    {formatHeaders(e.responseHeaders)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logs & Errors */}
                    <div className="space-y-4 pt-2 border-t border-gray-800">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logs</h4>
                                {logs && <CopyButton text={logs} showLabel={true} className="bg-gray-800 px-2 py-1 rounded border border-gray-700 hover:bg-gray-700" iconSize={10} />}
                            </div>
                            <div className="bg-black/30 rounded-lg border border-gray-800 p-3 overflow-x-auto max-h-48 custom-scrollbar">
                                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{logs || <span className="text-gray-600 italic">No logs available</span>}</pre>
                            </div>
                        </div>

                        {errors && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Errors</h4>
                                    <CopyButton text={errors} showLabel={true} className="bg-gray-800 px-2 py-1 rounded border border-gray-700 hover:bg-gray-700" iconSize={10} />
                                </div>
                                <div className="bg-red-950/10 rounded-lg border border-red-900/30 p-3 overflow-x-auto max-h-48 custom-scrollbar">
                                    <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap">{errors}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ),
            onConfirm: () => {} // Just closes
        });
    };

    // Users
    const handleCreateUser = () => {
        openForm("Create User", [
            { name: 'userId', label: 'User ID', defaultValue: 'unique()', required: true, placeholder: 'unique() or custom_id', description: 'Enter "unique()" to auto-generate.' },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
            { name: 'name', label: 'Name' },
            { name: 'phone', label: 'Phone', placeholder: '+123456789' }
        ], async (data) => {
            const id = data.userId === 'unique()' ? ID.unique() : data.userId;
            await getSdkUsers(activeProject).create(id, data.email, data.phone || undefined, data.password, data.name || undefined);
            fetchUsers();
        });
    };
    const handleDeleteUser = (u: Models.User<any>) => {
        confirmAction("Delete User", `Delete user "${u.email}"?`, async () => {
            await getSdkUsers(activeProject).delete(u.$id);
            fetchUsers();
        });
    };

    // Teams
    const handleCreateTeam = () => {
        openForm("Create Team", [
            { name: 'teamId', label: 'Team ID', defaultValue: 'unique()', required: true, placeholder: 'unique() or custom_id', description: 'Enter "unique()" to auto-generate.' },
            { name: 'name', label: 'Team Name', required: true },
            { name: 'roles', label: 'Roles (Comma Separated)', placeholder: 'admin, editor' }
        ], async (data) => {
            const id = data.teamId === 'unique()' ? ID.unique() : data.teamId;
            const roles = data.roles ? data.roles.split(',').map((r:string)=>r.trim()).filter(Boolean) : undefined;
            await getSdkTeams(activeProject).create(id, data.name, roles);
            fetchTeams();
        });
    };
    const handleDeleteTeam = (t: Models.Team<any>) => {
        confirmAction("Delete Team", `Delete team "${t.name}"?`, async () => {
            await getSdkTeams(activeProject).delete(t.$id);
            fetchTeams();
        });
    };
    const handleCreateMembership = () => {
        if (!selectedTeam) return;
        openForm("Invite Member", [
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'name', label: 'Name', placeholder: 'Optional' },
            { name: 'url', label: 'Redirect URL', defaultValue: 'http://localhost' },
            { name: 'roles', label: 'Roles (comma separated)', placeholder: 'owner, editor' }
        ], async (data) => {
            const roles = data.roles ? data.roles.split(',').map((r: string) => r.trim()) : [];
            await getSdkTeams(activeProject).createMembership(selectedTeam.$id, roles, data.url, data.email, data.name);
            fetchMemberships(selectedTeam.$id);
        }, "Invite");
    };
    const handleDeleteMembership = (m: Models.Membership) => {
        if (!selectedTeam) return;
        confirmAction("Remove Member", `Remove ${m.userEmail} from team?`, async () => {
            await getSdkTeams(activeProject).deleteMembership(selectedTeam.$id, m.$id);
            fetchMemberships(selectedTeam.$id);
        });
    };

    return (
        <div className="flex flex-col flex-1 h-full overflow-hidden bg-gray-950/20">
            {/* Header */}
            <div className="flex-shrink-0 z-20 py-2 w-full border-b border-white/5 bg-gray-950/10 backdrop-blur-sm">
                 <StudioNavBar activeTab={activeTab} onTabChange={onTabChange} />
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
                 {isLoading && (
                    <div className="absolute top-4 right-4 z-10">
                        <LoadingSpinnerIcon className="text-cyan-500" />
                    </div>
                 )}
                
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">

                    {activeTab === 'overview' && (
                        <OverviewTab 
                            databases={databases} buckets={buckets} functions={functions} 
                            users={users} teams={teams} onTabChange={onTabChange} 
                        />
                    )}

                    {activeTab === 'database' && (
                        <DatabasesTab 
                            databases={databases} selectedDb={selectedDb} selectedCollection={selectedCollection}
                            collections={collections} documents={documents} attributes={attributes} indexes={indexes}
                            onCreateDatabase={handleCreateDatabase} onDeleteDatabase={handleDeleteDatabase} onSelectDb={setSelectedDb}
                            onCreateCollection={handleCreateCollection} onDeleteCollection={handleDeleteCollection} onSelectCollection={setSelectedCollection}
                            onCreateDocument={handleCreateDocument} onUpdateDocument={handleUpdateDocument} onDeleteDocument={handleDeleteDocument}
                            onCreateAttribute={handleCreateAttribute} onDeleteAttribute={handleDeleteAttribute}
                            onCreateIndex={handleCreateIndex} onDeleteIndex={handleDeleteIndex}
                            onUpdateCollectionSettings={handleUpdateCollectionSettings}
                        />
                    )}

                    {activeTab === 'storage' && (
                        <StorageTab 
                            buckets={buckets} selectedBucket={selectedBucket} files={files}
                            onCreateBucket={handleCreateBucket} onDeleteBucket={handleDeleteBucket} onSelectBucket={setSelectedBucket}
                            onDeleteFile={handleDeleteFile}
                        />
                    )}

                    {activeTab === 'functions' && (
                        <FunctionsTab 
                            functions={functions} selectedFunction={selectedFunction} 
                            deployments={deployments} executions={executions}
                            onCreateFunction={onCreateFunction} onDeleteFunction={handleDeleteFunction} onSelectFunction={setSelectedFunction}
                            onActivateDeployment={handleActivateDeployment}
                            onDeleteAllExecutions={handleDeleteAllExecutions}
                            onViewExecution={handleViewExecution}
                            onBulkDeleteDeployments={handleBulkDeleteDeployments}
                            onEditCode={onEditCode}
                        />
                    )}

                    {activeTab === 'users' && (
                        <UsersTab users={users} onCreateUser={handleCreateUser} onDeleteUser={handleDeleteUser} />
                    )}

                    {activeTab === 'teams' && (
                        <TeamsTab 
                            teams={teams} selectedTeam={selectedTeam} memberships={memberships}
                            onCreateTeam={handleCreateTeam} onDeleteTeam={handleDeleteTeam} onSelectTeam={setSelectedTeam}
                            onCreateMembership={handleCreateMembership} onDeleteMembership={handleDeleteMembership}
                        />
                    )}

                    {activeTab === 'migrations' && (
                        <MigrationsTab activeProject={activeProject} projects={projects} />
                    )}
                </div>
            </div>

            {/* Modal Renderer */}
            {modal && modal.isOpen && (
                <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} size={modal.size}>
                    <div className="space-y-4">
                        {modal.message && <p className="text-gray-300 mb-4">{modal.message}</p>}
                        
                        {/* Custom Content Renderer */}
                        {modal.type === 'custom' && modal.content}

                        {modal.type === 'form' && modal.fields && (
                            <div className="space-y-4">
                                {modal.fields.map(field => (
                                    <div key={field.name}>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{field.label} {field.required && '*'}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 font-mono focus:ring-1 focus:ring-cyan-500 outline-none h-48 custom-scrollbar"
                                                placeholder={field.placeholder}
                                                value={formValues[field.name] || ''}
                                                onChange={e => setFormValues({...formValues, [field.name]: e.target.value})}
                                            />
                                        ) : field.type === 'checkbox' ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox"
                                                    id={`field-${field.name}`}
                                                    checked={!!formValues[field.name]}
                                                    onChange={e => setFormValues({...formValues, [field.name]: e.target.checked})}
                                                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                                />
                                                <label htmlFor={`field-${field.name}`} className="text-sm text-gray-300 select-none cursor-pointer">{field.label}</label>
                                            </div>
                                        ) : field.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none"
                                                    value={formValues[field.name] || ''}
                                                    onChange={e => setFormValues({...formValues, [field.name]: e.target.value})}
                                                >
                                                     {field.options?.map(opt => (
                                                         <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                     ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                                    <ChevronDownIcon size={14} />
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type || 'text'}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:ring-1 focus:ring-cyan-500 outline-none"
                                                placeholder={field.placeholder}
                                                value={formValues[field.name] || ''}
                                                onChange={e => setFormValues({...formValues, [field.name]: e.target.value})}
                                            />
                                        )}
                                        {field.description && <p className="text-xs text-gray-500 mt-1">{field.description}</p>}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-6">
                            {!modal.hideCancel && <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>}
                            <button 
                                onClick={async () => {
                                    if(modal.type === 'custom') {
                                        closeModal();
                                        return;
                                    }
                                    setModalLoading(true);
                                    try {
                                        if(modal.onConfirm) await modal.onConfirm(modal.type === 'form' ? formValues : undefined);
                                        closeModal();
                                    } catch(e) {
                                        console.error(e);
                                        setModalLoading(false);
                                    }
                                }}
                                disabled={modalLoading}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors flex items-center gap-2 ${modal.confirmClass || 'bg-cyan-600 hover:bg-cyan-500'}`}
                            >
                                {modalLoading && <LoadingSpinnerIcon />}
                                {modal.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
