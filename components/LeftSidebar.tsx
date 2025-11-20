import React, { useState, useEffect } from 'react';
import type { AppwriteProject } from '../types';
import type { NewAppwriteProject } from '../services/projectService';
import { AddIcon, DeleteIcon, CloseIcon, ToolsIcon, ProjectsIcon, ChevronDownIcon, ChevronUpIcon, KeyIcon, CheckIcon, SettingsIcon } from './Icons';
import { toolDefinitionGroups } from '../tools';

// Sub-component for a single tool toggle switch
const ToolToggle: React.FC<{
    label: string;
    isChecked: boolean;
    onChange: (isChecked: boolean) => void;
}> = ({ label, isChecked, onChange }) => {
    const id = `toggle-${label}`;
    return (
        <label htmlFor={id} className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-white/5 transition-colors group">
            <span className="text-sm text-gray-300 capitalize group-hover:text-gray-100 transition-colors">{label}</span>
            <div className="relative">
                <input id={id} type="checkbox" className="sr-only peer" checked={isChecked} onChange={(e) => onChange(e.target.checked)} />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white"></div>
            </div>
        </label>
    );
};

// Sub-component for a collapsible section
interface CollapsibleSectionProps {
    title: React.ReactNode;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badge?: React.ReactNode;
    className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, isExpanded, onToggle, children, badge, className = '' }) => (
    <div className={`border-b border-gray-800 last:border-b-0 ${className}`}>
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-800/50 transition-colors focus:outline-none"
            aria-expanded={isExpanded}
        >
            <div className="flex items-center gap-3 text-gray-300">
                <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">{icon}</span>
                <h3 className="text-sm font-semibold">{title}</h3>
                {badge}
            </div>
            <div className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDownIcon size={16} />
            </div>
        </button>
        <div
            className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
            <div className="overflow-hidden">
                <div className="pb-4 px-3">
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
  onDelete: (projectId: string, projectName: string) => void;
  onSelect: (project: AppwriteProject) => void;
  activeTools: { [key: string]: boolean };
  onToolsChange: (tools: { [key: string]: boolean }) => void;
  geminiApiKey: string | null;
  geminiModel: string;
  geminiModels: string[];
  geminiThinkingEnabled: boolean;
  onSaveGeminiSettings: (settings: { apiKey: string, model: string, thinkingEnabled: boolean }) => Promise<void>;
  width: number;
  isResizing: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
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
  geminiApiKey,
  geminiModel,
  geminiModels,
  geminiThinkingEnabled,
  onSaveGeminiSettings,
  width,
  isResizing,
  onResizeStart
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

  const [expandedToolCategories, setExpandedToolCategories] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
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
    setName('');
    setEndpoint('');
    setProjectId('');
    setApiKey('');
    setExpandedSections(prev => ({ ...prev, addProject: false, projects: true }));
  };

  const handleToolChange = (toolName: string, isChecked: boolean) => {
    onToolsChange({ ...activeTools, [toolName]: isChecked });
  };

  const handleCategoryToolsChange = (categoryTools: string[], isChecked: boolean) => {
    const newActiveTools = { ...activeTools };
    categoryTools.forEach(toolName => {
        newActiveTools[toolName] = isChecked;
    });
    onToolsChange(newActiveTools);
  };
    
  const toggleToolCategory = (category: string) => {
    setExpandedToolCategories(prev => ({ ...prev, [category]: !prev[category] }));
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

  const getIndicatorInfo = (checked: number, total: number) => {
    if (checked === 0) return { className: 'bg-gray-600', title: 'None' };
    if (checked === total && total > 0) return { className: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]', title: 'All' };
    return { className: 'bg-yellow-500', title: 'Partial' };
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/80 z-20 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        style={{
          width: `${width}px`,
          borderRightWidth: width === 0 ? '0px' : undefined
        }}
        className={`
          bg-gray-900/95 backdrop-blur-md flex flex-col border-r border-white/5
          transition-transform md:transition-width duration-300 ease-in-out flex-shrink-0
          fixed md:relative inset-y-0 left-0 z-30 md:z-auto
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:transform-none
          ${isResizing ? 'transition-none select-none' : ''}
        `}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header within sidebar for mobile or branding */}
            <div className="p-4 md:hidden border-b border-gray-800 flex justify-between items-center">
                <span className="font-bold text-gray-100">Menu</span>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
            </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <CollapsibleSection
              title="Projects"
              icon={<ProjectsIcon />}
              isExpanded={expandedSections.projects}
              onToggle={() => toggleSection('projects')}
              badge={
                projects.length > 0 && <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-700">{projects.length}</span>
              }
            >
              <ul className="space-y-1">
                {projects.length === 0 && (
                   <div className="text-center p-6 text-sm text-gray-500 border border-dashed border-gray-800 rounded-lg">
                        No projects found.
                   </div>
                )}
                {projects.map(p => (
                  <li
                    key={p.$id}
                    onClick={() => onSelect(p)}
                    className={`group flex items-center justify-between gap-2 p-3 rounded-lg transition-all cursor-pointer border border-transparent ${
                      activeProject?.$id === p.$id
                        ? 'bg-cyan-950/30 border-cyan-500/30 shadow-[0_0_15px_rgba(8,145,178,0.1)]'
                        : 'hover:bg-gray-800/50 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-colors ${activeProject?.$id === p.$id ? 'text-cyan-400' : 'text-gray-300 group-hover:text-gray-100'}`}>{p.name}</p>
                      <p className="text-xs text-gray-500 truncate font-mono">{p.projectId}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(p.$id, p.name); }}
                      className="text-gray-600 hover:text-red-400 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-800"
                      aria-label={`Delete ${p.name}`}
                    >
                      <DeleteIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>

            <CollapsibleSection
              title="Tools"
              icon={<ToolsIcon />}
              isExpanded={expandedSections.tools}
              onToggle={() => toggleSection('tools')}
            >
              <div className="space-y-3">
                <div className="bg-gray-800/30 rounded-lg border border-gray-800">
                    <ToolToggle
                        label="Web Search"
                        isChecked={activeTools['search'] ?? false}
                        onChange={(isChecked) => handleToolChange('search', isChecked)}
                    />
                </div>

                {Object.entries(toolDefinitionGroups).map(([category, tools]) => {
                    const categoryToolNames = tools.map(t => t.name);
                    const checkedCount = categoryToolNames.filter(tool => activeTools[tool]).length;
                    const totalCount = categoryToolNames.length;
                    const isExpanded = expandedToolCategories[category] ?? false;
                    const indicator = getIndicatorInfo(checkedCount, totalCount);

                    return (
                        <div key={category} className="bg-gray-800/30 rounded-lg border border-gray-800 overflow-hidden">
                            <div className="group px-3 py-2 cursor-pointer hover:bg-gray-800/50 transition-colors" onClick={() => toggleToolCategory(category)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${indicator.className}`} />
                                        <span className="text-sm font-medium capitalize text-gray-300">{category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500 font-mono">{checkedCount}/{totalCount}</span>
                                        <div className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDownIcon size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity h-0 group-hover:h-auto">
                                     <button onClick={(e) => {e.stopPropagation(); handleCategoryToolsChange(categoryToolNames, true);}} className="text-[10px] uppercase font-bold text-cyan-500 hover:text-cyan-400">All</button>
                                     <button onClick={(e) => {e.stopPropagation(); handleCategoryToolsChange(categoryToolNames, false);}} className="text-[10px] uppercase font-bold text-gray-500 hover:text-gray-400">None</button>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="border-t border-gray-800 p-1 bg-gray-900/20">
                                    {tools.map(tool => (
                                        <ToolToggle
                                            key={tool.name}
                                            label={tool.name}
                                            isChecked={activeTools[tool.name] ?? false}
                                            onChange={(isChecked) => handleToolChange(tool.name, isChecked)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Settings"
                icon={<SettingsIcon />}
                isExpanded={expandedSections.gemini}
                onToggle={() => toggleSection('gemini')}
            >
                <form onSubmit={handleSaveGeminiSettings} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="gemini-model-select" className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">Model</label>
                      <div className="relative">
                          <select
                            id="gemini-model-select"
                            value={modelInput}
                            onChange={e => setModelInput(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 appearance-none"
                          >
                            {geminiModels.map(model => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                              <ChevronDownIcon size={16} />
                          </div>
                      </div>
                    </div>

                    {modelInput === 'gemini-2.5-flash' && (
                        <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700/50">
                            <ToolToggle
                                label="Deep Thinking"
                                isChecked={thinkingInput}
                                onChange={setThinkingInput}
                            />
                        </div>
                    )}

                    <div>
                      <label htmlFor="gemini-api-key-input" className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">Custom API Key</label>
                      <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500"><KeyIcon /></span>
                          <input 
                              id="gemini-api-key-input"
                              type="password" 
                              value={apiKeyInput} 
                              onChange={e => setApiKeyInput(e.target.value)} 
                              placeholder="Override default key" 
                              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 p-2.5 placeholder-gray-600" 
                          />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <button 
                            type="button" 
                            onClick={handleResetGeminiSettings}
                            disabled={!hasGeminiSettingsChanged}
                            className="flex-1 py-2 px-3 text-sm font-medium text-gray-400 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                        >
                            Reset
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2 px-3 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:shadow-none"
                            disabled={!hasGeminiSettingsChanged}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </CollapsibleSection>
          </div>

          <div className="p-4 border-t border-gray-800 bg-gray-900/50">
             <CollapsibleSection
                title="Add Project"
                icon={<AddIcon />}
                isExpanded={expandedSections.addProject}
                onToggle={() => toggleSection('addProject')}
                className="border-none"
            >
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Project Name" className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 placeholder-gray-500" required />
                    <input type="url" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="Endpoint (https://...)" className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 placeholder-gray-500" required />
                    <input type="text" value={projectId} onChange={e => setProjectId(e.target.value)} placeholder="Project ID" className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 placeholder-gray-500 font-mono" required />
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 placeholder-gray-500 font-mono" required />
                    <button type="submit" className="w-full mt-2 py-2.5 px-3 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-cyan-900/20">
                        <AddIcon />
                        Create Project
                    </button>
                </form>
            </CollapsibleSection>
          </div>
        </div>
        
        {/* Resizer */}
        {isOpen && (
            <div
                onMouseDown={onResizeStart}
                className={`
                    hidden md:block absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors z-50
                    ${isResizing ? 'bg-cyan-500' : 'bg-transparent'}
                `}
            />
        )}
      </aside>
    </>
  );
};