
import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Delay focus slightly to ensure the modal is fully rendered and transitions are complete
            setTimeout(() => modalRef.current?.focus(), 100);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose} // Close on backdrop click
        >
            <div
                ref={modalRef}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 border border-gray-700 animate-[slideInUp_0.3s_ease-out]"
                tabIndex={-1} // Make it focusable
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
                style={{ outline: 'none' }}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-600"
                        aria-label="Close dialog"
                    >
                        <CloseIcon />
                    </button>
                </header>
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
