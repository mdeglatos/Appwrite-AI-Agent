
import React from 'react';
import { IoSend, IoAttach } from 'react-icons/io5';
import { CgSpinner } from 'react-icons/cg';
import { FaUser } from 'react-icons/fa';
import { RiRobot2Line, RiSettings3Line, RiAddCircleLine, RiDeleteBinLine, RiCheckLine, RiCloseLine, RiTerminalBoxLine, RiMenuLine, RiToolsLine, RiLogoutBoxRLine, RiArrowDownSLine, RiArrowUpSLine, RiStackLine, RiFileUploadFill, RiFile3Line, RiKey2Line, RiRefreshLine, RiFileCopyLine, RiCodeSSlashLine, RiCompass3Line, RiErrorWarningLine, RiFolderLine, RiFileAddLine, RiFolderAddLine, RiPencilLine } from 'react-icons/ri';

export const SendIcon: React.FC = () => <IoSend size={20} />;
export const AttachmentIcon: React.FC<{ size?: number }> = ({ size = 20 }) => <IoAttach size={size} />;

export const LoadingSpinnerIcon: React.FC = () => (
  <CgSpinner size={24} className="animate-spin" />
);

export const UserIcon: React.FC = () => <FaUser size={20} />;

export const BotIcon: React.FC = () => <RiRobot2Line size={20} />;

export const SettingsIcon: React.FC = () => <RiSettings3Line size={20} />;
export const AddIcon: React.FC = () => <RiAddCircleLine size={22} />;
export const DeleteIcon: React.FC = () => <RiDeleteBinLine size={18} />;
export const CheckIcon: React.FC = () => <RiCheckLine size={18} />;
export const CloseIcon: React.FC<{ size?: number }> = ({ size = 24 }) => <RiCloseLine size={size} />;
export const TerminalIcon: React.FC = () => <RiTerminalBoxLine size={20} />;
export const MenuIcon: React.FC = () => <RiMenuLine size={24} />;
export const ToolsIcon: React.FC = () => <RiToolsLine size={20} />;
export const LogoutIcon: React.FC = () => <RiLogoutBoxRLine size={20} />;

export const ChevronDownIcon: React.FC<{ size?: number }> = ({ size = 20 }) => <RiArrowDownSLine size={size} />;
export const ChevronUpIcon: React.FC<{ size?: number }> = ({ size = 20 }) => <RiArrowUpSLine size={size} />;
export const ProjectsIcon: React.FC = () => <RiStackLine size={20} />;

export const FileUploadIcon: React.FC = () => <RiFileUploadFill size={48} />;
export const FileIcon: React.FC<{ size?: number }> = ({ size = 32 }) => <RiFile3Line size={size} />;
export const KeyIcon: React.FC = () => <RiKey2Line size={20} />;

export const RefreshIcon: React.FC<{ size?: number }> = ({ size = 18 }) => <RiRefreshLine size={size} />;
export const CopyIcon: React.FC<{ size?: number }> = ({ size = 16 }) => <RiFileCopyLine size={size} />;
export const CodeIcon: React.FC = () => <RiCodeSSlashLine size={20} />;
export const SourcesIcon: React.FC = () => <RiCompass3Line size={16} />;
export const WarningIcon: React.FC = () => <RiErrorWarningLine size={24} className="text-red-400" />;

// New Icons for Code Viewer
export const FolderIcon: React.FC<{ size?: number }> = ({ size = 16 }) => <RiFolderLine size={size} />;
export const FileAddIcon: React.FC<{ size?: number }> = ({ size = 18 }) => <RiFileAddLine size={size} />;
export const FolderAddIcon: React.FC<{ size?: number }> = ({ size = 18 }) => <RiFolderAddLine size={size} />;
export const EditIcon: React.FC<{ size?: number }> = ({ size = 14 }) => <RiPencilLine size={size} />;
