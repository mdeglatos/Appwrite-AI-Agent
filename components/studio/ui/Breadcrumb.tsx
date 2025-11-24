
import React from 'react';
import { ArrowLeftIcon, DashboardIcon } from '../../Icons';

interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
}

export const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
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
