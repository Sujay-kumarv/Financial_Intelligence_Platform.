"use client";
import React, { useState, useRef } from 'react';
import { api } from '../../lib/api';
import {
    User, Mail, Phone, Camera, Calendar, Briefcase, Building2,
    ChevronRight, CheckCircle, AlertCircle, ArrowLeft, Sparkles, X
} from 'lucide-react';

const DEPARTMENTS = [
    'Finance', 'Risk Management', 'Compliance', 'Investment Banking',
    'Asset Management', 'Technology', 'Operations', 'Legal',
    'Human Resources', 'Marketing', 'Audit', 'Treasury',
];

export default function RegisterPage() {
    const [form, setForm] = useState({
        full_name: '', email: '', phone: '',
        designation: '', department: '', date_of_joining: '',
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            // Filter non-numeric and limit to 10 chars
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setForm(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setError('Please upload a JPEG or PNG image.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Photo must be less than 5MB.');
            return;
        }

        setPhoto(file);
        setError('');
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.full_name.trim()) return setError('Full name is required.');
        if (!form.email.trim()) return setError('Email is required.');
        if (!validateEmail(form.email.trim())) return setError('Please enter a valid email address.');
        if (!form.phone.trim()) return setError('Phone number is required.');
        if (form.phone.length !== 10) return setError('Phone number must be exactly 10 digits.');
        if (!photo) return setError('A face photo is required for facial authentication.');

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('full_name', form.full_name.trim());
            fd.append('email', form.email.trim());
            fd.append('phone', form.phone.trim());
            fd.append('photo', photo);
            if (form.designation) fd.append('designation', form.designation.trim());
            if (form.department) fd.append('department', form.department);
            if (form.date_of_joining) fd.append('date_of_joining', form.date_of_joining);

            await api.submitRegistration(fd);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Success Screen ──
    if (success) {
        return (
            <div className="min-h-screen bg-[#060E1F] flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                        <CheckCircle size={36} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white font-titles">Registration Submitted!</h1>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Your application has been sent to the admin team for review.
                        Once approved, your login credentials will be emailed to <strong className="text-white">{form.email}</strong>.
                    </p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-[#FFC040] text-[#060E1F] px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all"
                    >
                        <ArrowLeft size={14} /> Back to Login
                    </a>
                </div>
            </div>
        );
    }

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:border-primary/60 focus:bg-white/8 outline-none transition-all";

    return (
        <div className="min-h-screen bg-[#060E1F] flex items-center justify-center p-6">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#D4A017] mb-4 shadow-lg shadow-yellow-500/10">
                        <span className="text-[#060E1F] font-extrabold text-lg">FC</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white font-titles">Create your account</h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Financial Co-Pilot Registration</p>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
                    <div className="p-8 space-y-5">

                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-3 pb-4 border-b border-white/5">
                            <div
                                className="relative w-28 h-28 rounded-full border-2 border-dashed border-white/15 hover:border-primary/40 cursor-pointer transition-all overflow-hidden group"
                                onClick={() => fileRef.current?.click()}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/3 group-hover:bg-white/5 transition-colors">
                                        <Camera size={24} className="text-slate-600 group-hover:text-primary transition-colors" />
                                        <span className="text-[9px] text-slate-600 mt-1 font-bold uppercase tracking-wider">Face Photo</span>
                                    </div>
                                )}
                                {photoPreview && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                                        className="absolute top-0 right-0 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
                            <p className="text-[10px] text-slate-600 font-medium">Upload a clear face photo (JPEG/PNG, max 5MB)</p>
                        </div>

                        {/* Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <User size={11} /> Full Name *
                                </label>
                                <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="John Doe" className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Mail size={11} /> Email *
                                </label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@company.com" className={inputClass} />
                            </div>
                        </div>

                        {/* Phone & DOJ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Phone size={11} /> Phone Number *
                                </label>
                                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Calendar size={11} /> Date of Joining
                                </label>
                                <input name="date_of_joining" type="date" value={form.date_of_joining} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Designation & Department */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Briefcase size={11} /> Designation
                                </label>
                                <input name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Financial Analyst" className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Building2 size={11} /> Department
                                </label>
                                <select name="department" value={form.department} onChange={handleChange} className={inputClass + ' custom-select cursor-pointer'}>
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                                <AlertCircle size={14} className="shrink-0" />
                                <span className="text-xs font-medium">{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#FFC040] disabled:opacity-40 disabled:cursor-not-allowed text-[#060E1F] py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Submitting…
                                </span>
                            ) : (
                                <>
                                    <Sparkles size={14} /> Submit Registration <ChevronRight size={14} />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer Link */}
                    <div className="px-8 py-4 border-t border-white/5 text-center">
                        <span className="text-xs text-slate-500">Already have an account? </span>
                        <a href="/login" className="text-xs font-bold text-primary hover:text-[#FFC040] transition-colors">Sign In</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
