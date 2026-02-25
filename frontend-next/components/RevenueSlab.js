"use client";
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, TrendingUp, TrendingDown
} from 'lucide-react';
import { useSettings, CURRENCIES, UNITS } from '../lib/SettingsContext';

export default function RevenueSlab({ initialValue = 0, value = 0, trend = 0 }) {
    const { settings, isLoaded } = useSettings();

    // Format value with respect to Global Units and Currency
    const formattedValue = useMemo(() => {
        if (!isLoaded) return '—';

        const currency = CURRENCIES.find(c => c.code === settings.financial.currency) || CURRENCIES[0];
        const unit = UNITS.find(u => u.id === settings.financial.unit) || UNITS[0];

        const rawValue = Number(value || initialValue) || 0;
        const scaledValue = rawValue / unit.factor;

        // Use correct locale for currency
        const locale = currency.locale || 'en-US';

        const numString = scaledValue.toLocaleString(locale, {
            minimumFractionDigits: settings.financial.decimals,
            maximumFractionDigits: settings.financial.decimals
        });

        return `${currency.symbol}${numString}${unit.id === 'Full' ? '' : unit.id}`;
    }, [value, initialValue, settings.financial, isLoaded]);

    if (!isLoaded) {
        return <div className="glass-card p-5 min-h-[160px] animate-pulse" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-5 relative group min-h-[160px] flex flex-col justify-between"
        >
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                            {settings.financial.label || 'Total Revenue'}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <motion.span
                                key={formattedValue}
                                initial={{ opacity: 0.7 }}
                                animate={{ opacity: 1 }}
                                className="text-3xl font-extrabold text-white font-titles tracking-tight"
                            >
                                {formattedValue}
                            </motion.span>
                        </div>
                        {trend !== 0 && (
                            <div className={`flex items-center gap-1 mt-2 ${trend >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                                {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span className="text-[10px] font-bold">
                                    {trend >= 0 ? '+' : ''}{trend}%
                                </span>
                                <span className="text-[9px] text-slate-500 ml-1">vs prev {settings.financial.period || 'year'}</span>
                            </div>
                        )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <DollarSign size={20} />
                    </div>
                </div>
            </div>

            {/* Background interactive gradient */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.25rem] pointer-events-none" />
        </motion.div>
    );
}
