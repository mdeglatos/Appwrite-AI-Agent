
import React from 'react';
import { ArrowLeftIcon } from '../../Icons';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
    description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, description }) => (
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
