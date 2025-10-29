
import React from 'react';
import { Modal } from './Modal';
import { WarningIcon } from './Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50">
                    <WarningIcon />
                </div>
                <div className="flex-1 pt-1">
                    <p className="text-gray-300">{message}</p>
                </div>
            </div>
            <footer className="mt-6 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    type="button"
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold text-sm text-gray-200 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    type="button"
                    className={`px-4 py-2 rounded-md font-semibold text-sm text-white transition-colors ${confirmButtonClass}`}
                >
                    {confirmText}
                </button>
            </footer>
        </Modal>
    );
};
