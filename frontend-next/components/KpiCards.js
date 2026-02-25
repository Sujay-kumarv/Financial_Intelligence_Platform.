"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Heart, Users, AlertTriangle, DollarSign } from 'lucide-react';

const CARD_CONFIG = [
    {
        id: 'revenue',
        label: 'Total Revenue',
        icon: DollarSign,
        accentColor: 'var(--primary)',
        bgGlow: 'rgba(255, 179, 0, 0.08)',
        format: (v) => `$${(v / 1_000_000).toFixed(1)}M`,
        trendKey: 'revenue_trend',
    },
    {
        id: 'health',
        label: 'Health Score',
        icon: Heart,
        accentColor: 'var(--neon-green)',
        bgGlow: 'rgba(34, 197, 94, 0.08)',
        format: (v) => `${Math.round(v)}`,
        suffix: '/100',
        isScore: true,
        trendKey: 'health_trend',
    },
    {
        id: 'clients',
        label: 'Active Clients',
        icon: Users,
        accentColor: 'var(--neon-blue)',
        bgGlow: 'rgba(59, 130, 246, 0.08)',
        format: (v) => `${v}`,
        trendKey: 'clients_trend',
    },
    {
        id: 'alerts',
        label: 'Risk Alerts',
        icon: AlertTriangle,
        accentColor: 'var(--neon-red)',
        bgGlow: 'rgba(239, 68, 68, 0.08)',
        format: (v) => `${v}`,
        trendKey: 'alerts_trend',
    },
];

import RevenueSlab from './RevenueSlab';

function CircularProgress({ value, max = 100, size = 48, strokeWidth = 4, color }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / max) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
        </svg>
    );
}

import { useSettings, CURRENCIES, UNITS } from '../lib/SettingsContext';

export default React.memo(function KpiCards({ data = {} }) {
    const { settings, isLoaded } = useSettings();

    const getValue = (id) => {
        switch (id) {
            case 'revenue': return data.total_revenue || 0;
            case 'health': return data.avg_health_score || 0;
            case 'clients': return data.total_companies || 0;
            case 'alerts': return data.high_risk_count || 0;
            default: return 0;
        }
    };

    const getTrend = (id) => {
        switch (id) {
            case 'revenue': return data.revenue_change || 0;
            case 'health': return data.health_change || 0;
            case 'clients': return data.clients_change || 0;
            case 'alerts': return data.alerts_change || 0;
            default: return 0;
        }
    };

    const formatValue = (id, value) => {
        if (!isLoaded) return '—';

        const currency = CURRENCIES.find(c => c.code === settings.financial.currency) || CURRENCIES[0];
        const unit = UNITS.find(u => u.id === settings.financial.unit) || UNITS[0];
        const locale = currency.locale || 'en-US';

        if (id === 'revenue') {
            const scaled = value / unit.factor;
            return `${currency.symbol}${scaled.toLocaleString(locale, {
                minimumFractionDigits: settings.financial.decimals,
                maximumFractionDigits: settings.financial.decimals
            })}${unit.id === 'Full' ? '' : unit.id}`;
        }

        if (id === 'health') return `${Math.round(value)}`;
        return value.toLocaleString();
    };

    if (!isLoaded) return <div className="grid grid-cols-4 gap-4 h-32 animate-pulse bg-white/5 rounded-2xl" />;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Customizable Revenue Slab */}
            <RevenueSlab
                value={getValue('revenue')}
                trend={getTrend('revenue')}
            />

            {/* Other KPI Cards */}
            {CARD_CONFIG.filter(c => c.id !== 'revenue').map((card, idx) => {
                const Icon = card.icon;
                const value = getValue(card.id);
                const trend = getTrend(card.id);
                const isUp = trend >= 0;

                // Dynamic coloring for Health Score based on settings
                const effectiveColor = card.id === 'health'
                    ? (value < settings.intelligence.healthThreshold ? 'var(--neon-red)' : 'var(--neon-green)')
                    : card.accentColor;

                return (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (idx + 1) * 0.1 }}
                        className="glass-card p-5 relative overflow-hidden group"
                    >
                        {/* Background glow */}
                        <div
                            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-50"
                            style={{ background: card.bgGlow }}
                        />

                        <div className="relative z-10 flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                    {card.label}
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-white font-titles">
                                        {formatValue(card.id, value)}
                                    </span>
                                    {card.suffix && (
                                        <span className="text-sm text-slate-500 font-semibold">{card.suffix}</span>
                                    )}
                                </div>

                                {trend !== null && (
                                    <div className={`flex items-center gap-1 mt-2 ${isUp ? 'text-neon-green' : 'text-neon-red'}`}>
                                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        <span className="text-[10px] font-bold">
                                            {isUp ? '+' : ''}{trend.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                {card.isScore ? (
                                    <div className="relative">
                                        <CircularProgress value={value} color={effectiveColor} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Icon size={16} style={{ color: effectiveColor }} />
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: card.bgGlow,
                                            border: `1px solid ${effectiveColor}20`,
                                        }}
                                    >
                                        <Icon size={20} style={{ color: effectiveColor }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
});
