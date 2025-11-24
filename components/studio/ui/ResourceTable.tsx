
import React from 'react';
import { AddIcon, EditIcon, DeleteIcon } from '../../Icons';

interface ResourceTableProps<T> {
    title?: string;
    data: T[];
    onDelete?: (item: T) => void;
    onEdit?: (item: T) => void;
    onCreate?: () => void;
    onSelect?: (item: T) => void;
    createLabel?: string;
    renderName?: (item: T) => React.ReactNode;
    renderExtra?: (item: T) => React.ReactNode;
    headers?: string[];
    extraActions?: React.ReactNode;
    
    // Selection props
    selection?: {
        selectedIds: string[];
        onSelectionChange: (ids: string[]) => void;
    };
    // Row highlighting
    isRowActive?: (item: T) => boolean;
}

export const ResourceTable = <T extends { $id: string } & Partial<{ name: string, key: string }>>({ 
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
    extraActions,
    selection,
    isRowActive
}: ResourceTableProps<T>) => {

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selection) return;
        if (e.target.checked) {
            selection.onSelectionChange(data.map(d => d.$id));
        } else {
            selection.onSelectionChange([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (!selection) return;
        if (checked) {
            selection.onSelectionChange([...selection.selectedIds, id]);
        } else {
            selection.onSelectionChange(selection.selectedIds.filter(sid => sid !== id));
        }
    };

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
                            {selection && (
                                <th className="px-6 py-3 w-4">
                                    <input 
                                        type="checkbox" 
                                        className="rounded bg-gray-800 border-gray-600 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                        checked={data.length > 0 && selection.selectedIds.length === data.length}
                                        onChange={handleSelectAll}
                                        disabled={data.length === 0}
                                    />
                                </th>
                            )}
                            <th className="px-6 py-3">{headers[0]}</th>
                            <th className="px-6 py-3">{headers[1]}</th>
                            {renderExtra && <th className="px-6 py-3">{headers[2]}</th>}
                            {(onDelete || onSelect || onEdit) && <th className="px-6 py-3 text-right">{headers[3]}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {data.length === 0 ? (
                            <tr><td colSpan={selection ? 5 : 4} className="px-6 py-12 text-center text-gray-500 italic">No items found.</td></tr>
                        ) : (
                            data.map((item) => {
                                const isActive = isRowActive ? isRowActive(item) : false;
                                return (
                                    <tr 
                                        key={item.$id} 
                                        className={`transition-colors ${isActive ? 'bg-green-900/10' : ''} ${onSelect ? 'hover:bg-gray-700/30 cursor-pointer' : 'hover:bg-gray-700/20'}`}
                                        onClick={() => onSelect && onSelect(item)}
                                    >
                                        {selection && (
                                            <td className="px-6 py-3" onClick={e => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded bg-gray-800 border-gray-600 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                                    checked={selection.selectedIds.includes(item.$id)}
                                                    onChange={(e) => handleSelectRow(item.$id, e.target.checked)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500 max-w-[150px] truncate" title={item.$id}>
                                            {item.$id}
                                            {isActive && <span className="ml-2 text-[10px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold">ACTIVE</span>}
                                        </td>
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
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
