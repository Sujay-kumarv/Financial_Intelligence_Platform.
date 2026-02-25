"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Briefcase, Building, Calendar, Save, Edit2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const InfoRow = ({ icon: Icon, label, value, name, type = "text", isEditing, formData, setFormData, error }) => {
    const handleInput = (e) => {
        const { name, value } = e.target;
        // Numeric only for phone
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-500">
                <Icon size={14} className="shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            {isEditing ? (
                <div className="space-y-1">
                    <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleInput}
                        className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/40 transition-all`}
                    />
                    {error && <p className="text-[10px] text-red-400 font-medium pl-1">{error}</p>}
                </div>
            ) : (
                <p className="text-xs text-slate-200 font-medium pl-6">{value || '—'}</p>
            )}
        </div>
    );
};

export default function ProfileModal({ isOpen, onClose, user, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        designation: '',
        department: '',
        date_of_joining: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
                designation: user.designation || '',
                department: user.department || '',
                date_of_joining: user.date_of_joining ? user.date_of_joining.toString().split('T')[0] : ''
            });
            setErrors({});
        }
    }, [user]);

    const validate = () => {
        const newErrors = {};
        if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
        if (formData.phone && formData.phone.length !== 10) {
            newErrors.phone = 'Phone number must be exactly 10 digits';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setLoading(true);
        setError('');
        try {
            const updatedUser = await api.updateProfile(formData);
            onUpdate(updatedUser);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#060E1F]/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md glass-panel-strong shadow-2xl border border-white/10 rounded-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#D4A017] flex items-center justify-center shadow-lg shadow-yellow-500/10">
                                <User size={20} className="text-[#060E1F]" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">User Profile</h2>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6">
                            <InfoRow
                                icon={User}
                                label="Full Name"
                                value={user?.full_name}
                                name="full_name"
                                isEditing={isEditing}
                                formData={formData}
                                setFormData={setFormData}
                                error={errors.full_name}
                            />
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Mail size={14} className="shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Email Address</span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium pl-6">{user?.email}</p>
                            </div>
                            <InfoRow
                                icon={Phone}
                                label="Phone Number"
                                value={user?.phone}
                                name="phone"
                                type="tel"
                                isEditing={isEditing}
                                formData={formData}
                                setFormData={setFormData}
                                error={errors.phone}
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <InfoRow
                                    icon={Briefcase}
                                    label="Designation"
                                    value={user?.designation}
                                    name="designation"
                                    isEditing={isEditing}
                                    formData={formData}
                                    setFormData={setFormData}
                                />
                                <InfoRow
                                    icon={Building}
                                    label="Department"
                                    value={user?.department}
                                    name="department"
                                    isEditing={isEditing}
                                    formData={formData}
                                    setFormData={setFormData}
                                />
                            </div>

                            <InfoRow
                                icon={Calendar}
                                label="Date of Joining"
                                value={user?.date_of_joining}
                                name="date_of_joining"
                                type="date"
                                isEditing={isEditing}
                                formData={formData}
                                setFormData={setFormData}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-[#060E1F] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                <Edit2 size={16} className="text-primary" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
