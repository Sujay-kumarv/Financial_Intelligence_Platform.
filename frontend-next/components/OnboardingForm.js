import React, { useState } from 'react';
import { X, Upload, Check, FileText, Globe, Building2, User, Plus, ChevronRight, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = [
    'Fintech', 'Banking', 'Insurance', 'Asset Management',
    'Investment Banking', 'Private Equity', 'Consumer Finance',
    'Financial Technology', 'Commercial Banking', 'Real Estate',
    'Healthcare', 'Technology', 'Manufacturing', 'Retail', 'Energy',
];

export default function OnboardingForm({ isOpen, onClose, onSuccess }) {
    const { role } = useAuth();
    const isReadOnly = role !== 'admin';
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        region: '',
        ticker_symbol: '',
        fiscal_year_end: 'December',
        data_source: 'manual',
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            const ext = uploadedFile.name.split('.').pop().toLowerCase();
            if (ext === 'pdf') {
                setFormData(prev => ({ ...prev, data_source: 'pdf' }));
            } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
                setFormData(prev => ({ ...prev, data_source: 'excel' }));
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Client name is required.');
            return;
        }
        if (!formData.ticker_symbol.trim()) {
            setError('Ticker symbol is required for analysis.');
            return;
        }
        if (formData.data_source === 'api' && !formData.api_url?.trim()) {
            setError('API URL is required for API data source.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            let company;

            if (formData.data_source === 'api') {
                // Use the specialized connect-api endpoint
                company = await api.connectCompanyApi({
                    name: formData.name.trim(),
                    industry: formData.industry || null,
                    ticker_symbol: formData.ticker_symbol || null,
                    fiscal_year_end: formData.fiscal_year_end || null,
                    region: formData.region || null,
                    api_url: formData.api_url.trim(),
                    api_key: formData.api_key?.trim() || null
                });
            } else {
                // Standard manual/excel creation
                const payload = {
                    name: formData.name.trim(),
                    industry: formData.industry || null,
                    region: formData.region || null,
                    ticker_symbol: formData.ticker_symbol || null,
                    fiscal_year_end: formData.fiscal_year_end || null,
                    data_source: formData.data_source,
                    metadata: {},
                };

                company = await api.createCompany(payload);
            }

            // If a file was selected, upload it for this company
            if (file) {
                try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('company_id', company.id);
                    fd.append('statement_type', 'income_statement');
                    fd.append('period_start', '2024-01-01');
                    fd.append('period_end', '2024-12-31');
                    await api.uploadFile(fd);
                } catch (uploadErr) {
                    console.warn('Company created but file upload failed:', uploadErr);
                    // We don't block success if upload fails, as client can upload later
                }
            }

            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Failed to create client:', err);
            setError(err.message || 'Failed to create client. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', industry: '', region: '', ticker_symbol: '', fiscal_year_end: 'December', data_source: 'manual' });
        setFile(null);
        setError('');
        onClose();
    };

    const inputClass = `w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:border-primary/60 focus:bg-white/8 outline-none transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B1A39]/80 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-xl glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 pt-7 pb-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white font-titles tracking-tight">Onboard New Client</h3>
                            <p className="text-[10px] text-slate-500 font-body uppercase tracking-widest mt-0.5">Initialize intelligence for a new entity</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Read-Only Banner */}
                {isReadOnly && (
                    <div className="mx-8 mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Lock size={14} className="shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-widest">Read-Only Access</span>
                        <span className="text-[10px] text-amber-400/70 ml-1">— Contact an admin to make changes</span>
                    </div>
                )}

                {/* Form */}
                <div className="p-8 space-y-5">
                    {/* Row 1 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                <Building2 size={11} /> Client Name *
                            </label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Acme Financial"
                                className={inputClass}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                <FileText size={11} /> Ticker Symbol
                            </label>
                            <input
                                name="ticker_symbol"
                                value={formData.ticker_symbol}
                                onChange={handleInputChange}
                                placeholder="e.g. ACME"
                                className={inputClass}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Industry</label>
                            <select
                                name="industry"
                                value={formData.industry}
                                onChange={handleInputChange}
                                className={inputClass + ' custom-select cursor-pointer'}
                                disabled={isReadOnly}
                            >
                                <option value="">Select Industry</option>
                                {INDUSTRIES.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                <Globe size={11} /> Region
                            </label>
                            <input
                                name="region"
                                value={formData.region}
                                onChange={handleInputChange}
                                placeholder="e.g. North America"
                                className={inputClass}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fiscal Year End</label>
                            <select
                                name="fiscal_year_end"
                                value={formData.fiscal_year_end}
                                onChange={handleInputChange}
                                className={inputClass + ' custom-select cursor-pointer'}
                                disabled={isReadOnly}
                            >
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Data Source</label>
                            <div className="flex gap-2 h-[46px]">
                                {['manual', 'excel', 'pdf', 'api'].map(src => (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, data_source: src }))}
                                        disabled={isReadOnly}
                                        className={`flex-1 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''} ${formData.data_source === src
                                            ? 'bg-primary/20 border-primary/60 text-primary'
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                                            }`}
                                    >
                                        {src}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Conditional API Source Fields */}
                    {formData.data_source === 'api' && (
                        <div className="grid grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Globe size={11} /> API Base URL
                                </label>
                                <input
                                    name="api_url"
                                    value={formData.api_url || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://api.example.com/v1"
                                    className={inputClass}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Lock size={11} /> API Key / Token
                                </label>
                                <input
                                    type="password"
                                    name="api_key"
                                    value={formData.api_key || ''}
                                    onChange={handleInputChange}
                                    placeholder="sk-..."
                                    className={inputClass}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    )}

                    {/* Optional File Upload - Show description based on data source */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {(formData.data_source === 'excel' || formData.data_source === 'pdf') ? `Financial Statements (Required for ${formData.data_source.toUpperCase()} Source)` : 'Financial Statements (Optional)'}
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 rounded-xl border border-dashed transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${file
                            ? 'border-primary/50 bg-primary/5 text-primary'
                            : 'border-white/10 bg-white/3 text-slate-500 hover:border-white/20 hover:text-slate-400'
                            }`}>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".csv,.xlsx,.xls,.pdf" disabled={isReadOnly} />
                            <Upload size={16} className="shrink-0" />
                            <span className="text-xs font-medium truncate">
                                {file ? file.name : (formData.data_source === 'excel'
                                    ? 'Attach Excel or CSV file'
                                    : 'Attach CSV, Excel, or PDF — you can also upload later')}
                            </span>
                            {file && <Check size={14} className="shrink-0 ml-auto" />}
                        </label>
                        {formData.data_source === 'api' && !file && (
                            <p className="text-[10px] text-slate-500 italic px-1">Connect your API or upload a sample PDF for structural mapping.</p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !formData.name.trim() || isReadOnly}
                            className="flex items-center gap-2 bg-primary hover:bg-[#FFC040] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B1A39] px-8 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Creating…
                                </span>
                            ) : (
                                <>
                                    Add Client <ChevronRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
