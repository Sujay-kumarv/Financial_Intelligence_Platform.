import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, RefreshCw, BarChart2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ClientSidebar({ onSelect, selectedIds, onAddClient, onCompare }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();

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

        // Auto-refresh every 60s as per task
        const interval = setInterval(fetchClients, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusIcon = (status) => {
        switch (status) {
            case 'New Data': return <Clock size={12} className="text-primary animate-pulse" />;
            case 'Updated': return <CheckCircle2 size={12} className="text-green-400" />;
            default: return <BarChart2 size={12} className="text-slate-500" />;
        }
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 glass-panel border-r border-white/5 z-40 flex flex-col pt-24 font-body">
            {/* Header / Search */}
            <div className="px-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest font-titles">Client Intelligence</h3>
                    <button
                        onClick={fetchClients}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-primary"
                        title="Refresh List"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 mb-8 grid grid-cols-2 gap-3">
                {role === 'admin' && (
                    <button
                        onClick={onAddClient}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-[#FFC040] text-[#0B1A39] py-2.5 rounded-xl text-[10px] font-extrabold uppercase transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
                    >
                        <Plus size={14} />
                        Add Client
                    </button>
                )}
                <button
                    onClick={onCompare}
                    disabled={selectedIds.length < 2}
                    className={`flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:scale-100 py-2.5 rounded-xl text-[10px] font-extrabold uppercase transition-all border border-white/10 active:scale-95 ${role !== 'admin' ? 'col-span-2' : ''}`}
                >
                    <BarChart2 size={14} />
                    Compare
                </button>
            </div>

            {/* Client List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
                {loading && clients.length === 0 ? (
                    [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 w-full rounded-xl bg-white/5 animate-pulse" />
                    ))
                ) : filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                        <div
                            key={client.id}
                            onClick={() => onSelect(client.id)}
                            className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedIds.includes(client.id)
                                ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(212,160,23,0.1)]'
                                : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${selectedIds.includes(client.id)
                                ? 'bg-primary text-[#0B1A39] scale-110'
                                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                                }`}>
                                {client.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs font-bold truncate ${selectedIds.includes(client.id) ? 'text-white' : 'text-slate-300'}`}>
                                        {client.name}
                                    </p>
                                    {getStatusIcon(client.status)}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{client.industry || 'Financial Services'}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50 text-center px-4">
                        <AlertCircle size={24} className="text-slate-600 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No clients found</p>
                    </div>
                )}
            </div>

            {/* Footer / Stats */}
            <div className="p-6 border-t border-white/5 bg-[#0B1A39]/30">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Total Managed</span>
                    <span className="text-primary">{clients.length} Clients</span>
                </div>
            </div>
        </aside>
    );
}
