"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Globe, Eye, Zap, Bell,
    Save, RotateCcw, Check, ChevronRight
} from 'lucide-react';
import { useSettings, CURRENCIES, UNITS, THEMES } from '../lib/SettingsContext';

const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${active
            ? 'bg-primary text-[#060E1F] shadow-lg shadow-primary/20'
            : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon size={16} />
        <span className="flex-1 text-left">{label}</span>
        {active && <ChevronRight size={14} />}
    </button>
);

const SettingRow = ({ label, description, children }) => (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-tight">{label}</span>
            <div className="min-w-[120px] flex justify-end">{children}</div>
        </div>
        {description && <p className="text-[10px] text-slate-500 font-medium">{description}</p>}
    </div>
);

export default function SettingsModal() {
    const { settings, updateSettings, resetSettings, isSettingsOpen, closeSettings } = useSettings();
    const [activeTab, setActiveTab] = useState('financial');
    const [showSaved, setShowSaved] = useState(false);

    const handleSave = () => {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    return (
        <AnimatePresence>
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSettings}
                        className="absolute inset-0 bg-[#060E1F]/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl h-[600px] glass-panel-strong shadow-2xl border border-white/10 rounded-3xl overflow-hidden flex"
                    >
                        {/* Sidebar */}
                        <div className="w-64 border-r border-white/5 bg-white/[0.02] p-6 flex flex-col gap-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Settings size={20} />
                                </div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-white">System Settings</h2>
                            </div>

                            <div className="flex-1 space-y-2">
                                <TabButton id="financial" label="Financial" icon={Globe} active={activeTab === 'financial'} onClick={setActiveTab} />
                                <TabButton id="intelligence" label="Intelligence" icon={Zap} active={activeTab === 'intelligence'} onClick={setActiveTab} />
                                <TabButton id="display" label="Display" icon={Eye} active={activeTab === 'display'} onClick={setActiveTab} />
                                <TabButton id="notifications" label="Notifications" icon={Bell} active={activeTab === 'notifications'} onClick={setActiveTab} />
                            </div>

                            <button
                                onClick={resetSettings}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <RotateCcw size={12} /> Reset to Defaults
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                                    {activeTab} Preferences
                                </h3>
                                <button onClick={closeSettings} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                                {activeTab === 'financial' && (
                                    <>
                                        <SettingRow label="Base Currency" description="Select the default currency for your global reports.">
                                            <select
                                                value={settings.financial.currency}
                                                onChange={(e) => updateSettings('financial', 'currency', e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/40 custom-select"
                                            >
                                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                            </select>
                                        </SettingRow>
                                        <SettingRow label="Preferred Units" description="Choose how large numbers are displayed globally (Millions vs Crores/Lakhs).">
                                            <select
                                                value={settings.financial.unit}
                                                onChange={(e) => updateSettings('financial', 'unit', e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/40 custom-select"
                                            >
                                                {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                                            </select>
                                        </SettingRow>
                                        <SettingRow label="Decimal Precision" description="Set global decimal alignment for financial metrics.">
                                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                                {[0, 1, 2].map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => updateSettings('financial', 'decimals', d)}
                                                        className={`px-4 py-1 rounded-md text-[10px] font-bold transition-all ${settings.financial.decimals === d ? 'bg-primary text-[#060E1F]' : 'text-slate-500 hover:text-white'}`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </SettingRow>
                                    </>
                                )}

                                {activeTab === 'intelligence' && (
                                    <>
                                        <SettingRow label="Health Guard Threshold" description="Flag clients as 'High Risk' when their health score falls below this value.">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range" min="0" max="100"
                                                    value={settings.intelligence.healthThreshold}
                                                    onChange={(e) => updateSettings('intelligence', 'healthThreshold', parseInt(e.target.value))}
                                                    className="w-32 accent-primary"
                                                />
                                                <span className="text-xs font-bold text-primary w-8">{settings.intelligence.healthThreshold}</span>
                                            </div>
                                        </SettingRow>
                                        <SettingRow label="Risk Ratio Alerts" description="Enable automated risk detection based on industry-standard financial ratios (D/E, Quick Ratio).">
                                            <button
                                                onClick={() => updateSettings('intelligence', 'riskAlertsEnabled', !settings.intelligence.riskAlertsEnabled)}
                                                className={`w-12 h-6 rounded-full transition-all relative ${settings.intelligence.riskAlertsEnabled ? 'bg-primary' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.intelligence.riskAlertsEnabled ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </SettingRow>
                                    </>
                                )}

                                {activeTab === 'display' && (
                                    <>
                                        <SettingRow label="System Theme" description="Switch between high-contrast dark, light, or modern glass themes.">
                                            <select
                                                value={settings.visual.theme}
                                                onChange={(e) => updateSettings('visual', 'theme', e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/40 custom-select"
                                            >
                                                {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                            </select>
                                        </SettingRow>
                                        <SettingRow label="Active Glassmorphism" description="Apply subtle blur and transparency effects to the user interface.">
                                            <button
                                                onClick={() => updateSettings('visual', 'glassmorphism', !settings.visual.glassmorphism)}
                                                className={`w-12 h-6 rounded-full transition-all relative ${settings.visual.glassmorphism ? 'bg-primary' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.visual.glassmorphism ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </SettingRow>
                                    </>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSave}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary-light text-[#060E1F] px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                                >
                                    {showSaved ? <Check size={16} /> : <Save size={16} />}
                                    {showSaved ? 'Settings Saved' : 'Apply Changes'}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
