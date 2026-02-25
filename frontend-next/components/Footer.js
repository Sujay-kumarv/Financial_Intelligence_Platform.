import React from 'react';
import { Sparkles, Globe, Shield, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full py-12 px-8 glass-panel border-t border-white/5 relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                <div className="flex flex-col items-center md:items-start gap-4">
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest font-titles">
                                Sujay Kumar <span className="text-primary">AI Studio</span>
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                Financial Decision Intelligence Platform
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm text-center md:text-left leading-relaxed font-body font-medium">
                        Empowering institutions with sovereign financial analytics and autonomous decision engines.
                        Crafted for the future of banking.
                    </p>
                </div>

                <div className="flex gap-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-extrabold text-white uppercase tracking-[0.2em]">Platform</h4>
                        <ul className="text-[11px] text-slate-500 font-bold space-y-2 uppercase tracking-wider">
                            <li className="hover:text-primary transition-colors cursor-pointer">Insights</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Portfolio</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Secure API</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-extrabold text-white uppercase tracking-[0.2em]">Legal</h4>
                        <ul className="text-[11px] text-slate-500 font-bold space-y-2 uppercase tracking-wider">
                            <li className="hover:text-primary transition-colors cursor-pointer">Security</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Compliance</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Privacy</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-6">
                    <div className="flex gap-4">
                        <SocialIcon icon={Linkedin} />
                        <SocialIcon icon={Twitter} />
                        <SocialIcon icon={Github} />
                    </div>
                    <div className="flex items-center gap-6 text-[10px] text-slate-600 font-extrabold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Shield size={12} /> Military Grade Encryption</span>
                        <span className="flex items-center gap-1.5"><Globe size={12} /> Studio Global Edge</span>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em] relative z-10 text-center md:text-left">
                <p>© 2026 Sujay Kumar AI Studio. All rights reserved.</p>
                <p className="mt-2 md:mt-0 italic opacity-50">Intelligent Partners for Smarter Decisions</p>
            </div>
        </footer>
    );
}

function SocialIcon({ icon: Icon }) {
    return (
        <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
            <Icon size={16} />
        </button>
    );
}
