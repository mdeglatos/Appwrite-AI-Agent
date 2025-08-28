
import React from 'react';
import type { Message } from '../types';
import { UserIcon, BotIcon, AttachmentIcon } from './Icons';
import { marked } from 'marked';
import { ActionMessageComponent } from './ActionMessage';

// Configure marked to handle code blocks and other elements nicely.
// It's good practice to set options at the top level.
// This ensures gfm (for tables, etc.) and line breaks are handled.
marked.setOptions({
  gfm: true, // Github Flavored Markdown
  breaks: true, // Add <br> on single line breaks
});

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  // If the message is a tool call, render the specific component for it.
  if (message.role === 'action') {
    return <ActionMessageComponent message={message} />;
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-cyan-600 rounded-full flex items-center justify-center">
          <BotIcon />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-xl max-w-xl md:max-w-2xl break-words ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        {message.role === 'user' && message.files && message.files.length > 0 && (
            <div className="mb-2 space-y-1">
                {message.files.map((file, index) => (
                    <div key={index} className="p-2 bg-blue-700/60 rounded-lg flex items-center gap-2 border border-blue-500/50">
                        <AttachmentIcon />
                        <span className="font-medium text-sm truncate">{file.name}</span>
                    </div>
                ))}
            </div>
        )}
        
        {message.content && (
            isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
                <div 
                    className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2"
                    dangerouslySetInnerHTML={{ __html: marked.parse(message.content) as string }} 
                />
            )
        )}

        {message.role === 'user' && !message.content && message.files && message.files.length > 0 && <p className="italic text-blue-200">{message.files.length} file(s) attached.</p>}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};
