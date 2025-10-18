import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { UserIcon, BotIcon, AttachmentIcon, SourcesIcon } from './Icons';
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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect runs after render to add copy buttons to code blocks
    if (contentRef.current && message.role === 'model') {
      const preElements = contentRef.current.querySelectorAll('pre');

      preElements.forEach(preEl => {
        if (preEl.parentElement?.classList.contains('code-block-wrapper')) {
          return; // Already processed
        }

        const codeEl = preEl.querySelector('code');
        if (!codeEl) {
          return;
        }

        // Create a wrapper for relative positioning and hover detection
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper relative group';
        preEl.parentNode?.insertBefore(wrapper, preEl);
        wrapper.appendChild(preEl);

        const button = document.createElement('button');
        button.className = 'absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md text-xs font-semibold transition-all z-10 opacity-0 group-hover:opacity-100 focus:opacity-100';
        button.ariaLabel = 'Copy code';

        const copyIconSvg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
        const copyTextSpan = document.createElement('span');
        copyTextSpan.textContent = 'Copy';

        button.innerHTML = copyIconSvg;
        button.appendChild(copyTextSpan);

        button.onclick = () => {
          navigator.clipboard.writeText(codeEl.innerText).then(() => {
            const checkIconSvg = `<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            copyTextSpan.textContent = 'Copied!';
            button.innerHTML = checkIconSvg;
            button.appendChild(copyTextSpan);

            setTimeout(() => {
              copyTextSpan.textContent = 'Copy';
              button.innerHTML = copyIconSvg;
              button.appendChild(copyTextSpan);
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy code: ', err);
            copyTextSpan.textContent = 'Failed';
            setTimeout(() => {
              copyTextSpan.textContent = 'Copy';
              button.innerHTML = copyIconSvg;
              button.appendChild(copyTextSpan);
            }, 2000);
          });
        };

        wrapper.appendChild(button);
      });
    }
  }, [message.content, message.role, message.id]);

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
                    ref={contentRef}
                    className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2"
                    dangerouslySetInnerHTML={{ __html: marked.parse(message.content) as string }} 
                />
            )
        )}

        {message.role === 'user' && !message.content && message.files && message.files.length > 0 && <p className="italic text-blue-200">{message.files.length} file(s) attached.</p>}

        {message.role === 'model' && message.groundingChunks && message.groundingChunks.filter(c => c.web).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
                <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                    <SourcesIcon />
                    Sources
                </h4>
                <ul className="space-y-1.5 text-xs">
                    {message.groundingChunks.filter(c => c.web).map((chunk, index) => (
                        <li key={index}>
                            <a
                                href={chunk.web!.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group"
                                title={chunk.web!.uri}
                            >
                                <div className="flex-shrink-0 w-4 h-4 rounded-sm border border-gray-500/50 group-hover:border-cyan-400/50 flex items-center justify-center text-gray-500 group-hover:text-cyan-400 transition-colors">
                                    <span className="text-[10px] font-bold">{index + 1}</span>
                                </div>
                                <span className="truncate group-hover:underline">
                                    {chunk.web!.title || new URL(chunk.web!.uri).hostname}
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};