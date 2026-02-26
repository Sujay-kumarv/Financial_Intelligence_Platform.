"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#060E1F]"><div className="text-white">Loading...</div></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid reset link. The token is missing.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        setStatus('loading');

        try {
            const resp = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password })
            });

            const data = await resp.json();

            if (resp.ok) {
                setStatus('success');
                setMessage(data.message || 'Your password has been reset successfully.');
            } else {
                setStatus('error');
                setMessage(data.detail || 'Failed to reset password. The link may have expired.');
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
                    <h2 className="text-xl font-bold text-white font-titles mb-2">Reset Password</h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        Create a new secure password for your account.
                    </p>

                    {status === 'success' ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={24} className="text-green-400" />
                            </div>
                            <p className="text-sm text-green-400 font-medium mb-3">Password Updated!</p>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                {message}
                            </p>
                            <a
                                href="/login"
                                className="w-full bg-primary hover:bg-[#FFC040] text-[#0B1A39] font-extrabold uppercase tracking-widest text-sm py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20 block"
                            >
                                Continue to Login
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {(status === 'error' || !token) && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-2">
                                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                                    <p className="text-xs text-red-400 font-medium">{message || 'Invalid or missing token.'}</p>
                                </div>
                            )}

                            {token && status !== 'success' && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">New Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-body"
                                                placeholder="Minimum 8 characters"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-body"
                                                placeholder="Repeat new password"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading' || !token}
                                        className="w-full bg-primary hover:bg-[#FFC040] disabled:opacity-60 text-[#0B1A39] font-extrabold uppercase tracking-widest text-sm py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
                                    >
                                        {status === 'loading' ? 'Updating password...' : 'Update Password'}
                                    </button>
                                </>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
