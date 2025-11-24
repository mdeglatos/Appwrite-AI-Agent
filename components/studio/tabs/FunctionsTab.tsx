
import React, { useState, useEffect } from 'react';
import type { AppwriteFunction } from '../../types';
import type { Models } from 'node-appwrite';
import { ResourceTable } from '../ui/ResourceTable';
import { Breadcrumb } from '../ui/Breadcrumb';
import { CodeIcon, TerminalIcon, EyeIcon, DeleteIcon } from '../../Icons';

interface FunctionsTabProps {
    functions: AppwriteFunction[];
    selectedFunction: AppwriteFunction | null;
    deployments: Models.Deployment[];
    executions: Models.Execution[];
    
    onCreateFunction: () => void;
    onDeleteFunction: (f: AppwriteFunction) => void;
    onSelectFunction: (f: AppwriteFunction | null) => void;
    
    onActivateDeployment: (depId: string) => void;
    
    onDeleteAllExecutions: () => void;
    onViewExecution: (e: Models.Execution) => void;

    // Bulk Actions
    onBulkDeleteDeployments?: (deploymentIds: string[]) => void;
    
    // New prop for code editing
    onEditCode?: (f: AppwriteFunction) => void;
}

export const FunctionsTab: React.FC<FunctionsTabProps> = ({
    functions, selectedFunction, deployments, executions,
    onCreateFunction, onDeleteFunction, onSelectFunction,
    onActivateDeployment,
    onDeleteAllExecutions, onViewExecution,
    onBulkDeleteDeployments,
    onEditCode
}) => {
    const [selectedDeploymentIds, setSelectedDeploymentIds] = useState<string[]>([]);

    // Reset selection when function changes
    useEffect(() => {
        setSelectedDeploymentIds([]);
    }, [selectedFunction?.$id]);

    if (!selectedFunction) {
        return (
            <ResourceTable 
                title="Functions" 
                data={functions} 
                onCreate={onCreateFunction} 
                onDelete={onDeleteFunction} 
                onSelect={(item) => onSelectFunction(item)} 
                createLabel="Create Function" 
                renderExtra={(f) => (
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${f.enabled ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{f.runtime}</span>
                        {onEditCode && (
                             <button
                                onClick={(e) => { e.stopPropagation(); onEditCode(f); }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800 text-purple-300 text-[10px] font-bold rounded transition-colors"
                            >
                                <CodeIcon size={12} /> Source
                            </button>
                        )}
                    </div>
                )}
            />
        );
    }

    return (
        <>
            <Breadcrumb items={[{ label: 'Functions', onClick: () => onSelectFunction(null) }, { label: selectedFunction.name }]} />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
                <div className="flex items-center gap-4">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                            {selectedFunction.name}
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${selectedFunction.enabled ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
                                {selectedFunction.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-mono">
                            <span>{selectedFunction.$id}</span>
                            <span>•</span>
                            <span>{selectedFunction.runtime}</span>
                        </div>
                     </div>
                </div>
                 {onEditCode && (
                    <button
                        onClick={() => onEditCode(selectedFunction)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-900/20 transition-all transform hover:scale-105"
                    >
                        <CodeIcon size={16} /> Edit Source & Deploy
                    </button>
                )}
            </div>

            <div className="space-y-8">
                <ResourceTable 
                    title="Deployments" 
                    data={deployments} 
                    selection={{
                        selectedIds: selectedDeploymentIds,
                        onSelectionChange: setSelectedDeploymentIds
                    }}
                    isRowActive={(d) => d.$id === selectedFunction.deployment}
                    extraActions={
                        selectedDeploymentIds.length > 0 && onBulkDeleteDeployments && (
                            <button 
                                onClick={() => {
                                    onBulkDeleteDeployments(selectedDeploymentIds);
                                    setSelectedDeploymentIds([]);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs font-bold rounded-lg transition-colors"
                            >
                                <DeleteIcon size={14} /> Delete ({selectedDeploymentIds.length})
                            </button>
                        )
                    }
                    renderName={(d) => <span className="flex items-center gap-2"><CodeIcon size={14}/> <span className="font-mono">{d.$id}</span></span>}
                    renderExtra={(d) => (
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${d.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>{d.status}</span>
                            <span className="text-[10px] text-gray-500">{((d as any).size / 1024).toFixed(1)} KB</span>
                            <span className="text-[10px] text-gray-500">{new Date(d.$createdAt).toLocaleString()}</span>
                            {selectedFunction.deployment !== d.$id && d.status === 'ready' && <button onClick={() => onActivateDeployment(d.$id)} className="text-[10px] bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 text-white ml-2">Activate</button>}
                        </div>
                    )}
                />
                
                <div className="flex flex-col h-full">
                        <ResourceTable title="Executions (Logs)" data={executions} 
                        extraActions={
                            executions.length > 0 && (
                                <button 
                                    onClick={onDeleteAllExecutions}
                                    className="flex items-center gap-2 px-2 py-1 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 text-[10px] font-bold rounded-lg transition-colors"
                                >
                                    <DeleteIcon size={12} /> Clear All
                                </button>
                            )
                        }
                        renderName={(e) => <span className="flex items-center gap-2"><TerminalIcon size={14}/> <span className="font-mono">{e.$id}</span></span>}
                        renderExtra={(e) => (
                            <div className="flex items-center justify-between w-full">
                                <span className={`text-[10px] ${e.status === 'completed' ? 'text-green-400' : e.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {e.status} ({e.duration.toFixed(3)}s)
                                </span>
                                <button 
                                    onClick={(ev) => { ev.stopPropagation(); onViewExecution(e); }}
                                    className="ml-2 p-1 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded transition-colors"
                                    title="View Logs"
                                >
                                    <EyeIcon size={14} />
                                </button>
                            </div>
                        )}
                    />
                </div>
            </div>
        </>
    );
};
