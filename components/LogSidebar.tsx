
import React, { useRef, useEffect } from 'react';
import { CloseIcon, DeleteIcon, TerminalIcon } from './Icons';

interface LogSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  onClear: () => void;
}

export const LogSidebar: React.FC<LogSidebarProps> = ({ isOpen, onClose, logs, onClear }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop for the log sidebar */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`
          fixed top-6 bottom-6 right-6 z-40
          bg-gray-800/90 backdrop-blur-sm text-gray-300 flex flex-col border border-gray-700
          transition-transform duration-300 ease-in-out
          w-full max-w-lg sm:w-96 rounded-2xl
          transform ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'}
        `}
        aria-labelledby="log-sidebar-title"
        role="log"
      >
        <div className="flex flex-col h-full">
          <header className="p-4 border-b border-gray-700 shadow-md bg-gray-900/50 flex justify-between items-center flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <TerminalIcon />
              <h2 id="log-sidebar-title" className="text-lg font-bold text-cyan-300">
                Execution Logs
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClear}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-700 hover:bg-red-800 rounded-md text-red-300 hover:text-red-200"
                aria-label="Clear logs"
              >
                <DeleteIcon />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-600" aria-label="Close logs sidebar">
                <CloseIcon />
              </button>
            </div>
          </header>
          <div ref={logContainerRef} className="flex-1 overflow-y-auto p-2">
            <div className="text-xs font-mono whitespace-pre-wrap break-all p-2">
              {logs.length > 0 ? (
                logs.map((log, index) => {
                  let className = "text-gray-300";
                  
                  // More specific colors for better readability
                  if (log.includes('--- USER:')) className = "text-blue-300 font-semibold pt-3";
                  else if (log.includes('ERROR:')) className = "text-red-400 font-semibold";
                  else if (log.includes('Sending to AI:')) className = "text-fuchsia-400";
                  else if (log.includes('AI intermediate response:')) className = "text-green-300";
                  else if (log.includes('Model wants to call tools:')) className = "text-cyan-300 font-semibold";
                  else if (log.includes('Executing tool:')) className = "text-yellow-300";
                  else if (log.includes('Tool execution result for')) className = "text-indigo-300";
                  else if (log.includes('Sending tool results to AI:')) className = "text-fuchsia-400 pt-2";
                  else if (log.includes('Project context updated') || log.includes('AI session ready')) className = "text-cyan-400";
                  
                  return (
                    <code key={index} className={`block ${className}`}>
                      {log}
                    </code>
                  );
                })
              ) : (
                <code className="text-gray-500">Logs will appear here as the agent works...</code>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
