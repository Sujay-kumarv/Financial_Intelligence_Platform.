"use client";
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Sparkles, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If already logged in, redirect to home
        const token = localStorage.getItem('fin_intel_token');
        if (token) {
            window.location.href = '/';
        }
    }, []);

    const [healthStatus, setHealthStatus] = useState(null);

    const checkHealth = async () => {
        setHealthStatus('checking');
        try {
            const resp = await fetch('/api/v1/health');
            if (resp.ok) {
                setHealthStatus('healthy');
            } else {
                setHealthStatus('error');
            }
        } catch (err) {
            console.error("Health check failed:", err);
            setHealthStatus('failed');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.login(email, password);
            window.location.href = '/';
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#060E1F] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                        <Sparkles size={32} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight font-titles">
                        Financial <span className="text-primary">Co-Pilot</span>
                    </h1>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold font-body">
                        by Sujay Kumar AI Studio
                    </p>
                </div>

                {/* Card */}
                <div className="glass-panel rounded-2xl p-8 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white font-titles">Sign in to your account</h2>
                        <button
                            onClick={checkHealth}
                            className={`text-[9px] px-2 py-1 rounded border transition-all ${healthStatus === 'healthy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                healthStatus === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    healthStatus === 'checking' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse' :
                                        'bg-white/5 text-slate-400 border-white/10 hover:text-primary'
                                }`}
                        >
                            {healthStatus === 'healthy' ? 'API Online' : healthStatus === 'failed' ? 'API Offline' : healthStatus === 'checking' ? 'Testing...' : 'Test API'}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                            <p className="text-xs text-red-400 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Email</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Password</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-[#FFC040] disabled:opacity-60 text-[#0B1A39] font-extrabold uppercase tracking-widest text-sm py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 mt-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-white/5 text-center">
                        <span className="text-xs text-slate-500">Don't have an account? </span>
                        <a href="/register" className="text-xs font-bold text-primary hover:text-[#FFC040] transition-colors">Register</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
