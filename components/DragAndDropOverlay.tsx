import React from 'react';
import { FileUploadIcon } from './Icons';

interface DragAndDropOverlayProps {
    isDragging: boolean;
}

export const DragAndDropOverlay: React.FC<DragAndDropOverlayProps> = ({ isDragging }) => {
    if (!isDragging) return null;

    return (
        <div className="absolute inset-0 z-20">
            <div className="pointer-events-none absolute inset-0 bg-cyan-900/40 backdrop-blur-sm border-4 border-dashed border-cyan-400 rounded-2xl m-4 flex items-center justify-center">
                <div className="text-center text-cyan-200">
                    <FileUploadIcon />
                    <p className="text-xl font-bold mt-2">Drop your files here</p>
                    <p className="text-sm text-cyan-300">Maximum 5 files. 10MB per file.</p>
                </div>
            </div>
        </div>
    );
};
