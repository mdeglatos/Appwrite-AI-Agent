import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { UserIcon, BotIcon, AttachmentIcon, SourcesIcon } from './Icons';
import { marked } from 'marked';
import { ActionMessageComponent } from './ActionMessage';

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.role === 'action') {
    return <ActionMessageComponent message={message} />;
  }

  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && message.role === 'model') {
      const preElements = contentRef.current.querySelectorAll('pre');
      preElements.forEach(preEl => {
        if (preEl.parentElement?.classList.contains('code-block-wrapper')) return;

        const codeEl = preEl.querySelector('code');
        if (!codeEl) return;

        // Styled wrapper for code blocks
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper relative group rounded-lg overflow-hidden my-4 border border-gray-700/50 shadow-sm';
        preEl.parentNode?.insertBefore(wrapper, preEl);
        
        // Header for code block
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700/50 text-xs text-gray-400 select-none';
        const lang = codeEl.className.replace('language-', '') || 'code';
        header.textContent = lang;
        
        const button = document.createElement('button');
        button.className = 'flex items-center gap-1.5 px-2 py-0.5 hover:bg-gray-700/80 rounded text-gray-300 text-xs font-medium transition-colors';
        button.innerHTML = '<span>Copy</span>';
        
        button.onclick = () => {
          navigator.clipboard.writeText(codeEl.innerText).then(() => {
            button.innerHTML = '<span class="text-green-400">Copied!</span>';
            setTimeout(() => { button.innerHTML = '<span>Copy</span>'; }, 2000);
          });
        };

        header.appendChild(button);
        wrapper.appendChild(header);
        wrapper.appendChild(preEl);
        
        // Style the pre element to fit nicely
        preEl.className += " !m-0 !bg-gray-900/90 !p-4 overflow-x-auto text-sm font-mono";
      });
    }
  }, [message.content, message.role, message.id]);

  return (
    <div className={`flex gap-4 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-4xl mx-auto w-full`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10 ${
          isUser 
            ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white' 
            : 'bg-gray-800 border border-gray-700 text-cyan-400'
      }`}>
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Attachments (User) */}
        {isUser && message.files && message.files.length > 0 && (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
                {message.files.map((file, index) => (
                    <div key={index} className="px-3 py-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg flex items-center gap-2 text-xs text-gray-300 shadow-sm">
                        <AttachmentIcon size={14} />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                    </div>
                ))}
            </div>
        )}

        <div
          className={`px-5 py-4 rounded-2xl shadow-sm border backdrop-blur-sm ${
            isUser
              ? 'bg-cyan-600/10 border-cyan-500/20 text-gray-100 rounded-tr-none'
              : 'bg-gray-800/40 border-white/5 text-gray-200 rounded-tl-none'
          }`}
        >
            {message.content ? (
                isUser ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                ) : (
                    <div 
                        ref={contentRef}
                        className="prose prose-invert prose-sm max-w-none 
                        prose-p:leading-relaxed prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                        prose-headings:text-gray-100 prose-headings:font-semibold
                        prose-ul:my-2 prose-li:my-0.5
                        prose-strong:text-cyan-300"
                        dangerouslySetInnerHTML={{ __html: marked.parse(message.content) as string }} 
                    />
                )
            ) : (
               isUser && <p className="italic text-gray-400 text-sm">Sent {message.files?.length} file(s).</p>
            )}
        </div>

        {/* Sources (Model) */}
        {message.role === 'model' && message.groundingChunks && message.groundingChunks.filter(c => c.web).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
                 {message.groundingChunks.filter(c => c.web).map((chunk, index) => (
                    <a
                        key={index}
                        href={chunk.web!.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-full text-xs text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                    >
                        <SourcesIcon />
                        <span className="truncate max-w-[200px]">{chunk.web!.title}</span>
                    </a>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};