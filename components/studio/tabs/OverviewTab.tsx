
import React from 'react';
import type { Database, Bucket, AppwriteFunction, StudioTab } from '../../types';
import type { Models } from 'node-appwrite';
import { StatCard } from '../ui/StatCard';
import { DatabaseIcon, StorageIcon, FunctionIcon, UserIcon, TeamIcon } from '../../Icons';

interface OverviewTabProps {
    databases: Database[];
    buckets: Bucket[];
    functions: AppwriteFunction[];
    users: Models.User<any>[];
    teams: Models.Team<any>[];
    onTabChange: (tab: StudioTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ databases, buckets, functions, users, teams, onTabChange }) => {
    return (
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
    );
};
