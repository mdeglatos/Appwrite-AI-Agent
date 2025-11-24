
import React from 'react';
import type { Models } from 'node-appwrite';
import { ResourceTable } from '../ui/ResourceTable';

interface UsersTabProps {
    users: Models.User<any>[];
    onCreateUser: () => void;
    onDeleteUser: (u: Models.User<any>) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onCreateUser, onDeleteUser }) => {
    return (
        <ResourceTable 
            title="Users" 
            data={users} 
            onCreate={onCreateUser} 
            onDelete={onDeleteUser} 
            createLabel="New User"
            renderName={(u) => <div><div className="font-medium text-gray-200">{u.name || 'No Name'}</div><div className="text-xs text-gray-500">{u.email}</div></div>}
            renderExtra={(u) => <span className={`text-[10px] ${u.status ? 'text-green-500' : 'text-red-500'}`}>{u.status ? 'Verified' : 'Unverified'}</span>}
            headers={['ID', 'User', 'Status', 'Actions']}
        />
    );
};
