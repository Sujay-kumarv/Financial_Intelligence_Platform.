"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard that restricts access to admin-only pages.
 * - While loading auth state → shows a minimal loading screen
 * - If not authenticated → redirects to /login
 * - If authenticated but not admin → redirects to / (dashboard)
 * - If admin → renders children normally
 *
 * Usage:
 *   <AdminGuard>
 *     <AdminPageContent />
 *   </AdminGuard>
 */
export default function AdminGuard({ children }) {
    const { role, loading, isAuthenticated } = useAuth();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        if (loading) return; // still resolving auth state

        if (!isAuthenticated) {
            // No valid token — send to login
            window.location.href = '/login';
            return;
        }

        if (role !== 'admin') {
            // Authenticated but not admin — send to dashboard (NOT logout)
            window.location.href = '/';
            return;
        }

        // Admin confirmed
        setAllowed(true);
    }, [loading, isAuthenticated, role]);

    // Show minimal loading while auth resolves (avoids flash of content)
    if (loading || !allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1A39]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                        Verifying access...
                    </p>
                </div>
            </div>
        );
    }

    return children;
}
