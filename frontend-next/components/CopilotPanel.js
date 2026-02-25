"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Send, X, Bot, User, Paperclip, Mic,
    ChevronDown, MessageSquare, ThumbsUp, ThumbsDown, SendHorizontal
} from 'lucide-react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Bot size={14} className="text-primary" />
            </div>
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-typing-dot" />
            </div>
        </div>
    );
}

function ChatMessage({ message }) {
    const isAI = message.role === 'assistant';
    const [feedback, setFeedback] = useState(null); // 'helpful' or 'needs_improvement'
    const [showCorrection, setShowCorrection] = useState(false);
    const [correction, setCorrection] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleFeedback = async (rating) => {
        setFeedback(rating);
        if (rating === 'helpful') {
            try {
                await api.request('/chat/feedback', {
                    method: 'POST',
                    body: JSON.stringify({
                        message_id: message.id,
                        rating: 'helpful'
                    })
                });
                setSubmitted(true);
            } catch (err) {
                console.error('Feedback error:', err);
            }
        } else {
            setShowCorrection(true);
        }
    };

    const submitCorrection = async () => {
        try {
            await api.request('/chat/feedback', {
                method: 'POST',
                body: JSON.stringify({
                    message_id: message.id,
                    rating: 'needs_improvement',
                    correction: correction
                })
            });
            setShowCorrection(false);
            setSubmitted(true);
        } catch (err) {
            console.error('Correction error:', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 px-4 py-2 ${isAI ? '' : 'flex-row-reverse'}`}
        >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isAI
                ? 'bg-primary/15 border border-primary/20'
                : 'bg-neon-blue/15 border border-neon-blue/20'
                }`}>
                {isAI ? <Bot size={14} className="text-primary" /> : <User size={13} className="text-neon-blue" />}
            </div>
            <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed markdown-content ${isAI
                    ? 'bg-white/[0.04] border-l-2 border-primary/40 text-slate-200 rounded-tl-none'
                    : 'bg-neon-blue/10 text-slate-200 rounded-tr-none'
                    }`}
            >
                {isAI ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </ReactMarkdown>
                ) : (
                    message.content
                )}
            </div>

            {isAI && message.id && !submitted && (
                <div className="flex flex-col gap-2 mt-1 self-start ml-9">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleFeedback('helpful')}
                            className={`p-1.5 rounded-lg border transition-all ${feedback === 'helpful' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-slate-500 hover:text-primary hover:border-primary/30'}`}
                            title="Helpful"
                        >
                            <ThumbsUp size={12} />
                        </button>
                        <button
                            onClick={() => handleFeedback('needs_improvement')}
                            className={`p-1.5 rounded-lg border transition-all ${feedback === 'needs_improvement' ? 'bg-neon-red/20 border-neon-red/40 text-neon-red' : 'bg-white/5 border-white/10 text-slate-500 hover:text-neon-red hover:border-neon-red/30'}`}
                            title="Needs Improvement"
                        >
                            <ThumbsDown size={12} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showCorrection && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-2 w-full max-w-[240px] mt-1"
                            >
                                <textarea
                                    value={correction}
                                    onChange={(e) => setCorrection(e.target.value)}
                                    placeholder="What should be corrected?"
                                    className="w-full bg-[#060E1F] border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-white focus:outline-none focus:border-primary/40 resize-none min-h-[60px]"
                                />
                                <button
                                    onClick={submitCorrection}
                                    disabled={!correction.trim()}
                                    className="flex items-center justify-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all disabled:opacity-30"
                                >
                                    <SendHorizontal size={10} />
                                    Submit Correction
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {submitted && isAI && (
                <span className="text-[9px] text-primary/60 font-medium ml-9 mt-1 italic italic-font">Feedback received. Thank you!</span>
            )}
        </motion.div>
    );
}

export default function CopilotPanel({ isOpen, onClose, messages = [], onSendMessage, isTyping = false }) {
    const [input, setInput] = useState('');
    const [panelWidth, setPanelWidth] = useState(400);
    const messagesEndRef = useRef(null);
    const isResizing = useRef(false);
    const panelRef = useRef(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Resize handler
    const handleMouseDown = useCallback((e) => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const newWidth = window.innerWidth - e.clientX;
            setPanelWidth(Math.max(360, Math.min(600, newWidth)));
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="fixed right-0 top-0 h-screen z-50 flex flex-col glass-panel-strong border-l border-white/5"
                    style={{ width: panelWidth }}
                >
                    {/* Resize Handle */}
                    <div className="resize-handle" onMouseDown={handleMouseDown} />

                    {/* Header */}
                    <div className="h-16 px-5 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#D4A017] flex items-center justify-center shadow-lg shadow-yellow-500/10">
                                    <Sparkles size={16} className="text-[#060E1F]" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-[#060E1F] animate-online-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-white font-titles">Sujay AI Analyst</h3>
                                <span className="text-[9px] text-neon-green font-semibold uppercase tracking-wider">Online</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-8 opacity-60">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                    <MessageSquare size={24} className="text-primary" />
                                </div>
                                <h4 className="text-sm font-bold text-white font-titles mb-2">Start a Conversation</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Ask about financial ratios, company health, risk analysis, or upload a document for AI insights.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <ChatMessage key={idx} message={msg} />
                            ))
                        )}
                        {isTyping && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Scroll-to-bottom fab */}
                    {messages.length > 5 && (
                        <button
                            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/15 transition-all z-10"
                        >
                            <ChevronDown size={14} />
                        </button>
                    )}

                    {/* Input Area */}
                    <div className="px-4 py-3 border-t border-white/5 shrink-0">
                        <div className="flex items-end gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask Sujay AI anything..."
                                    rows={1}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 pr-20 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all resize-none"
                                    style={{ minHeight: '44px', maxHeight: '120px' }}
                                />
                                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                                    <button className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-colors">
                                        <Paperclip size={14} />
                                    </button>
                                    <button className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-colors">
                                        <Mic size={14} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-light text-[#060E1F] flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-primary active:scale-95 shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
