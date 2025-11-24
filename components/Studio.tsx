
import React, { useState, useEffect } from 'react';
import { ID, Query, Permission, Role } from '../services/appwrite';
import { getSdkDatabases, getSdkStorage, getSdkFunctions, getSdkUsers, getSdkTeams } from '../services/appwrite';
import type { AppwriteProject, Database, Bucket, AppwriteFunction, StudioTab } from '../types';
import type { Models } from 'node-appwrite';
import { Modal } from './Modal';
import { 
    DatabaseIcon, StorageIcon, FunctionIcon, TeamIcon,
    AddIcon, DeleteIcon, LoadingSpinnerIcon,
    ArrowLeftIcon, FileIcon, CodeIcon, TerminalIcon,
    EditIcon, SettingsIcon, ChevronDownIcon, CheckIcon, UserIcon,
    KeyIcon, WarningIcon, DashboardIcon
} from './Icons';

interface StudioProps {
    activeProject: AppwriteProject;
    databases: Database[];
    buckets: Bucket[];
    functions: AppwriteFunction[];
    refreshData: () => void;
    onCreateFunction: () => void;
    activeTab: StudioTab;
    onTabChange: (tab: StudioTab) => void;
}

// -- Modal Types --
type ModalType = 'confirm' | 'form';
interface FormField {
    name: string;
    label: string;
    type?: 'text' | 'password' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox';
    placeholder?: string;
    defaultValue?: string | boolean | number;
    options?: { label: string; value: string }[];
    required?: boolean;
    description?: string;
}

interface ModalState {
    isOpen: boolean;
    type: ModalType;
    title: string;
    message?: string; // For confirmation
    fields?: FormField[]; // For forms
    confirmLabel?: string;
    confirmClass?: string;
    onConfirm: (formData: any) => Promise<void> | void;
}

type CollectionTab = 'documents' | 'attributes' | 'indexes' | 'settings';

// -- Components --

