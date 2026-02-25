import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Users, DollarSign, Activity, PieChart, Shield, ChevronRight, Zap } from 'lucide-react';

export default function PortfolioOverview() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await api.request('/analysis/portfolio/summary');
                setSummary(data);
            } catch (error) {
                console.error('Failed to fetch portfolio summary:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 glass-panel rounded-2xl bg-white/5 border-white/5" />
                ))}
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    label="Total Managed Assets"
                    value={`$${(summary.total_revenue / 1000000).toFixed(1)}M`}
                    icon={DollarSign}
                    trend={summary.revenue_trend || null}
                    color="primary"
                />
                <KpiCard
                    label="Active Client Base"
                    value={summary.total_clients}
                    icon={Users}
                    trend={summary.clients_trend || null}
                    color="blue"
                />
                <KpiCard
                    label="Avg Health Score"
                    value={`${summary.avg_health_score.toFixed(0)}/100`}
                    icon={Activity}
                    trend={summary.health_trend || null}
                    color="green"
                />
                <KpiCard
                    label="Total Risk Alerts"
                    value={Object.values(summary.risk_distribution).reduce((a, b) => a + b, 0)}
                    icon={Shield}
                    trend={summary.alerts_trend || null}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Risk Distribution */}
                <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest font-titles">Portfolio Risk</h3>
                        <PieChart size={16} className="text-slate-500" />
                    </div>
                    <div className="space-y-4">
                        {Object.entries(summary.risk_distribution).map(([level, count]) => (
                            <div key={level} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                                    <span className="text-slate-400">{level} Risk</span>
                                    <span className="text-white">{count} Entities</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${(count / summary.total_clients) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Portfolio Narrative */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={120} className="text-primary" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 text-primary mb-2">
                            <TrendingUp size={18} />
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Sujay AI Execution Summary</span>
                        </div>
                        <h4 className="text-2xl font-bold text-white font-titles leading-tight max-w-lg">
                            Aggregate Performance & Strategy Alignment
                        </h4>
                        <div className="text-slate-400 text-sm leading-relaxed font-medium font-body markdown-content">
                            {summary.ai_narrative.split('\n').map((line, i) => (
                                <p key={i} className="mb-2">{line}</p>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mt-6 group-hover:gap-4 transition-all">
                            Download Full Report <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, icon: Icon, trend, color }) {
    const colorMap = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        green: 'text-green-400 bg-green-400/10 border-green-400/20',
        red: 'text-red-400 bg-red-400/10 border-red-400/20'
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border-white/5 hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-black/20 ${String(trend).startsWith('+') ? 'text-green-400' : String(trend).startsWith('-') ? 'text-red-400' : 'text-slate-400'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        </div>
    );
}
