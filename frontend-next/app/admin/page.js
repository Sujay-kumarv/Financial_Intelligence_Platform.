"use client";
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import AdminGuard from '../../components/AdminGuard';
import { useAuth } from '../../context/AuthContext';
import {
    Shield, Users, Building2, Plus, Trash2, Edit3, Save, X,
    Mail, Lock, User, AlertCircle, ChevronRight, ArrowLeft, Eye, EyeOff, Copy, Check,
    Upload, Globe, FileSpreadsheet, Loader2, ClipboardList, CheckCircle, XCircle, Clock, Image
} from 'lucide-react';

export default function AdminPage() {
    const { user: authUser, role } = useAuth();
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // User creation form
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'readonly' });
    const [createdCreds, setCreatedCreds] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState('');

    // Company creation / edit form
    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [companyForm, setCompanyForm] = useState({
        name: '', industry: '', ticker_symbol: '', fiscal_year_end: 'December',
        region: '', data_source: 'manual'
    });

    // Multi-select for bulk delete
    const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    const ROLES = ['admin', 'manager', 'analyst', 'readonly'];
    const INDUSTRIES = [
        'Fintech', 'Banking', 'Insurance', 'Asset Management',
        'Investment Banking', 'Private Equity', 'Consumer Finance',
        'Financial Technology', 'Commercial Banking', 'Real Estate',
        'Healthcare', 'Technology', 'Manufacturing', 'Retail', 'Energy',
    ];
    const DEPARTMENTS = [
        'Finance', 'Risk Management', 'Compliance', 'Investment Banking',
        'Asset Management', 'Technology', 'Operations', 'Legal',
        'Human Resources', 'Marketing', 'Audit', 'Treasury',
    ];

    // Excel upload state
    const [excelFile, setExcelFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // API connection state
    const [apiConfig, setApiConfig] = useState({ api_url: '', api_key: '', endpoint_path: '' });
    const [showApiKey, setShowApiKey] = useState(false);

    // Submission guard
    const [submitting, setSubmitting] = useState(false);

    // Registration management
    const [registrations, setRegistrations] = useState([]);
    const [regFilter, setRegFilter] = useState('pending');
    const [rejectNotes, setRejectNotes] = useState({});

    // Sidebar collapse tracking
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const check = () => {
            const saved = localStorage.getItem('sidebar_collapsed');
            if (saved !== null) setSidebarCollapsed(JSON.parse(saved));
        };
        check();
        const interval = setInterval(check, 300);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!authUser) return;
        setUser(authUser);

        const loadData = async () => {
            try {
                await Promise.all([fetchUsers(), fetchCompanies(), fetchRegistrations()]);
            } catch (err) {
                console.error('Failed to load admin data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [authUser]);


    const fetchUsers = async () => {
        try { setUsers(await api.getUsers()); } catch (e) { console.error(e); }
    };
    const fetchCompanies = async () => {
        try { setCompanies(await api.getCompanies()); } catch (e) { console.error(e); }
    };

    const autoHide = (setter) => setTimeout(() => setter(''), 4000);

    // ========== User Management ==========
    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password) {
            setError('Email and password are required'); autoHide(setError); return;
        }
        if (newUser.password.length < 8) {
            setError('Password must be at least 8 characters'); autoHide(setError); return;
        }
        try {
            await api.createUser(newUser);
            setCreatedCreds({ email: newUser.email, password: newUser.password, full_name: newUser.full_name });
            setNewUser({ email: '', password: '', full_name: '', role: 'readonly' });
            await fetchUsers();
            setSuccess('User account created successfully!'); autoHide(setSuccess);
        } catch (e) {
            setError(e.message || 'Failed to create user'); autoHide(setError);
        }
    };

    const handleDeleteUser = async (userId, email) => {
        if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
        try {
            await api.deleteUser(userId);
            await fetchUsers();
            setSuccess(`User "${email}" deleted`); autoHide(setSuccess);
        } catch (e) {
            setError(e.message || 'Failed to delete user'); autoHide(setError);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await api.updateUser(userId, { role: newRole });
            await fetchUsers();
            setSuccess(`Role updated to "${newRole}"`); autoHide(setSuccess);
        } catch (e) {
            setError(e.message || 'Failed to update role'); autoHide(setError);
        }
    };

    const toggleUserSelect = (id) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const toggleSelectAllUsers = () => {
        // Only select non-admin users (can't delete admins including ourselves)
        const deletableUsers = users.filter(u => u.role !== 'admin');
        if (selectedUserIds.length === deletableUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(deletableUsers.map(u => u.id));
        }
    };

    const handleBulkDeleteUsers = async () => {
        if (selectedUserIds.length === 0) return;
        const count = selectedUserIds.length;
        if (!confirm(`Delete ${count} selected user${count > 1 ? 's' : ''}? This cannot be undone.`)) return;
        try {
            await Promise.all(selectedUserIds.map(id => api.deleteUser(id)));
            setSelectedUserIds([]);
            await fetchUsers();
            setSuccess(`${count} user${count > 1 ? 's' : ''} deleted successfully`); autoHide(setSuccess);
        } catch (e) {
            setError(e.message || 'Failed to delete some users'); autoHide(setError);
            await fetchUsers();
        }
    };

    const copyText = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(''), 2000);
    };

    // ========== Company Management ==========
    const openNewCompany = () => {
        setEditingCompany(null);
        setCompanyForm({ name: '', industry: '', ticker_symbol: '', fiscal_year_end: 'December', region: '', data_source: 'manual' });
        setShowCompanyForm(true);
    };

    const openEditCompany = (c) => {
        setEditingCompany(c);
        setCompanyForm({
            name: c.name, industry: c.industry || '', ticker_symbol: c.ticker_symbol || '',
            fiscal_year_end: c.fiscal_year_end || 'December', region: c.region || '', data_source: c.data_source || 'manual'
        });
        setShowCompanyForm(true);
    };

    const handleSaveCompany = async () => {
        if (!companyForm.name.trim()) { setError('Company name is required'); autoHide(setError); return; }
        if (submitting) return;
        setSubmitting(true);
        try {
            if (editingCompany) {
                await api.updateCompany(editingCompany.id, companyForm);
                setSuccess(`"${companyForm.name}" updated`); autoHide(setSuccess);
            } else if (companyForm.data_source === 'excel') {
                // Excel upload flow
                if (!excelFile) { setError('Please select an Excel file'); autoHide(setError); setSubmitting(false); return; }
                const formData = new FormData();
                formData.append('file', excelFile);
                formData.append('name', companyForm.name);
                formData.append('industry', companyForm.industry || '');
                formData.append('ticker_symbol', companyForm.ticker_symbol || '');
                formData.append('fiscal_year_end', companyForm.fiscal_year_end || 'December');
                formData.append('region', companyForm.region || '');
                setUploading(true);
                await api.uploadCompanyExcel(formData);
                setUploading(false);
                setExcelFile(null);
                setSuccess(`"${companyForm.name}" created from Excel`); autoHide(setSuccess);
            } else if (companyForm.data_source === 'api') {
                // API connection flow
                if (!apiConfig.api_url.trim()) { setError('API Base URL is required'); autoHide(setError); setSubmitting(false); return; }
                await api.connectCompanyApi({
                    name: companyForm.name,
                    industry: companyForm.industry,
                    ticker_symbol: companyForm.ticker_symbol,
                    fiscal_year_end: companyForm.fiscal_year_end,
                    region: companyForm.region,
                    ...apiConfig
                });
                setApiConfig({ api_url: '', api_key: '', endpoint_path: '' });
                setSuccess(`"${companyForm.name}" connected via API`); autoHide(setSuccess);
            } else {
                // Manual flow
                await api.createCompany({ ...companyForm, metadata: {} });
                setSuccess(`"${companyForm.name}" created`); autoHide(setSuccess);
            }
            setShowCompanyForm(false);
            await fetchCompanies();
        } catch (e) {
            setUploading(false);
            setError(e.message || 'Failed to save company'); autoHide(setError);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCompany = async (id, name) => {
        if (!confirm(`Delete company "${name}"? All associated data will be lost.`)) return;
        try {
            await api.deleteCompany(id);
            await fetchCompanies();
            setSelectedCompanyIds(prev => prev.filter(sid => sid !== id));
            setSuccess(`"${name}" deleted`); autoHide(setSuccess);
        } catch (e) {
            setError(e.message || 'Failed to delete company'); autoHide(setError);
        }
    };

    const toggleCompanySelect = (id) => {
        setSelectedCompanyIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCompanyIds.length === companies.length) {
            setSelectedCompanyIds([]);
        } else {
            setSelectedCompanyIds(companies.map(c => c.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCompanyIds.length === 0) return;
        const count = selectedCompanyIds.length;
        if (!confirm(`Delete ${count} selected compan${count > 1 ? 'ies' : 'y'}? All associated data will be permanently lost.`)) return;
        try {
            await Promise.all(selectedCompanyIds.map(id => api.deleteCompany(id)));
            setSelectedCompanyIds([]);
            await fetchCompanies();
            setSuccess(`${count} compan${count > 1 ? 'ies' : 'y'} deleted successfully`); autoHide(setSuccess);
        } catch (e) {
            setError(e.message || 'Failed to delete some companies'); autoHide(setError);
            await fetchCompanies();
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789!@#$%';
        let pw = '';
        for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
        setNewUser(p => ({ ...p, password: pw }));
    };

    // ── Registration Management ──
    const fetchRegistrations = async () => {
        try {
            const data = await api.getRegistrations(regFilter);
            setRegistrations(data);
        } catch (err) {
            console.error('Failed to fetch registrations:', err);
        }
    };

    useEffect(() => {
        if (tab === 'registrations') fetchRegistrations();
    }, [regFilter, tab]);

    const handleApproveReg = async (id) => {
        if (!confirm('Approve this registration? A user account will be created and credentials emailed.')) return;
        setSubmitting(true);
        try {
            const data = await api.approveRegistration(id);
            setCreatedCreds({
                email: data.email,
                password: data.temp_password,
                full_name: data.full_name
            });
            setSuccess('Registration approved — credentials sent!');
            fetchRegistrations();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectReg = async (id) => {
        const notes = rejectNotes[id] || '';
        if (!confirm(`Reject this registration? ${notes ? '\n\nNotes: ' + notes : ''}`)) return;
        setSubmitting(true);
        try {
            await api.rejectRegistration(id, notes);
            setSuccess('Registration rejected.');
            setRejectNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
            fetchRegistrations();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendEmail = async (id) => {
        setSubmitting(true);
        try {
            const updatedReg = await api.resendRegistrationEmail(id);
            setCreatedCreds({
                email: updatedReg.email,
                password: updatedReg.temp_password,
                full_name: updatedReg.full_name
            });
            setSuccess('Credentials resent successfully');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-slate-600 focus:border-primary/50 outline-none transition-all";
    const selectClass = inputClass + " custom-select cursor-pointer";

    if (loading) return (
        <div className="min-h-screen bg-[#060E1F] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <AdminGuard>
            <div className="min-h-screen bg-[#060E1F]">
                <Navbar onCommand={() => { }} userName={user?.full_name || 'Admin'} onLogout={() => { window.location.href = '/login'; }} />
                <Sidebar
                    onSelectClient={(id) => {
                        setTab('companies');
                        // In a real app we might scroll to or highlight the client
                    }}
                    selectedClientIds={[]}
                    onAddClient={() => {
                        setTab('companies');
                        openNewCompany();
                    }}
                    onCompare={() => { }}
                    activeNav="admin"
                />

                <main className="pt-24 pb-16 px-8 transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? 72 : 280 }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <a href="/" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                                <ArrowLeft size={18} />
                            </a>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Shield size={24} className="text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-white font-titles tracking-tight">Admin Panel</h1>
                                <p className="text-xs text-slate-500 font-body uppercase tracking-widest">Configuration & Access Management</p>
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-in slide-in-from-top-2">
                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                            <p className="text-xs text-red-400 font-medium">{error}</p>
                            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300"><X size={14} /></button>
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 animate-in slide-in-from-top-2">
                            <Check size={14} className="text-green-400 shrink-0" />
                            <p className="text-xs text-green-400 font-medium">{success}</p>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8">
                        {[
                            { id: 'users', label: 'User Management', icon: Users },
                            { id: 'companies', label: 'Company Management', icon: Building2 },
                            { id: 'registrations', label: 'Registrations', icon: ClipboardList },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tab === t.id
                                    ? 'bg-primary text-[#0B1A39]'
                                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                                    }`}
                            >
                                <t.icon size={14} /> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ===== USER MANAGEMENT TAB ===== */}
                    {tab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-400">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
                                <div className="flex items-center gap-3">
                                    {selectedUserIds.length > 0 && (
                                        <button
                                            onClick={handleBulkDeleteUsers}
                                            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            <Trash2 size={14} /> Delete Selected ({selectedUserIds.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setShowCreateUser(true); setCreatedCreds(null); }}
                                        className="flex items-center gap-2 bg-primary hover:bg-[#FFC040] text-[#0B1A39] px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                    >
                                        <Plus size={14} /> Create User
                                    </button>
                                </div>
                            </div>

                            {/* Create User Form */}
                            {showCreateUser && (
                                <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white font-titles">Create New User Account</h3>
                                        <button onClick={() => setShowCreateUser(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Full Name</label>
                                            <input value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Email *</label>
                                            <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="user@company.com" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center justify-between">
                                                Password *
                                                <button onClick={generatePassword} className="text-primary hover:text-[#FFC040] normal-case tracking-normal">Generate</button>
                                            </label>
                                            <div className="relative">
                                                <input type={showPassword ? 'text' : 'password'} value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" className={inputClass + ' pr-10'} />
                                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Role</label>
                                            <select
                                                value={newUser.role || 'readonly'}
                                                onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                                                className={selectClass}
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={() => setShowCreateUser(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={handleCreateUser} className="flex items-center gap-2 bg-primary hover:bg-[#FFC040] text-[#0B1A39] px-6 py-2 rounded-xl text-xs font-extrabold uppercase transition-all">
                                            <Plus size={14} /> Create Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Credentials Card */}
                            {createdCreds && (
                                <div className="glass-panel rounded-2xl p-5 border border-primary/30 bg-primary/5 space-y-3 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-primary font-titles">✅ Credentials — Share with user</h4>
                                        <button onClick={() => setCreatedCreds(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {createdCreds.full_name && (
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Name</p>
                                                <p className="text-sm text-white">{createdCreds.full_name}</p>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email</p>
                                                <p className="text-sm text-white">{createdCreds.email}</p>
                                            </div>
                                            <button onClick={() => copyText(createdCreds.email, 'email')} className="mt-3 text-slate-400 hover:text-primary">
                                                {copied === 'email' ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Password</p>
                                                <p className="text-sm text-white font-mono">{createdCreds.password}</p>
                                            </div>
                                            <button onClick={() => copyText(createdCreds.password, 'password')} className="mt-3 text-slate-400 hover:text-primary">
                                                {copied === 'password' ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Users Table */}
                            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/3">
                                            <th className="pl-5 pr-2 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={users.filter(u => u.role !== 'admin').length > 0 && selectedUserIds.length === users.filter(u => u.role !== 'admin').length}
                                                    onChange={toggleSelectAllUsers}
                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary cursor-pointer"
                                                    title="Select all non-admin users"
                                                />
                                            </th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className={`border-b border-white/5 last:border-0 transition-colors ${selectedUserIds.includes(u.id) ? 'bg-primary/5' : 'hover:bg-white/3'}`}>
                                                <td className="pl-5 pr-2 py-3.5 w-10">
                                                    {u.role !== 'admin' ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUserIds.includes(u.id)}
                                                            onChange={() => toggleUserSelect(u.id)}
                                                            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary cursor-pointer"
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4" />
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                            {(u.full_name || u.email).charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium text-white">{u.full_name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-slate-400">{u.email}</td>
                                                <td className="px-5 py-3.5">
                                                    <select
                                                        value={u.role}
                                                        onChange={e => handleUpdateRole(u.id, e.target.value)}
                                                        className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-widest border cursor-pointer transition-all ${u.role === 'admin'
                                                            ? 'bg-primary/15 text-primary border-primary/30'
                                                            : u.role === 'manager'
                                                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                                                : u.role === 'analyst'
                                                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                                    : 'bg-slate-700/50 text-slate-400 border-white/10'
                                                            }`}
                                                    >
                                                        {ROLES.map(r => (
                                                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${u.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                                                        }`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {u.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== COMPANY MANAGEMENT TAB ===== */}
                    {tab === 'companies' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-400">{companies.length} registered compan{companies.length !== 1 ? 'ies' : 'y'}</p>
                                <div className="flex items-center gap-3">
                                    {selectedCompanyIds.length > 0 && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            <Trash2 size={14} /> Delete Selected ({selectedCompanyIds.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={openNewCompany}
                                        className="flex items-center gap-2 bg-primary hover:bg-[#FFC040] text-[#0B1A39] px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                    >
                                        <Plus size={14} /> Add Company
                                    </button>
                                </div>
                            </div>

                            {/* Company Form */}
                            {showCompanyForm && (
                                <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white font-titles">{editingCompany ? 'Edit Company' : 'Add New Company'}</h3>
                                        <button onClick={() => setShowCompanyForm(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Company Name *</label>
                                            <input value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Acme Corp" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Industry</label>
                                            <select value={companyForm.industry} onChange={e => setCompanyForm(p => ({ ...p, industry: e.target.value }))} className={selectClass}>
                                                <option value="">Select</option>
                                                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Ticker</label>
                                            <input value={companyForm.ticker_symbol} onChange={e => setCompanyForm(p => ({ ...p, ticker_symbol: e.target.value }))} placeholder="e.g. ACME" className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Region</label>
                                            <input value={companyForm.region} onChange={e => setCompanyForm(p => ({ ...p, region: e.target.value }))} placeholder="e.g. North America" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Fiscal Year End</label>
                                            <select value={companyForm.fiscal_year_end} onChange={e => setCompanyForm(p => ({ ...p, fiscal_year_end: e.target.value }))} className={selectClass}>
                                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m} style={optionStyle}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Data Source</label>
                                            <div className="flex gap-2 h-[42px]">
                                                {[
                                                    { value: 'manual', label: 'Enter Manually', Icon: Edit3 },
                                                    { value: 'excel', label: 'Upload Excel', Icon: FileSpreadsheet },
                                                    { value: 'api', label: 'API', Icon: Globe }
                                                ].map(src => (
                                                    <button key={src.value} type="button" onClick={() => { setCompanyForm(p => ({ ...p, data_source: src.value })); setExcelFile(null); }}
                                                        className={`flex-1 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${companyForm.data_source === src.value ? 'bg-primary/20 border-primary/60 text-primary' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                                                    ><src.Icon size={12} /> {src.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ——— Data Source Sections ——— */}
                                    {companyForm.data_source === 'excel' && !editingCompany && (
                                        <div className="border border-dashed border-white/10 rounded-xl p-5 space-y-3">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Upload size={14} className="text-primary" />
                                                <span className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Upload Financial Data (Excel / CSV)</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 px-4 cursor-pointer hover:border-primary/30 transition-all group">
                                                    <FileSpreadsheet size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
                                                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                                        {excelFile ? excelFile.name : 'Click to select .xlsx, .xls, or .csv file'}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept=".xlsx,.xls,.csv"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const f = e.target.files[0];
                                                            if (!f) return;
                                                            const ext = f.name.split('.').pop().toLowerCase();
                                                            if (!['xlsx', 'xls', 'csv'].includes(ext)) {
                                                                setError('Only .xlsx, .xls, and .csv files are allowed'); autoHide(setError); return;
                                                            }
                                                            if (f.size > 5 * 1024 * 1024) {
                                                                setError('File is too large. Maximum size is 5MB.'); autoHide(setError); return;
                                                            }
                                                            setExcelFile(f);
                                                        }}
                                                    />
                                                </label>
                                                {excelFile && (
                                                    <button onClick={() => setExcelFile(null)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors" title="Remove file">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            {excelFile && (
                                                <p className="text-[10px] text-slate-500">
                                                    📎 {excelFile.name} — {(excelFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            )}
                                            <p className="text-[10px] text-slate-600">Accepted: .xlsx, .xls, .csv • Max 5MB</p>
                                        </div>
                                    )}

                                    {companyForm.data_source === 'api' && !editingCompany && (
                                        <div className="border border-dashed border-white/10 rounded-xl p-5 space-y-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Globe size={14} className="text-primary" />
                                                <span className="font-bold uppercase tracking-widest text-[10px] text-slate-500">API Connection Configuration</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">API Base URL *</label>
                                                    <input
                                                        value={apiConfig.api_url}
                                                        onChange={e => setApiConfig(p => ({ ...p, api_url: e.target.value }))}
                                                        placeholder="https://api.example.com/v1"
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">API Key</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showApiKey ? 'text' : 'password'}
                                                            value={apiConfig.api_key}
                                                            onChange={e => setApiConfig(p => ({ ...p, api_key: e.target.value }))}
                                                            placeholder="sk-••••••••"
                                                            className={inputClass + ' pr-10'}
                                                        />
                                                        <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                                            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Endpoint Path</label>
                                                    <input
                                                        value={apiConfig.endpoint_path}
                                                        onChange={e => setApiConfig(p => ({ ...p, endpoint_path: e.target.value }))}
                                                        placeholder="/financials/quarterly"
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-600">API key is stored securely and never exposed in logs.</p>
                                        </div>
                                    )}

                                    {companyForm.data_source === 'manual' && !editingCompany && (
                                        <div className="border border-dashed border-white/10 rounded-xl p-4">
                                            <p className="text-[10px] text-slate-500 flex items-center gap-2">
                                                <Edit3 size={12} className="text-primary" />
                                                <span>Company data will be entered manually after creation.</span>
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={() => { setShowCompanyForm(false); setExcelFile(null); }} className="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
                                        <button
                                            onClick={handleSaveCompany}
                                            disabled={submitting || uploading || !companyForm.name.trim()}
                                            className="flex items-center gap-2 bg-primary hover:bg-[#FFC040] disabled:opacity-50 disabled:cursor-not-allowed text-[#0B1A39] px-6 py-2 rounded-xl text-xs font-extrabold uppercase transition-all"
                                        >
                                            {(submitting || uploading) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            {uploading ? 'Uploading...' : submitting ? 'Saving...' : editingCompany ? 'Save Changes' : 'Add Company'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Companies Table */}
                            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[900px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/3">
                                            <th className="pl-5 pr-2 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={companies.length > 0 && selectedCompanyIds.length === companies.length}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary cursor-pointer"
                                                    title="Select all"
                                                />
                                            </th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Company</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Industry</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ticker</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Region</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Source</th>
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {companies.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                                                    No companies yet. Click "Add Company" to create one.
                                                </td>
                                            </tr>
                                        ) : companies.map(c => (
                                            <tr key={c.id} className={`border-b border-white/5 last:border-0 transition-colors ${selectedCompanyIds.includes(c.id) ? 'bg-primary/5' : 'hover:bg-white/3'}`}>
                                                <td className="pl-5 pr-2 py-3.5 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCompanyIds.includes(c.id)}
                                                        onChange={() => toggleCompanySelect(c.id)}
                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                            {c.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-medium text-white">{c.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-slate-400">{c.industry || '—'}</td>
                                                <td className="px-5 py-3.5 text-sm text-slate-400 font-mono">{c.ticker_symbol || '—'}</td>
                                                <td className="px-5 py-3.5 text-sm text-slate-400">{c.region || '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest bg-slate-700/50 text-slate-400">{c.data_source || 'manual'}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right space-x-1">
                                                    <button onClick={() => openEditCompany(c)} className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Edit">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteCompany(c.id, c.name)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== REGISTRATIONS TAB ===== */}
                    {tab === 'registrations' && (
                        <div className="space-y-6">
                            {/* Filter Buttons */}
                            <div className="flex items-center gap-2">
                                {['pending', 'approved', 'rejected'].map(s => (
                                    <button key={s} onClick={() => setRegFilter(s)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${regFilter === s
                                            ? s === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                : s === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                                            }`}
                                    >
                                        {s === 'pending' && <Clock size={12} />}
                                        {s === 'approved' && <CheckCircle size={12} />}
                                        {s === 'rejected' && <XCircle size={12} />}
                                        {s}
                                    </button>
                                ))}
                                <span className="ml-2 text-xs text-slate-500">{registrations.length} result{registrations.length !== 1 ? 's' : ''}</span>
                            </div>

                            {/* Registrations Table */}
                            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
                                {registrations.length === 0 ? (
                                    <div className="p-12 text-center text-sm text-slate-500">No {regFilter} registrations found.</div>
                                ) : (
                                    <table className="w-full min-w-[1100px]">
                                        <thead>
                                            <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                <th className="text-left px-5 py-3">Photo</th>
                                                <th className="text-left px-5 py-3">Name</th>
                                                <th className="text-left px-5 py-3">Email</th>
                                                <th className="text-left px-5 py-3">Phone</th>
                                                <th className="text-left px-5 py-3">Dept</th>
                                                <th className="text-left px-5 py-3">Designation</th>
                                                <th className="text-left px-5 py-3">DOJ</th>
                                                <th className="text-left px-5 py-3">Submitted</th>
                                                {regFilter !== 'pending' && <th className="text-left px-5 py-3">Notes</th>}
                                                {regFilter === 'pending' && <th className="text-right px-5 py-3">Actions</th>}
                                                {regFilter === 'approved' && <th className="text-right px-5 py-3">Credentials</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {registrations.map(r => (
                                                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                                    <td className="px-5 py-3">
                                                        {r.photo_path ? (
                                                            <img src={`/uploads/photos/${r.photo_path.split(/[/\\]/).pop()}`} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Image size={14} className="text-slate-600" /></div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-white font-semibold">{r.full_name}</td>
                                                    <td className="px-5 py-3 text-xs text-slate-400">{r.email}</td>
                                                    <td className="px-5 py-3 text-xs text-slate-400">{r.phone}</td>
                                                    <td className="px-5 py-3 text-xs text-slate-400">{r.department || '—'}</td>
                                                    <td className="px-5 py-3 text-xs text-slate-400">{r.designation || '—'}</td>
                                                    <td className="px-5 py-3 text-xs text-slate-400">{r.date_of_joining || '—'}</td>
                                                    <td className="px-5 py-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                                                    {regFilter !== 'pending' && (
                                                        <td className="px-5 py-3 text-xs text-slate-400 max-w-[150px] truncate" title={r.admin_notes}>
                                                            {r.admin_notes || '—'}
                                                        </td>
                                                    )}
                                                    {regFilter === 'pending' && (
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add remarks..."
                                                                    value={rejectNotes[r.id] || ''}
                                                                    onChange={(e) => setRejectNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                                                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white placeholder:text-slate-600 outline-none focus:border-primary/30 w-32"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleApproveReg(r.id)}
                                                                        disabled={submitting}
                                                                        className="flex items-center gap-1 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-40"
                                                                    >
                                                                        <CheckCircle size={12} /> Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectReg(r.id)}
                                                                        disabled={submitting}
                                                                        className="flex items-center gap-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-40"
                                                                    >
                                                                        <XCircle size={12} /> Reject
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {regFilter === 'approved' && (
                                                        <td className="px-5 py-3 text-right">
                                                            <button
                                                                onClick={() => handleResendEmail(r.id)}
                                                                disabled={submitting}
                                                                className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-40 ml-auto"
                                                            >
                                                                <Mail size={12} /> Resend Email
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AdminGuard>
    );
}