const StatCard = ({ title, value, icon, color, onClick, description }: { title: string, value: string | number, icon: React.ReactNode, color: string, onClick?: () => void, description?: string }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col justify-between min-h-[140px] transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-gray-800/60 hover:border-gray-600 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 group' : ''}`}
    >
        <div className={`absolute top-0 right-0 p-24 rounded-full blur-3xl opacity-5 transition-opacity duration-300 group-hover:opacity-10 ${color.replace('text-', 'bg-')}`}></div>

        <div className="flex justify-between items-start z-10">
            <div className={`p-3 rounded-xl bg-gray-900/80 backdrop-blur-sm ${color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                {icon}
            </div>
             {onClick && (
                <div className="text-gray-600 group-hover:text-gray-300 transition-colors transform rotate-180">
                     <ArrowLeftIcon size={20} />
                </div>
            )}
        </div>

        <div className="mt-4 z-10">
             <h3 className="text-3xl font-bold text-gray-100 mb-1 tracking-tight">{value}</h3>
             <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">{title}</p>
             {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
        </div>
    </div>
);

const ResourceTable = <T extends { $id: string } & Partial<{ name: string, key: string }>>({ 
    title, 
    data, 
    onDelete, 
    onEdit,
    onCreate, 
    onSelect,
    createLabel = "Create",
    renderName,
    renderExtra,
    headers = ['ID', 'Name / Key', 'Details', 'Actions'],
    extraActions
}: { 
    title?: string, 
    data: T[], 
    onDelete?: (item: T) => void, 
    onEdit?: (item: T) => void,
    onCreate?: () => void, 
    onSelect?: (item: T) => void,
    createLabel?: string,
    renderName?: (item: T) => React.ReactNode,
    renderExtra?: (item: T) => React.ReactNode,
    headers?: string[],
    extraActions?: React.ReactNode
}) => {
    return (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden animate-fade-in h-full flex flex-col shadow-sm">
            {(title || onCreate || extraActions) && (
                <div className="p-4 border-b border-gray-700/50 flex flex-wrap justify-between items-center bg-gray-900/30 gap-3">
                    {title && <h3 className="text-lg font-semibold text-gray-200">{title}</h3>}
                    <div className="flex items-center gap-2 ml-auto">
                        {extraActions}
                        {onCreate && (
                            <button onClick={onCreate} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-cyan-900/20">
                                <AddIcon /> {createLabel}
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-900/50 text-xs uppercase font-semibold text-gray-500 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th className="px-6 py-3">{headers[0]}</th>
                            <th className="px-6 py-3">{headers[1]}</th>
                            {renderExtra && <th className="px-6 py-3">{headers[2]}</th>}
                            {(onDelete || onSelect || onEdit) && <th className="px-6 py-3 text-right">{headers[3]}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {data.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No items found.</td></tr>
                        ) : (
                            data.map((item) => (
                                <tr 
                                    key={item.$id} 
                                    className={`transition-colors ${onSelect ? 'hover:bg-gray-700/30 cursor-pointer' : 'hover:bg-gray-700/20'}`}
                                    onClick={() => onSelect && onSelect(item)}
                                >
                                    <td className="px-6 py-3 font-mono text-xs text-gray-500 max-w-[150px] truncate" title={item.$id}>{item.$id}</td>
                                    <td className="px-6 py-3 font-medium text-gray-200">
                                        {renderName ? renderName(item) : (item.name || item.key || 'Unknown')}
                                    </td>
                                    {renderExtra && <td className="px-6 py-3">{renderExtra(item)}</td>}
                                    {(onDelete || onSelect || onEdit) && (
                                        <td className="px-6 py-3 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                {onEdit && (
                                                    <button 
                                                        onClick={() => onEdit(item)}
                                                        className="text-gray-500 hover:text-cyan-400 p-1.5 rounded hover:bg-gray-800 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button 
                                                        onClick={() => onDelete(item)}
                                                        className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-gray-800 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <DeleteIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Studio: React.FC<StudioProps> = ({ activeProject, databases, buckets, functions, refreshData, onCreateFunction, activeTab, onTabChange }) => {
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

    // -- Collection View State --
    const [collectionTab, setCollectionTab] = useState<CollectionTab>('documents');

    // -- Sub-resource Data States --
    const [collections, setCollections] = useState<Models.Collection[]>([]);
    const [documents, setDocuments] = useState<Models.Document[]>([]);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [indexes, setIndexes] = useState<any[]>([]);
    const [files, setFiles] = useState<Models.File[]>([]);
    const [deployments, setDeployments] = useState<Models.Deployment[]>([]);
    const [executions, setExecutions] = useState<Models.Execution[]>([]);
    const [variables, setVariables] = useState<Models.Variable[]>([]);
    const [memberships, setMemberships] = useState<Models.Membership[]>([]);

    // -- Modal State --
    const [modal, setModal] = useState<ModalState | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [formValues, setFormValues] = useState<any>({});
    
    // -- Attribute Type Selector State --
    const [attributeType, setAttributeType] = useState<string>('string');

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

    // -- Reset Collection Tab when Collection Changes --
    useEffect(() => {
        setCollectionTab('documents');
    }, [selectedCollection?.$id]);

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
            const [deps, execs, vars] = await Promise.all([
                sdk.listDeployments(funcId, [Query.limit(20), Query.orderDesc('$createdAt')]),
                sdk.listExecutions(funcId, [Query.limit(20), Query.orderDesc('$createdAt')]),
                sdk.listVariables(funcId)
            ]);
            setDeployments(deps.deployments);
            setExecutions(execs.executions);
            setVariables(vars.variables);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
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
    useEffect(() => { 
        if (activeTab === 'users' || activeTab === 'overview') fetchUsers(); 
    }, [activeTab]);

    useEffect(() => { 
        if (activeTab === 'teams' || activeTab === 'overview') fetchTeams(); 
    }, [activeTab]);

    useEffect(() => { if (selectedDb) fetchCollections(selectedDb.$id); }, [selectedDb]);
    
    // Dependent fetch for collection details
    useEffect(() => { 
        if (selectedCollection && selectedDb) {
            fetchCollectionDetails(selectedDb.$id, selectedCollection.$id); 
        }
    }, [selectedCollection?.$id, selectedDb?.$id]);

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
                throw e; // prevent modal close
            }
        });
    };
    const handleUpdateDocument = (doc: Models.Document) => {
        if (!selectedDb || !selectedCollection) return;
        // Strip internal attributes for editing
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
                
                // Update data
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

    // Attributes - Specific Handlers
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
                id, 
                data.name, 
                undefined, // permissions
                data.fileSecurity, 
                data.enabled, 
                maxSize, 
                exts, 
                data.compression, 
                data.encryption, 
                data.antivirus
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
    const handleDeleteVariable = (v: Models.Variable) => {
        if (!selectedFunction) return;
        confirmAction("Delete Variable", `Delete variable "${v.key}"?`, async () => {
            await getSdkFunctions(activeProject).deleteVariable(selectedFunction.$id, v.$id);
            fetchFunctionDetails(selectedFunction.$id);
        });
    };
    const handleCreateVariable = () => {
        if (!selectedFunction) return;
        openForm("Add Environment Variable", [
            { name: 'key', label: 'Key', required: true, placeholder: 'API_KEY' },
            { name: 'value', label: 'Value', required: true, placeholder: 'secret-value' }
        ], async (data) => {
            await getSdkFunctions(activeProject).createVariable(selectedFunction.$id, data.key, data.value);
            fetchFunctionDetails(selectedFunction.$id);
        });
    };
    const handleActivateDeployment = (depId: string) => {
        if (!selectedFunction) return;
        confirmAction("Activate Deployment", "Are you sure you want to activate this deployment?", async () => {
            await getSdkFunctions(activeProject).updateDeployment(selectedFunction.$id, depId);
            fetchFunctionDetails(selectedFunction.$id);
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

    // -- Render Helpers --
    interface BreadcrumbItem {
        label: string;
        onClick?: () => void;
    }

    const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
        <div className="flex items-center gap-2 mb-6 text-sm">
            {items.map((item, i) => {
                const isLast = i === items.length - 1;
                return (
                    <React.Fragment key={i}>
                        {item.onClick && !isLast ? (
                            <button 
                                onClick={item.onClick} 
                                className="text-gray-400 hover:text-cyan-400 transition-colors hover:underline flex items-center gap-1"
                            >
                                {i === 0 && <ArrowLeftIcon size={14} className="mr-1" />}
                                {item.label}
                            </button>
                        ) : (
                            <span className={`flex items-center gap-1 ${isLast ? "text-gray-200 font-bold" : "text-gray-400"}`}>
                                {i === 0 && !item.onClick && <span className="opacity-50"><DashboardIcon size={14} className="mr-1"/></span>}
                                {item.label}
                            </span>
                        )}
                        {!isLast && <span className="text-gray-600">/</span>}
                    </React.Fragment>
                );
            })}
        </div>
    );
    
    // -- Navigation Bar --
    const StudioNavBar = ({ activeTab, onTabChange }: { activeTab: StudioTab, onTabChange: (t: StudioTab) => void }) => {
        const tabs: { id: StudioTab, label: string, icon: React.ReactNode }[] = [
            { id: 'overview', label: 'Overview', icon: <DashboardIcon size={16} /> },
            { id: 'database', label: 'Databases', icon: <DatabaseIcon size={16} /> },
            { id: 'storage', label: 'Storage', icon: <StorageIcon size={16} /> },
            { id: 'functions', label: 'Functions', icon: <FunctionIcon size={16} /> },
            { id: 'users', label: 'Users', icon: <UserIcon size={16} /> },
            { id: 'teams', label: 'Teams', icon: <TeamIcon size={16} /> },
        ];

        return (
            <div className="flex items-center justify-center gap-1 mb-6 p-1 bg-gray-900/50 rounded-xl border border-gray-800/50 w-fit mx-auto sticky top-0 z-20 backdrop-blur-md shadow-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                            ${activeTab === tab.id 
                                ? 'bg-gray-800 text-cyan-400 shadow-sm border border-gray-700/50' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}
                        `}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>
        );
    };

    // -- Settings Form Component for Collection --
    const CollectionSettings = () => {
        if(!selectedCollection) return null;
        const [name, setName] = useState(selectedCollection.name);
        const [permissions, setPermissions] = useState(selectedCollection.$permissions.join(', '));
        const [enabled, setEnabled] = useState(selectedCollection.enabled);
        const [security, setSecurity] = useState(selectedCollection.documentSecurity);
        const [isSaving, setIsSaving] = useState(false);

        const handleSave = async () => {
            setIsSaving(true);
            try {
                await handleUpdateCollectionSettings({
                    name, 
                    permissions, 
                    enabled, 
                    documentSecurity: security
                });
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <SettingsIcon className="text-gray-400" /> General Settings
                    </h3>
                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Collection Name</label>
                            <input 
                                type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Permissions</label>
                            <input 
                                type="text" value={permissions} onChange={e => setPermissions(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:border-cyan-500 outline-none"
                                placeholder='read("any"), create("users")'
                            />
                        </div>
                        <div className="flex gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded bg-gray-800 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                                <span className="text-sm text-gray-300">Enabled</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={security} onChange={e => setSecurity(e.target.checked)} className="rounded bg-gray-800 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                                <span className="text-sm text-gray-300">Document Security</span>
                            </label>
                        </div>
                        <div className="pt-4">
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-900/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <LoadingSpinnerIcon /> : <CheckIcon />} Save Changes
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                        <WarningIcon /> Danger Zone
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Deleting a collection is permanent and will delete all documents contained within it.</p>
                    <button 
                        onClick={() => handleDeleteCollection(selectedCollection)}
                        className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 text-sm font-semibold rounded-lg transition-colors"
                    >
                        Delete Collection
                    </button>
                </div>
            </div>
        )
    };

    return (
        <div className="flex flex-1 h-full overflow-hidden bg-gray-950">
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
                 {isLoading && (
                    <div className="absolute top-4 right-4 z-10">
                        <LoadingSpinnerIcon className="text-cyan-500" />
                    </div>
                 )}

                 <StudioNavBar activeTab={activeTab} onTabChange={onTabChange} />
                
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <>
                            <header><h1 className="text-2xl font-bold text-gray-100 mb-4">Project Overview</h1></header>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                <StatCard 
                                    title="Databases" 
                                    value={databases.length} 
                                    icon={<DatabaseIcon />} 
                                    color="text-red-400"
                                    onClick={() => onTabChange('database')}
                                    description="Manage your data structure"
                                />
                                <StatCard 
                                    title="Buckets" 
                                    value={buckets.length} 
                                    icon={<StorageIcon />} 
                                    color="text-green-400"
                                    onClick={() => onTabChange('storage')}
                                    description="File storage & permissions"
                                />
                                <StatCard 
                                    title="Functions" 
                                    value={functions.length} 
                                    icon={<FunctionIcon />} 
                                    color="text-blue-400"
                                    onClick={() => onTabChange('functions')}
                                    description="Serverless logic & runtimes"
                                />
                                <StatCard 
                                    title="Users" 
                                    value={users.length} 
                                    icon={<UserIcon />} 
                                    color="text-purple-400"
                                    onClick={() => onTabChange('users')}
                                    description="Auth & User management"
                                />
                                <StatCard 
                                    title="Teams" 
                                    value={teams.length} 
                                    icon={<TeamIcon />} 
                                    color="text-yellow-400"
                                    onClick={() => onTabChange('teams')}
                                    description="Organization & Roles"
                                />
                            </div>
                        </>
                    )}

                    {/* DATABASES */}
                    {activeTab === 'database' && (
                        !selectedDb ? (
                            <ResourceTable title="Databases" data={databases} onCreate={handleCreateDatabase} onDelete={handleDeleteDatabase} onSelect={(item) => setSelectedDb(item)} createLabel="New DB" />
                        ) : !selectedCollection ? (
                            <>
                                <Breadcrumb items={[{ label: 'Databases', onClick: () => setSelectedDb(null) }, { label: selectedDb.name }]} />
                                <ResourceTable title={`Collections in ${selectedDb.name}`} data={collections} onCreate={handleCreateCollection} onDelete={handleDeleteCollection} onSelect={setSelectedCollection} createLabel="New Collection" />
                            </>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="mb-6">
                                    <Breadcrumb items={[{ label: 'Databases', onClick: () => setSelectedDb(null) }, { label: selectedDb.name, onClick: () => setSelectedCollection(null) }, { label: selectedCollection.name }]} />
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-cyan-900/30 rounded-lg text-cyan-400"><DatabaseIcon size={24} /></div>
                                            <div>
                                                <h1 className="text-xl font-bold text-gray-100">{selectedCollection.name}</h1>
                                                <p className="text-xs font-mono text-gray-500">{selectedCollection.$id}</p>
                                            </div>
                                            {!selectedCollection.enabled && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-red-900/30 text-red-400 border border-red-900/50 uppercase font-bold">Disabled</span>}
                                        </div>
                                    </div>
                                    
                                    {/* Tabs */}
                                    <div className="flex border-b border-gray-800">
                                        {[
                                            { id: 'documents', label: 'Documents', icon: <FileIcon size={14} /> },
                                            { id: 'attributes', label: 'Attributes', icon: <DatabaseIcon size={14} /> },
                                            { id: 'indexes', label: 'Indexes', icon: <KeyIcon size={14} /> },
                                            { id: 'settings', label: 'Settings', icon: <SettingsIcon size={14} /> }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setCollectionTab(tab.id as CollectionTab)}
                                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${collectionTab === tab.id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {tab.icon} {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    {collectionTab === 'documents' && (
                                        <ResourceTable 
                                            data={documents} 
                                            onCreate={handleCreateDocument} 
                                            onDelete={handleDeleteDocument} 
                                            onEdit={handleUpdateDocument}
                                            createLabel="Add Document" 
                                            renderName={(doc) => <span className="font-mono text-xs text-gray-300">{JSON.stringify(doc).slice(0, 80)}...</span>} 
                                            headers={['ID', 'Data Preview', '', 'Actions']}
                                        />
                                    )}

                                    {collectionTab === 'attributes' && (
                                        <ResourceTable 
                                            data={attributes} 
                                            onDelete={(item) => handleDeleteAttribute(item)} 
                                            createLabel="Add Attribute"
                                            onCreate={() => handleCreateAttribute(attributeType)}
                                            extraActions={
                                                <div className="relative mr-2">
                                                    <select 
                                                        value={attributeType} 
                                                        onChange={e => setAttributeType(e.target.value)}
                                                        className="bg-gray-800 border border-gray-600 text-gray-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 appearance-none pr-8 cursor-pointer"
                                                    >
                                                        <option value="string">String</option>
                                                        <option value="integer">Integer</option>
                                                        <option value="float">Float</option>
                                                        <option value="boolean">Boolean</option>
                                                        <option value="email">Email</option>
                                                        <option value="url">URL</option>
                                                        <option value="ip">IP</option>
                                                        <option value="enum">Enum</option>
                                                        <option value="datetime">Datetime</option>
                                                        <option value="relationship">Relationship</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500">
                                                        <ChevronDownIcon size={12} />
                                                    </div>
                                                </div>
                                            }
                                            renderName={(item) => <span className="font-mono text-cyan-300">{item.key} <span className="text-gray-500">({item.type})</span></span>} 
                                            headers={['Key', 'Type', 'Details', 'Actions']}
                                            renderExtra={(item) => (
                                                <div className="flex gap-2">
                                                    {item.required && <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">Req</span>}
                                                    {item.array && <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">Array</span>}
                                                </div>
                                            )}
                                        />
                                    )}

                                    {collectionTab === 'indexes' && (
                                         <ResourceTable 
                                            data={indexes} 
                                            onDelete={(item) => handleDeleteIndex(item)} 
                                            onCreate={handleCreateIndex} 
                                            createLabel="Add Index"
                                            renderName={(item) => <span className="font-mono text-yellow-300">{item.key} <span className="text-gray-500">({item.type})</span></span>} 
                                            headers={['Key', 'Type', 'Details', 'Actions']}
                                            renderExtra={(item) => <span className="text-xs text-gray-500">{item.attributes.join(', ')}</span>}
                                        />
                                    )}

                                    {collectionTab === 'settings' && (
                                        <CollectionSettings />
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    {/* STORAGE */}
                    {activeTab === 'storage' && (
                        !selectedBucket ? (
                            <ResourceTable title="Storage Buckets" data={buckets} onCreate={handleCreateBucket} onDelete={handleDeleteBucket} onSelect={(item) => setSelectedBucket(item)} createLabel="New Bucket" />
                        ) : (
                            <>
                                <Breadcrumb items={[{ label: 'Storage', onClick: () => setSelectedBucket(null) }, { label: selectedBucket.name }]} />
                                <ResourceTable title={`Files in ${selectedBucket.name}`} data={files} onDelete={handleDeleteFile} 
                                    renderName={(f) => <div className="flex items-center gap-2"><FileIcon size={14}/> {f.name}</div>}
                                    renderExtra={(f) => <span className="text-xs text-gray-500">{(f.sizeOriginal / 1024).toFixed(1)} KB</span>}
                                />
                                <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-400">To upload files, use the Agent chat interface with the file attachment button.</p>
                                </div>
                            </>
                        )
                    )}

                    {/* FUNCTIONS */}
                    {activeTab === 'functions' && (
                        !selectedFunction ? (
                            <ResourceTable title="Functions" data={functions} onCreate={onCreateFunction} onDelete={handleDeleteFunction} onSelect={(item) => setSelectedFunction(item)} createLabel="Create Function" 
                                renderExtra={(f) => <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${f.enabled ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{f.runtime}</span>}
                            />
                        ) : (
                            <>
                                <Breadcrumb items={[{ label: 'Functions', onClick: () => setSelectedFunction(null) }, { label: selectedFunction.name }]} />
                                <div className="space-y-8">
                                    <ResourceTable title="Deployments" data={deployments} 
                                        renderName={(d) => <span className="flex items-center gap-2"><CodeIcon size={14}/> <span className="font-mono">{d.$id}</span></span>}
                                        renderExtra={(d) => (
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] ${d.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>{d.status}</span>
                                                {selectedFunction.deployment !== d.$id && <button onClick={() => handleActivateDeployment(d.$id)} className="text-[10px] bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 text-white">Activate</button>}
                                                {selectedFunction.deployment === d.$id && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-500/30">Active</span>}
                                            </div>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <ResourceTable title="Variables" data={variables} onCreate={handleCreateVariable} onDelete={handleDeleteVariable} createLabel="Add Var"
                                            renderName={(v) => <span className="font-mono text-cyan-300">{v.key}</span>}
                                            renderExtra={(v) => <span className="font-mono text-gray-500 text-xs">***</span>}
                                        />
                                        <ResourceTable title="Executions (Logs)" data={executions} 
                                            renderName={(e) => <span className="flex items-center gap-2"><TerminalIcon size={14}/> <span className="font-mono">{e.$id}</span></span>}
                                            renderExtra={(e) => <span className={`text-[10px] ${e.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>{e.status} ({e.duration}s)</span>}
                                        />
                                    </div>
                                </div>
                            </>
                        )
                    )}

                    {/* USERS */}
                    {activeTab === 'users' && (
                        <ResourceTable title="Users" data={users} onCreate={handleCreateUser} onDelete={handleDeleteUser} createLabel="New User"
                            renderName={(u) => <div><div className="font-medium text-gray-200">{u.name || 'No Name'}</div><div className="text-xs text-gray-500">{u.email}</div></div>}
                            renderExtra={(u) => <span className={`text-[10px] ${u.status ? 'text-green-500' : 'text-red-500'}`}>{u.status ? 'Verified' : 'Unverified'}</span>}
                            headers={['ID', 'User', 'Status', 'Actions']}
                        />
                    )}

                    {/* TEAMS */}
                    {activeTab === 'teams' && (
                        !selectedTeam ? (
                            <ResourceTable title="Teams" data={teams} onCreate={handleCreateTeam} onDelete={handleDeleteTeam} onSelect={(item) => setSelectedTeam(item)} createLabel="New Team" />
                        ) : (
                            <>
                                <Breadcrumb items={[{ label: 'Teams', onClick: () => setSelectedTeam(null) }, { label: selectedTeam.name }]} />
                                <ResourceTable title="Memberships" data={memberships} onCreate={handleCreateMembership} onDelete={handleDeleteMembership} createLabel="Invite Member"
                                    renderName={(m) => <div><div className="text-gray-200">{m.userName || m.userEmail}</div><div className="text-xs text-gray-500">{m.userEmail}</div></div>}
                                    renderExtra={(m) => <div className="flex gap-1">{m.roles.map(r => <span key={r} className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">{r}</span>)}</div>}
                                    headers={['ID', 'User', 'Roles', 'Actions']}
                                />
                            </>
                        )
                    )}
                </div>
            </div>

            {/* Modal Renderer */}
            {modal && modal.isOpen && (
                <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title}>
                    <div className="space-y-4">
                        {modal.message && <p className="text-gray-300 mb-4">{modal.message}</p>}
                        
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
                            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                            <button 
                                onClick={async () => {
                                    setModalLoading(true);
                                    try {
                                        await modal.onConfirm(modal.type === 'form' ? formValues : undefined);
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
