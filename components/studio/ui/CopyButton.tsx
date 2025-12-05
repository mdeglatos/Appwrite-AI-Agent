
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from '../../Icons';

interface CopyButtonProps {
    text: string;
    className?: string;
    iconSize?: number;
    showLabel?: boolean;
    label?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ 
    text, 
    className = "", 
    iconSize = 12,
    showLabel = false,
    label = "Copy" 
}) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button 
            onClick={handleCopy} 
            className={`inline-flex items-center gap-1 transition-colors hover:text-white ${copied ? 'text-green-400' : 'text-gray-500'} ${className}`}
            title="Copy to clipboard"
            type="button"
        >
            {copied ? <CheckIcon size={iconSize} /> : <CopyIcon size={iconSize} />}
            {showLabel && <span className="text-[10px]">{copied ? 'Copied' : label}</span>}
        </button>
    );
};
