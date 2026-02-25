"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

/**
 * Phase 1 — Role Detection (Non-Destructive)
 * 
 * Provides global auth state: { user, role, loading, isAuthenticated }
 * - Reads user from /me API on mount (if token exists)
 * - Fallback role = 'readonly' for safety
 * - Does NOT restrict any UI — purely awareness layer
 */

const AuthContext = createContext({
    user: null,
    role: 'readonly',
    loading: true,
    isAuthenticated: false,
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState('readonly'); // safe default
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchUser = async () => {
        try {
            const userData = await api.getUserMe();
            setUser(userData);
            setRole(userData.role || 'readonly');
            setIsAuthenticated(true);
        } catch (err) {
            // Token invalid or expired — clear and fall through
            console.warn('AuthContext: failed to fetch user, using readonly fallback', err);
            setUser(null);
            setRole('readonly');
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('fin_intel_token')
            : null;

        if (!token) {
            setLoading(false);
            return;
        }

        fetchUser();
    }, []);

    const value = { user, role, loading, isAuthenticated, refreshUser: fetchUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth state from any component.
 * Usage: const { user, role, loading, isAuthenticated } = useAuth();
 */
export function useAuth() {
    return useContext(AuthContext);
}
