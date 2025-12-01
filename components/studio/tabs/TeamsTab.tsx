
import React from 'react';
import type { Models } from 'node-appwrite';
import { ResourceTable } from '../ui/ResourceTable';
import { Breadcrumb } from '../ui/Breadcrumb';

interface TeamsTabProps {
    teams: Models.Team<any>[];
    selectedTeam: Models.Team<any> | null;
    memberships: Models.Membership[];
    onCreateTeam: () => void;
    onDeleteTeam: (t: Models.Team<any>) => void;
    onSelectTeam: (t: Models.Team<any> | null) => void;
    onCreateMembership: () => void;
    onDeleteMembership: (m: Models.Membership) => void;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({ 
    teams, selectedTeam, memberships, 
    onCreateTeam, onDeleteTeam, onSelectTeam, 
    onCreateMembership, onDeleteMembership 
}) => {
    if (!selectedTeam) {
        return (
            <ResourceTable<Models.Team<any>> 
                title="Teams" 
                data={teams} 
                onCreate={onCreateTeam} 
                onDelete={onDeleteTeam} 
                onSelect={(item) => onSelectTeam(item)} 
                createLabel="New Team" 
            />
        );
    }

    return (
        <>
            <Breadcrumb items={[{ label: 'Teams', onClick: () => onSelectTeam(null) }, { label: selectedTeam.name }]} />
            <ResourceTable<Models.Membership> 
                title="Memberships" 
                data={memberships} 
                onCreate={onCreateMembership} 
                onDelete={onDeleteMembership} 
                createLabel="Invite Member"
                renderName={(m) => <div><div className="text-gray-200">{m.userName || m.userEmail}</div><div className="text-xs text-gray-500">{m.userEmail}</div></div>}
                renderExtra={(m) => <div className="flex gap-1">{m.roles.map(r => <span key={r} className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">{r}</span>)}</div>}
                headers={['ID', 'User', 'Roles', 'Actions']}
            />
        </>
    );
};
