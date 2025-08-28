
import React from 'react';

interface ExecutionLogProps {
  logs: string[];
  id: string;
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ logs, id }) => {
  return (
    <div id={id} className="mt-2 p-3 bg-gray-900/70 rounded-lg border border-gray-600">
      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
        <code>
          {logs.join('\n')}
        </code>
      </pre>
    </div>
  );
};
