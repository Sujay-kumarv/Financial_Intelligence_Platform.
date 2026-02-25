"use client";
import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, Shield, FileText, Settings, ChevronLeft, ChevronRight,
    Search, RefreshCw, BarChart2, CheckCircle2, AlertCircle, Clock, Plus
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../lib/SettingsContext';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, route: '/', roles: ['admin', 'analyst', 'readonly'] },
    { id: 'admin', label: 'Admin Panel', icon: Shield, route: '/admin', roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: FileText, route: null, roles: ['admin', 'analyst'] },
    { id: 'settings', label: 'Settings', icon: Settings, route: null, roles: ['admin'] },
];

const Sidebar = ({ onSelectClient, selectedClientIds = [], onAddClient, onCompare, activeNav = 'dashboard', onNavChange }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();

    // Persist collapsed state and broadcast change
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        if (saved !== null) setCollapsed(JSON.parse(saved));

        // Listen for external syncs (from same tab)
        const handleExternalSync = (e) => {
            if (e.detail.source !== 'sidebar') {
                setCollapsed(e.detail.collapsed);
            }
        };
        window.addEventListener('sidebar_sync', handleExternalSync);
        return () => window.removeEventListener('sidebar_sync', handleExternalSync);
    }, []);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebar_sync', {
            detail: { collapsed: newState, source: 'sidebar' }
        }));
    };

    const { openSettings } = useSettings();

    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await api.getCompanies();
            setClients(data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
        const interval = setInterval(fetchClients, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusIcon = (status) => {
        switch (status) {
            case 'New Data': return <Clock size={10} className="text-primary animate-pulse" />;
            case 'Updated': return <CheckCircle2 size={10} className="text-neon-green" />;
            default: return <BarChart2 size={10} className="text-slate-500" />;
        }
    };

    const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(role));

    return (
        <aside
            className="fixed left-0 top-0 h-screen z-40 flex flex-col glass-panel-strong border-r border-white/5"
            style={{
                width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-[#D4A017] rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/10 shrink-0">
                    <span className="text-[#060E1F] font-extrabold text-sm">FC</span>
                </div>
                {!collapsed && (
                    <div className="ml-3 overflow-hidden">
                        <h1 className="text-xs font-bold tracking-widest text-white uppercase whitespace-nowrap">Financial</h1>
                        <span className="text-[8px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap">Co-Pilot</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="px-3 pt-4 pb-2 space-y-1 shrink-0">
                {visibleNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;

                    const handleClick = (e) => {
                        if (item.id === 'settings') {
                            e.preventDefault();
                            openSettings();
                        } else if (!item.route && onNavChange) {
                            e.preventDefault();
                            onNavChange(item.id);
                        }
                    };

                    return (
                        <a
                            key={item.id}
                            href={item.route || '#'}
                            onClick={handleClick}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-primary/15 text-primary border border-primary/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                }`}
                        >
                            <Icon size={18} className={`shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-primary'} transition-colors`} />
                            {!collapsed && (
                                <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{item.label}</span>
                            )}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                            )}
                            {/* Tooltip for collapsed mode */}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-3 py-1.5 rounded-lg bg-[#0B1A39] border border-white/10 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                    {item.label}
                                </div>
                            )}
                        </a>
                    );
                })}
            </nav>

            <div className="mx-3 border-t border-white/5 my-2 shrink-0" />

            {/* Client Intelligence Section */}
            {!collapsed && (
                <>
                    <div className="px-4 mb-3 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clients</h3>
                            <button
                                onClick={fetchClients}
                                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-primary"
                                title="Refresh"
                            >
                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/8 rounded-lg py-2 pl-8 pr-3 text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all"
                            />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 mb-3 flex gap-2 shrink-0">
                        {role === 'admin' && (
                            <button
                                onClick={onAddClient}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-light text-[#060E1F] py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95"
                            >
                                <Plus size={12} /> Add
                            </button>
                        )}
                        <button
                            onClick={onCompare}
                            disabled={selectedClientIds.length < 2}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border border-white/8 active:scale-95"
                        >
                            <BarChart2 size={12} /> Compare
                        </button>
                    </div>

                    {/* Client List */}
                    <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                        {loading && clients.length === 0 ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-12 w-full rounded-lg bg-white/5 animate-pulse" />
                            ))
                        ) : filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => onSelectClient(client.id)}
                                    className={`group flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${selectedClientIds.includes(client.id)
                                        ? 'bg-primary/10 border border-primary/25'
                                        : 'border border-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${selectedClientIds.includes(client.id)
                                        ? 'bg-primary text-[#060E1F]'
                                        : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700'
                                        }`}>
                                        {client.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className={`text-[11px] font-semibold truncate ${selectedClientIds.includes(client.id) ? 'text-white' : 'text-slate-300'
                                                }`}>
                                                {client.name}
                                            </p>
                                            {getStatusIcon(client.status)}
                                        </div>
                                        <p className="text-[9px] text-slate-600 truncate">{client.industry || '—'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 opacity-50 text-center">
                                <AlertCircle size={20} className="text-slate-600 mb-2" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">No clients</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Stats */}
                    <div className="p-4 border-t border-white/5 shrink-0">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                            <span>Total</span>
                            <span className="text-primary">{clients.length} Clients</span>
                        </div>
                    </div>
                </>
            )}

            {/* Collapsed client count */}
            {collapsed && (
                <div className="flex-1 flex flex-col items-center pt-4 gap-3">
                    <div className="tooltip-wrapper">
                        <button
                            onClick={onAddClient}
                            className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                        <span className="tooltip-text">Add Client</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600">{clients.length}</div>
                </div>
            )}

            {/* Collapse Toggle */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0B1A39] border border-white/10 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all z-50 shadow-lg"
            >
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </aside>
    );
};

export default React.memo(Sidebar);
