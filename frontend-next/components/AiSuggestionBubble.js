"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';

export default function AiSuggestionBubble({ suggestion, onOpenChat, visible = true }) {
    if (!visible || !suggestion) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="animate-float cursor-pointer group"
            onClick={onOpenChat}
        >
            <div className="glass-card px-5 py-3.5 flex items-center gap-3 border-primary/20 hover:border-primary/40 transition-all relative overflow-hidden">
                {/* Background shimmer */}
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />

                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-all">
                    <Sparkles size={14} className="text-primary" />
                </div>

                <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">AI Insight</p>
                    <p className="text-xs text-slate-300 font-medium">{suggestion}</p>
                </div>

                <Zap size={14} className="text-primary/40 shrink-0 group-hover:text-primary transition-colors" />
            </div>
        </motion.div>
    );
}
