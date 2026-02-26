"use client";
import React, { useState } from 'react';
import { Sparkles, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const resp = await fetch('/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await resp.json();

            if (resp.ok) {
                setStatus('success');
                setMessage(data.message || 'Check your email for a reset link.');
            } else {
                setStatus('error');
                setMessage(data.detail || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Connection failed. Please check your network.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#060E1F] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                        <Sparkles size={32} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight font-titles">
                        Financial <span className="text-primary">Co-Pilot</span>
                    </h1>
                </div>

                <div className="glass-panel rounded-2xl p-8 border border-white/10">
                    <a href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-6 uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to Login
                    </a>

                    <h2 className="text-xl font-bold text-white font-titles mb-2">Forgot Password?</h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    {status === 'success' ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={24} className="text-green-400" />
                            </div>
                            <p className="text-sm text-green-400 font-medium mb-2">Email Sent!</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {message}
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-6 text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Try another email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status === 'error' && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-2">
                                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                                    <p className="text-xs text-red-400 font-medium">{message}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Email Address</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all font-body"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-primary hover:bg-[#FFC040] disabled:opacity-60 text-[#0B1A39] font-extrabold uppercase tracking-widest text-sm py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? 'Sending link...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
