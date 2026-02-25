"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, ExternalLink, Trash2, Eye } from 'lucide-react';

function StatusBadge({ status }) {
    const config = {
        'Active': 'badge-active',
        'New Data': 'badge-info',
        'Updated': 'badge-warning',
        'Warning': 'badge-warning',
        'Critical': 'badge-critical',
    };

    return (
        <span className={`badge ${config[status] || 'badge-active'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'Critical' ? 'bg-neon-red' :
                status === 'Warning' ? 'bg-yellow-400' :
                    status === 'New Data' ? 'bg-neon-blue' :
                        'bg-neon-green'
                }`} />
            {status || 'Active'}
        </span>
    );
}

const COLUMNS = [
    { key: 'name', label: 'Company', sortable: true },
    { key: 'industry', label: 'Industry', sortable: true },
    { key: 'ticker_symbol', label: 'Ticker', sortable: true },
    { key: 'region', label: 'Region', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: '', sortable: false },
];

export default React.memo(function CompanyTable({ companies = [], onSelectCompany, onDeleteCompany, selectedIds = [] }) {
    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = React.useMemo(() => {
        return [...companies].sort((a, b) => {
            const aVal = (a[sortKey] || '').toString().toLowerCase();
            const bVal = (b[sortKey] || '').toString().toLowerCase();
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [companies, sortKey, sortDir]);

    if (companies.length === 0) {
        return (
            <div className="glass-card p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Eye size={24} className="text-slate-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-400 font-titles mb-1">No Companies Yet</h3>
                <p className="text-[11px] text-slate-600">Add your first client to see analytics here.</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white font-titles">Client Portfolio</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{companies.length} companies tracked</p>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            {COLUMNS.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 ${col.sortable ? 'cursor-pointer hover:text-primary transition-colors select-none' : ''}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {col.label}
                                        {col.sortable && sortKey === col.key && (
                                            sortDir === 'asc'
                                                ? <ArrowUp size={10} className="text-primary" />
                                                : <ArrowDown size={10} className="text-primary" />
                                        )}
                                        {col.sortable && sortKey !== col.key && (
                                            <ArrowUpDown size={10} className="opacity-30" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode='popLayout'>
                            {sorted.map((company, idx) => (
                                <motion.tr
                                    key={company.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => onSelectCompany?.(company.id)}
                                    className={`border-b border-white/[0.03] cursor-pointer transition-colors duration-200 group ${selectedIds.includes(company.id)
                                        ? 'bg-primary/5'
                                        : 'hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${selectedIds.includes(company.id)
                                                ? 'bg-primary text-[#060E1F]'
                                                : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                {company.name.charAt(0)}
                                            </div>
                                            <span className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
                                                {company.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-[11px] text-slate-400">{company.industry || '—'}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-[11px] font-mono text-primary/80">{company.ticker_symbol || '—'}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-[11px] text-slate-400">{company.region || '—'}</td>
                                    <td className="px-5 py-3.5">
                                        <StatusBadge status={company.status || 'Active'} />
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelectCompany?.(company.id); }}
                                                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-neon-blue transition-colors"
                                                title="View Details"
                                            >
                                                <ExternalLink size={13} />
                                            </button>
                                            {onDeleteCompany && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteCompany(company.id, company.name); }}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-neon-red transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
});
