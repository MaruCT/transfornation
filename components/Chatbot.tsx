import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChatIcon, XIcon, BotIcon, MaximizeIcon, MinimizeIcon } from './Icons';
import type { ChatMessage, Project } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatbotProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    onSelectProject: (project: Project) => void;
}

const formatMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const ChatProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    return (
        <div onClick={onClick} className="mt-2 -mx-2 rounded-lg overflow-hidden cursor-pointer group bg-black/20 hover:bg-black/30 transition-colors">
            <div className="flex items-center space-x-3 p-2">
                <img src={project.imageUrl} alt={project.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                <div className="overflow-hidden">
                    <p className="font-bold text-white text-sm truncate">{project.title}</p>
                    <p className="text-xs text-gray-400 truncate group-hover:text-[#0057FF] transition-colors">View Project →</p>
                </div>
            </div>
        </div>
    );
};

const DetailedChatProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    const progressPercentage = Math.min((project.pledged / project.goal) * 100, 100);
    return (
        <div onClick={onClick} className="mt-2 rounded-lg overflow-hidden cursor-pointer group bg-black/20 hover:bg-black/30 transition-colors border border-white/10">
            <img src={project.imageUrl} alt={project.title} className="w-full h-32 object-cover" />
            <div className="p-3">
                <p className="font-bold text-white text-base truncate">{project.title}</p>
                <p className="text-sm text-gray-400 mt-1 truncate">{project.tagline}</p>
                 <div className="mt-3">
                    <div className="w-full bg-black/30 rounded-full h-1">
                        <div className="bg-gradient-to-r from-[#0057FF] to-[#004AD8] h-1 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>{formatCurrency(project.pledged)}</span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Chatbot: React.FC<ChatbotProps> = ({ messages, onSendMessage, isLoading, onSelectProject }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (!isOpen) {
            setIsFullScreen(false);
        }
    }, [isOpen]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleProjectClick = (project: Project) => {
        onSelectProject(project);
        setIsOpen(false);
    };
    
    const fabVariants: Variants = {
        hidden: { scale: 0, y: 50 },
        visible: { scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20, delay: 1 } },
    };

    const chatWindowVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    };

    return (
        <>
            <motion.button
                variants={fabVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-[#0057FF] to-[#004AD8] shadow-lg shadow-[#0057FF]/40 flex items-center justify-center text-white"
                aria-label="Open AI Assistant"
            >
                <ChatIcon className="h-8 w-8" />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={chatWindowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={`fixed z-50 flex flex-col rounded-2xl overflow-hidden border border-white/20 shadow-2xl ${isFullScreen ? 'inset-4' : 'bottom-24 right-6 w-full max-w-sm h-[70vh] max-h-[600px]'}`}
                         style={{background: 'rgba(0, 22, 65, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'}}
                    >
                        {/* Header */}
                        <header className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                <BotIcon className="h-6 w-6 text-[#0057FF]" />
                                <h3 className="font-bold text-white text-glow">{t('chatbot.title')}</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="text-gray-400 hover:text-white">
                                    {isFullScreen ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                                    <XIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-xl px-4 py-2 ${msg.role === 'user' ? 'bg-[#0057FF] text-white' : 'bg-[#001641]/80 text-gray-200'}`}>
                                       <div className="text-sm whitespace-pre-wrap">
                                        {formatMessageText(msg.text)}
                                        {msg.role === 'model' && isLoading && msg.text.length === 0 && <span className="animate-pulse">...</span>}
                                       </div>
                                       {msg.project && (
                                            isFullScreen ? 
                                            <DetailedChatProjectCard project={msg.project} onClick={() => handleProjectClick(msg.project!)} />
                                            : <ChatProjectCard project={msg.project} onClick={() => handleProjectClick(msg.project!)} />
                                       )}
                                    </div>
                                </div>
                            ))}
                             <div ref={messagesEndRef} />
                        </div>
                        
                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20 flex-shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('chatbot.placeholder')}
                                    className="w-full bg-[#001641]/50 border border-white/20 rounded-full py-2 pl-4 pr-12 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0057FF] focus:outline-none"
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#0057FF] rounded-full flex items-center justify-center text-white disabled:opacity-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;