
import React, { useState } from 'react';
import type { ActionMessage } from '../types';
import { LoadingSpinnerIcon, ToolsIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

const JsonViewer = ({ data, error = false }: { data: any, error?: boolean }) => {
    let content;
    try {
        content = JSON.stringify(data, null, 2);
    } catch (e) {
        content = String(data);
    }

    return (
        <pre className={`text-xs p-2 rounded-md overflow-x-auto ${error ? 'bg-red-900/40 text-red-200' : 'bg-gray-900/70 text-gray-300'}`}>
            <code>{content}</code>
        </pre>
    );
};

export const ActionMessageComponent: React.FC<{ message: ActionMessage }> = ({ message }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { toolCalls, toolResults, isLoading } = message;
    
    const singleToolName = toolCalls.length === 1 ? toolCalls[0].name : null;
    const title = singleToolName ? `Action: ${singleToolName}` : `Action: ${toolCalls.length} tool calls`;

    return (
        <div className="flex justify-center my-4">
            <div className="w-full max-w-xl md:max-w-2xl bg-gray-700/50 border border-gray-600 rounded-lg">
                <button 
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700/70 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    aria-controls={`action-details-${message.id}`}
                >
                    <div className="flex items-center gap-3">
                        {isLoading ? <LoadingSpinnerIcon /> : <ToolsIcon />}
                        <span className="font-semibold text-cyan-300">{title}</span>
                        {isLoading && <span className="text-sm text-gray-400">Executing...</span>}
                        {!isLoading && <span className="text-sm text-gray-400">Completed</span>}
                    </div>
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                
                {isExpanded && (
                    <div id={`action-details-${message.id}`} className="px-3 pb-3 space-y-4 border-t border-gray-600 pt-3">
                        {toolCalls.map((call, index) => {
                            const result = !isLoading && toolResults ? toolResults[index]?.functionResponse?.response : null;
                            const hasError = result && typeof result === 'object' && result !== null && 'error' in result;

                            return (
                                <div key={index} className="p-2 bg-gray-800/50 rounded-md">
                                    <h4 className="font-bold text-sm text-gray-200 mb-1">Call: <span className="font-mono bg-gray-900/50 px-1 py-0.5 rounded">{call.name}</span></h4>
                                    
                                    <p className="text-xs text-gray-400 mb-1 font-semibold">Arguments:</p>
                                    <JsonViewer data={call.args} />

                                    {!isLoading && result !== null && (
                                        <>
                                            <p className="text-xs text-gray-400 mt-2 mb-1 font-semibold">Result:</p>
                                            <JsonViewer data={result} error={hasError} />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
