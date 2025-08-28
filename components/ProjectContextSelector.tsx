
import React from 'react';
import type { Database, Collection, Bucket } from '../types';
import { LoadingSpinnerIcon, RefreshIcon } from './Icons';

interface ProjectContextSelectorProps {
    databases: Database[];
    collections: Collection[];
    buckets: Bucket[];
    selectedDatabase: Database | null;
    selectedCollection: Collection | null;
    selectedBucket: Bucket | null;
    onDatabaseSelect: (db: Database | null) => void;
    onCollectionSelect: (collection: Collection | null) => void;
    onBucketSelect: (bucket: Bucket | null) => void;
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

export const ProjectContextSelector: React.FC<ProjectContextSelectorProps> = ({
    databases,
    collections,
    buckets,
    selectedDatabase,
    selectedCollection,
    selectedBucket,
    onDatabaseSelect,
    onCollectionSelect,
    onBucketSelect,
    isLoading,
    onRefresh,
}) => {

    const handleDbChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const dbId = e.target.value;
        const db = databases.find(d => d.$id === dbId) || null;
        onDatabaseSelect(db);
    };

    const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const collectionId = e.target.value;
        const collection = collections.find(c => c.$id === collectionId) || null;
        onCollectionSelect(collection);
    };

    const handleBucketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bucketId = e.target.value;
        const bucket = buckets.find(b => b.$id === bucketId) || null;
        onBucketSelect(bucket);
    };

    return (
        <div className="flex items-center gap-2 md:gap-4 flex-wrap max-w-5xl mx-auto px-2">
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
                label="database-selector"
                aria-label="Select Database"
                value={selectedDatabase?.$id || ''}
                onChange={handleDbChange}
                options={databases}
                placeholder="Select a Database..."
                disabled={isLoading}
            />

            <Selector
                label="collection-selector"
                aria-label="Select Collection"
                value={selectedCollection?.$id || ''}
                onChange={handleCollectionChange}
                options={collections}
                placeholder="Select a Collection..."
                disabled={isLoading || !selectedDatabase}
            />

            <Selector
                label="bucket-selector"
                aria-label="Select Bucket"
                value={selectedBucket?.$id || ''}
                onChange={handleBucketChange}
                options={buckets}
                placeholder="Select a Bucket..."
                disabled={isLoading}
            />
        </div>
    );
};
