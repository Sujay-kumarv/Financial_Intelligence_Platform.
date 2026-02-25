"use client";
import React, { useState } from 'react';
import { Search, Sparkles, LogOut, User, Bell, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import { useSettings } from '../lib/SettingsContext';

export default function Navbar({ onCommand, userName, onLogout, onToggleChat, chatOpen, alertCount = 0 }) {
    const { openSettings } = useSettings();
    const [isFocused, setIsFocused] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { role, user, refreshUser } = useAuth();

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('fin_intel_token');
        }
        if (onLogout) {
            onLogout();
        } else {
            window.location.href = '/login';
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-panel-strong border-b border-white/5 flex items-center px-6 justify-between">
            {/* Left spacer for sidebar */}
            <div style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-collapsed)' }} className="shrink-0" />

            {/* Center — Search */}
            <div className="flex-1 max-w-2xl px-6">
                <div className={`relative group transition-all duration-500 ${isFocused ? 'scale-[1.01]' : ''}`}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Ask Sujay AI to analyze or compare companies... (Cmd + K)"
                        className="w-full bg-white/5 border border-white/8 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all font-body"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onCommand?.(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/8 bg-white/5 text-[9px] text-slate-600 font-medium uppercase tracking-wider">
                        <span>⌘</span><span>K</span>
                    </div>
                </div>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-3">
                {/* Settings */}
                <button
                    onClick={openSettings}
                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    title="Settings"
                >
                    <Settings size={18} />
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <Bell size={18} />
                    {alertCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-neon-red text-[8px] font-bold text-white flex items-center justify-center">
                            {alertCount}
                        </span>
                    )}
                </button>

                {/* AI Chat Toggle */}
                <button
                    onClick={onToggleChat}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border ${chatOpen
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_15px_rgba(212,160,23,0.1)]'
                        : 'bg-white/5 text-slate-400 hover:text-primary hover:bg-white/10 border-white/5 hover:border-primary/30'
                        }`}
                    title="AI Assistant"
                >
                    <div className="relative">
                        <MessageSquare size={18} />
                        <Sparkles size={8} className="absolute -top-1 -right-1 text-primary animate-pulse" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:block">Ask Sujay AI</span>
                </button>

                {/* User Avatar */}
                <div
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer transition-all group"
                >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[#D4A017] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <User size={14} className="text-[#060E1F]" />
                    </div>
                    <div className="hidden sm:block">
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{userName || 'User'}</span>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-primary/60">{role}</p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-neon-red hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Logout"
                >
                    <LogOut size={16} />
                </button>
            </div>

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
                onUpdate={refreshUser}
            />

            <SettingsModal />
        </header>
    );
}
