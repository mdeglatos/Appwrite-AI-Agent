import React from 'react';
import type { Database, Collection, Bucket, AppwriteFunction } from '../types';
import { LoadingSpinnerIcon, RefreshIcon, ChevronDownIcon } from './Icons';

interface ContextBarProps {
    databases: Database[];
    collections: Collection[];
    buckets: Bucket[];
    functions: AppwriteFunction[];
    selectedDatabase: Database | null;
    selectedCollection: Collection | null;
    selectedBucket: Bucket | null;
    selectedFunction: AppwriteFunction | null;
    onDatabaseSelect: (db: Database | null) => void;
    onCollectionSelect: (collection: Collection | null) => void;
    onBucketSelect: (bucket: Bucket | null) => void;
    onFunctionSelect: (fn: AppwriteFunction | null) => void;
    isLoading: boolean;
    onRefresh: () => void;
}

interface SelectorProps {
    label: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { $id: string; name: string }[];
    placeholder: string;
    disabled?: boolean;
}

const Selector: React.FC<SelectorProps> = ({ label, value, onChange, options, placeholder, disabled = false }) => {
    return (
        <div className="relative min-w-[160px] max-w-[200px] flex-1">
            <label htmlFor={label} className="sr-only">{placeholder}</label>
            <select
                id={label}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full appearance-none bg-gray-800/50 hover:bg-gray-800 border border-white/5 hover:border-white/10 rounded-lg py-1.5 pl-3 pr-8 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-50 truncate cursor-pointer"
            >
                <option value="">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.$id} value={opt.$id}>
                        {opt.name}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <ChevronDownIcon size={12} />
            </div>
        </div>
    );
};

export const ContextBar: React.FC<ContextBarProps> = ({
    databases,
    collections,
    buckets,
    functions,
    selectedDatabase,
    selectedCollection,
    selectedBucket,
    selectedFunction,
    onDatabaseSelect,
    onCollectionSelect,
    onBucketSelect,
    onFunctionSelect,
    isLoading,
    onRefresh,
}) => {

    const handleDbChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const dbId = e.target.value;
        onDatabaseSelect(databases.find(d => d.$id === dbId) || null);
    };

    const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const collectionId = e.target.value;
        onCollectionSelect(collections.find(c => c.$id === collectionId) || null);
    };

    const handleBucketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bucketId = e.target.value;
        onBucketSelect(buckets.find(b => b.$id === bucketId) || null);
    };

    const handleFunctionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const funcId = e.target.value;
        onFunctionSelect(functions.find(f => f.$id === funcId) || null);
    };

    return (
        <div className="w-full border-b border-white/5 bg-gray-900/40 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mr-1 flex-shrink-0">
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-1.5 rounded-md hover:bg-gray-700/50 hover:text-cyan-400 transition-colors disabled:animate-spin"
                        title="Refresh Data"
                    >
                        {isLoading ? <LoadingSpinnerIcon /> : <RefreshIcon size={14} />}
                    </button>
                </div>
                
                <div className="h-4 w-px bg-gray-700/50 flex-shrink-0"></div>

                <Selector
                    label="database-select" value={selectedDatabase?.$id || ''}
                    onChange={handleDbChange} options={databases} placeholder="Database" disabled={isLoading}
                />
                <Selector
                    label="collection-select" value={selectedCollection?.$id || ''}
                    onChange={handleCollectionChange} options={collections} placeholder="Collection" disabled={isLoading || !selectedDatabase}
                />
                <Selector
                    label="bucket-select" value={selectedBucket?.$id || ''}
                    onChange={handleBucketChange} options={buckets} placeholder="Storage Bucket" disabled={isLoading}
                />
                <Selector
                    label="function-select" value={selectedFunction?.$id || ''}
                    onChange={handleFunctionChange} options={functions} placeholder="Function" disabled={isLoading}
                />
            </div>
        </div>
    );
};