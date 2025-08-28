import React, { useState, useEffect } from 'react';
import type { AppwriteProject } from '../types';
import type { NewAppwriteProject } from '../services/projectService';
import { AddIcon, DeleteIcon, CloseIcon, ToolsIcon, ProjectsIcon, ChevronDownIcon, ChevronUpIcon, KeyIcon, CheckIcon, SettingsIcon } from './Icons';

// Sub-component for a single tool toggle switch
const ToolToggle: React.FC<{
    label: string;
    isChecked: boolean;
    onChange: (isChecked: boolean) => void;
}> = ({ label, isChecked, onChange }) => {
    const id = `toggle-${label}`;
    return (
        <label htmlFor={id} className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-700/60 transition-colors">
            <span className="text-gray-200 capitalize">{label}</span>
            <div className="relative">
                <input id={id} type="checkbox" className="sr-only peer" checked={isChecked} onChange={(e) => onChange(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </div>
        </label>
    );
};

// Sub-component for a collapsible section, enhancing UI organization
interface CollapsibleSectionProps {
    title: React.ReactNode;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badge?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, isExpanded, onToggle, children, badge }) => (
    <div className="border-b border-gray-700/50 last:border-b-0">
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-700/50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-expanded={isExpanded}
        >
            <div className="flex items-center gap-3">
                <span className="text-cyan-400">{icon}</span>
                <h3 className="font-semibold text-gray-200">{title}</h3>
                {badge}
            </div>
            {isExpanded ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
        </button>
        <div
            className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
            <div className="overflow-hidden">
                <div className="pt-1 pb-3 px-1">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: AppwriteProject[];
  activeProject: AppwriteProject | null;
  onSave: (projectData: NewAppwriteProject) => void;
  onDelete: (projectId: string) => void;
  onSelect: (project: AppwriteProject) => void;
  activeTools: { [key: string]: boolean };
  onToolsChange: (tools: { [key: string]: boolean }) => void;
  toolCategories: string[];
  geminiApiKey: string | null;
  geminiModel: string;
  geminiModels: string[];
  geminiThinkingEnabled: boolean;
  onSaveGeminiSettings: (settings: { apiKey: string, model: string, thinkingEnabled: boolean }) => Promise<void>;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onClose,
  projects,
  activeProject,
  onSave,
  onDelete,
  onSelect,
  activeTools,
  onToolsChange,
  toolCategories,
  geminiApiKey,
  geminiModel,
  geminiModels,
  geminiThinkingEnabled,
  onSaveGeminiSettings
}) => {
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [projectId, setProjectId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [thinkingInput, setThinkingInput] = useState(true);
  
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    tools: true,
    gemini: false,
    addProject: false,
  });

  useEffect(() => {
    // Populate settings form when props change
    setApiKeyInput(geminiApiKey || '');
    setModelInput(geminiModel || '');
    setThinkingInput(geminiThinkingEnabled);
  }, [geminiApiKey, geminiModel, geminiThinkingEnabled]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !endpoint || !projectId || !apiKey) return;
    const projectData: NewAppwriteProject = {
      name,
      endpoint,
      projectId,
      apiKey,
    };
    onSave(projectData);
    // Reset form and collapse the section
    setName('');
    setEndpoint('');
    setProjectId('');
    setApiKey('');
    setExpandedSections(prev => ({ ...prev, addProject: false, projects: true }));
  };

  const handleToolChange = (tool: string, isChecked: boolean) => {
    onToolsChange({ ...activeTools, [tool]: isChecked });
  };
  
  const hasGeminiSettingsChanged = (apiKeyInput.trim() !== (geminiApiKey || '')) || (modelInput !== geminiModel) || (thinkingInput !== geminiThinkingEnabled);
  
  const handleSaveGeminiSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasGeminiSettingsChanged) return;
      await onSaveGeminiSettings({ apiKey: apiKeyInput, model: modelInput, thinkingEnabled: thinkingInput });
      setExpandedSections(prev => ({ ...prev, gemini: false }));
  };

  const handleResetGeminiSettings = () => {
    setApiKeyInput(geminiApiKey || '');
    setModelInput(geminiModel || '');
    setThinkingInput(geminiThinkingEnabled);
  };

  return (
    <>
      {/* Mobile-only backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-20 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`
          bg-gray-800/90 backdrop-blur-sm text-gray-300 flex flex-col border-r border-gray-700
          transition-transform md:transition-all duration-300 ease-in-out flex-shrink-0
          
          fixed md:relative 
          inset-y-0 left-0 z-30 md:z-auto
          w-full max-w-xs sm:w-80 md:w-auto
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:transform-none
          
          ${isOpen ? 'md:w-80' : 'md:w-0'}
          ${!isOpen && 'md:border-r-0'}
          overflow-hidden
        `}
      >
        <div className="flex flex-col h-full w-full max-w-xs sm:w-80 md:w-80">
          <header className="p-4 border-b border-gray-700 shadow-md bg-gray-900/50 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-cyan-300">Agent Controls</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-600 md:hidden" aria-label="Close sidebar">
              <CloseIcon />
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <CollapsibleSection
              title="Your Projects"
              icon={<ProjectsIcon />}
              isExpanded={expandedSections.projects}
              onToggle={() => toggleSection('projects')}
              badge={
                <span className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              }
            >
              <ul className="space-y-1.5">
                {projects.length === 0 && (
                   <div className="text-center p-4 my-1 text-sm text-gray-400 bg-gray-700/30 rounded-lg">
                        <p>No projects found.</p>
                        <p className="text-xs mt-1">Expand "Add New Project" to get started.</p>
                   </div>
                )}
                {projects.map(p => (
                  <li
                    key={p.$id}
                    onClick={() => onSelect(p)}
                    className={`group flex items-center justify-between gap-2 p-2.5 rounded-lg transition-all cursor-pointer border ${
                      activeProject?.$id === p.$id
                        ? 'bg-cyan-600/20 border-cyan-500/40'
                        : 'border-transparent hover:bg-gray-700/60'
                    }`}
                  >
                    <div className="flex-1 overflow-hidden">
                      <p className={`font-semibold truncate ${activeProject?.$id === p.$id ? 'text-cyan-300' : 'text-gray-100'}`}>{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.projectId}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); if(confirm(`Are you sure you want to delete "${p.name}"?`)) onDelete(p.$id); }}
                      className="text-gray-500 hover:text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 flex-shrink-0"
                      aria-label={`Delete ${p.name}`}
                    >
                      <DeleteIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>

            <CollapsibleSection
              title="Agent Tools"
              icon={<ToolsIcon />}
              isExpanded={expandedSections.tools}
              onToggle={() => toggleSection('tools')}
            >
              <div className="space-y-1">
                {toolCategories.map(tool => (
                  <ToolToggle
                    key={tool}
                    label={tool}
                    isChecked={activeTools[tool] ?? false}
                    onChange={(isChecked) => handleToolChange(tool, isChecked)}
                  />
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
                title={
                    <span className="flex items-center gap-1.5">
                        Gemini Settings
                        {hasGeminiSettingsChanged && <span className="text-cyan-400" aria-label="Unsaved changes" title="Unsaved changes">*</span>}
                    </span>
                }
                icon={<SettingsIcon />}
                isExpanded={expandedSections.gemini}
                onToggle={() => toggleSection('gemini')}
            >
                <form onSubmit={handleSaveGeminiSettings} className="flex flex-col gap-4 p-2">
                    <p className="text-xs text-gray-400 px-1 -mb-2">Select your model and optionally provide a custom Gemini key.</p>
                    
                    <div>
                      <label htmlFor="gemini-model-select" className="text-sm font-medium text-gray-300 mb-1.5 block px-1">Model</label>
                      <select
                        id="gemini-model-select"
                        value={modelInput}
                        onChange={e => setModelInput(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      >
                        {geminiModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>

                    {modelInput === 'gemini-2.5-flash' && (
                        <div>
                            <ToolToggle
                                label="Enable Thinking"
                                isChecked={thinkingInput}
                                onChange={setThinkingInput}
                            />
                            <p className="text-xs text-gray-400 px-2 mt-1">Disabling improves latency but may reduce response quality. Only for `gemini-2.5-flash`.</p>
                        </div>
                    )}

                    <div>
                      <label htmlFor="gemini-api-key-input" className="text-sm font-medium text-gray-300 mb-1.5 block px-1">API Key (Optional)</label>
                      <input 
                          id="gemini-api-key-input"
                          type="password" 
                          value={apiKeyInput} 
                          onChange={e => setApiKeyInput(e.target.value)} 
                          placeholder="Overrides app's default key" 
                          className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" 
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                        <button 
                            type="button" 
                            onClick={handleResetGeminiSettings}
                            disabled={!hasGeminiSettingsChanged}
                            className="flex-1 flex justify-center items-center gap-2 p-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold text-sm text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Reset Gemini settings changes"
                        >
                            <CloseIcon size={18} />
                            Reset
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 flex justify-center items-center gap-2 p-2 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                            disabled={!hasGeminiSettingsChanged}
                            aria-label="Save Gemini settings"
                        >
                            <CheckIcon />
                            Save
                        </button>
                    </div>
                </form>
            </CollapsibleSection>
          </div>

          <div className="p-2 border-t border-gray-700">
             <CollapsibleSection
                title="Add New Project"
                icon={<AddIcon />}
                isExpanded={expandedSections.addProject}
                onToggle={() => toggleSection('addProject')}
            >
                <form onSubmit={handleSave} className="flex flex-col gap-3 p-1">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Project Name" className="bg-gray-700 border border-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" required />
                    <input type="url" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="Appwrite Endpoint" className="bg-gray-700 border border-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" required />
                    <input type="text" value={projectId} onChange={e => setProjectId(e.target.value)} placeholder="Project ID" className="bg-gray-700 border border-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" required />
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" className="bg-gray-700 border border-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" required />
                    <button type="submit" className="flex justify-center items-center gap-2 mt-1 p-2 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-sm">
                        <AddIcon />
                        Save Project
                    </button>
                </form>
            </CollapsibleSection>
          </div>
        </div>
      </aside>
    </>
  );
};