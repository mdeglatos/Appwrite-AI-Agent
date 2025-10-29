import React from 'react';
import type { Database, Collection, Bucket, AppwriteFunction } from '../types';
import { LoadingSpinnerIcon, RefreshIcon } from './Icons';

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
    'aria-label': string;
}

const Selector: React.FC<SelectorProps> = ({ label, value, onChange, options, placeholder, disabled = false, 'aria-label': ariaLabel }) => {
    return (
        <div className="flex-1 min-w-48">
            <label htmlFor={label} className="sr-only">{label}</label>
            <select
                id={label}
                value={value}
                onChange={onChange}
                disabled={disabled}
                aria-label={ariaLabel}
                className="w-full bg-gray-700 border border-gray-600 px-2 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
            >
                <option value="">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.$id} value={opt.$id}>
                        {opt.name}
                    </option>
                ))}
            </select>
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
        <div className="p-2 border-b border-gray-700 bg-gray-800/60 flex-shrink-0 shadow-inner">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap max-w-6xl mx-auto px-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 flex-shrink-0">
                    <span>Context:</span>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-1 rounded-full text-gray-400 hover:text-cyan-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center w-6 h-6"
                        aria-label="Refresh context data"
                        title="Refresh context data"
                    >
                        {isLoading ? <LoadingSpinnerIcon /> : <RefreshIcon size={16} />}
                    </button>
                </div>

                <Selector
                    label="database-selector" aria-label="Select Database" value={selectedDatabase?.$id || ''}
                    onChange={handleDbChange} options={databases} placeholder="Select a Database..." disabled={isLoading}
                />
                <Selector
                    label="collection-selector" aria-label="Select Collection" value={selectedCollection?.$id || ''}
                    onChange={handleCollectionChange} options={collections} placeholder="Select a Collection..." disabled={isLoading || !selectedDatabase}
                />
                <Selector
                    label="bucket-selector" aria-label="Select Bucket" value={selectedBucket?.$id || ''}
                    onChange={handleBucketChange} options={buckets} placeholder="Select a Bucket..." disabled={isLoading}
                />
                <Selector
                    label="function-selector" aria-label="Select Function" value={selectedFunction?.$id || ''}
                    onChange={handleFunctionChange} options={functions} placeholder="Select a Function..." disabled={isLoading}
                />
            </div>
        </div>
    );
};
