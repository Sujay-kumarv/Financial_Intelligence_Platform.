"use client";
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../lib/SettingsContext';

/**
 * Client-side providers wrapper.
 * layout.js is a server component and cannot hold client state,
 * so we wrap children here with all client providers.
 */
export default function Providers({ children }) {
    return (
        <AuthProvider>
            <SettingsProvider>
                {children}
            </SettingsProvider>
        </AuthProvider>
    );
}
