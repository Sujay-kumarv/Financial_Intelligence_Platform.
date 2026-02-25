"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Calendar, ArrowUpRight } from 'lucide-react';

export function CompanyCard({ company, isSelected, onToggle }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onClick={() => onToggle(company.id)}
            className={`glass-card p-6 cursor-pointer relative group ${isSelected ? 'border-indigo-500/80 bg-indigo-500/10 ring-2 ring-indigo-500/20' : ''
                }`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center font-bold text-xl text-indigo-400 border border-white/10">
                    {company.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${company.status === 'New Data' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            company.status === 'Updated' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                        {company.status || 'Active'}
                    </span>
                    <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {company.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{company.ticker_symbol || 'OTC: ' + company.name.substring(0, 4).toUpperCase()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <TrendingUp size={12} />
                        <span className="text-[10px] uppercase font-semibold">Revenue</span>
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                        ${(Math.random() * 50 + 10).toFixed(1)}B
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Activity size={12} />
                        <span className="text-[10px] uppercase font-semibold">Growth</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">
                        +{(Math.random() * 15 + 2).toFixed(1)}%
                    </span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Updated 2h ago</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="hover:text-indigo-400 font-bold uppercase tracking-tighter">Analyze</button>
                    <span>•</span>
                    <button className="hover:text-indigo-400 font-bold uppercase tracking-tighter">Compare</button>
                </div>
            </div>

            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-[#020617] shadow-lg shadow-indigo-500/50"
                >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </motion.div>
            )}
        </motion.div>
    );
}

export function CompanyGrid({ companies, selectedIds, onToggle }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {companies.map(company => (
                <CompanyCard
                    key={company.id}
                    company={company}
                    isSelected={selectedIds.includes(company.id)}
                    onToggle={onToggle}
                />
            ))}
        </div>
    );
}
