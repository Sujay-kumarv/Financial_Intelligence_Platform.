"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'USD ($)', locale: 'en-US' },
    { code: 'INR', symbol: '₹', label: 'INR (₹)', locale: 'en-IN' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)', locale: 'en-EU' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)', locale: 'en-GB' },
    { code: 'JPY', symbol: '¥', label: 'JPY (¥)', locale: 'ja-JP' },
];

export const UNITS = [
    { id: 'M', label: 'Millions (M)', factor: 1_000_000 },
    { id: 'K', label: 'Thousands (K)', factor: 1_000 },
    { id: 'Cr', label: 'Crores (Cr)', factor: 10_000_000 },
    { id: 'L', label: 'Lakhs (L)', factor: 100_000 },
    { id: 'Full', label: 'Full Value', factor: 1 },
];

export const THEMES = [
    { id: 'deep-sea', label: 'Deep Sea (Dark)', colors: { primary: '#FFB300', bg: '#060E1F' } },
    { id: 'arctic', label: 'Arctic (Light)', colors: { primary: '#D4A017', bg: '#F8FAFC' } },
    { id: 'neural', label: 'Neural (Glass)', colors: { primary: '#FFB300', bg: 'transparent' } },
];

const DEFAULT_SETTINGS = {
    financial: {
        currency: 'USD',
        unit: 'M',
        decimals: 1,
        fiscalYearStart: 'April',
    },
    visual: {
        theme: 'deep-sea',
        sidebarCollapsed: false,
        glassmorphism: true,
    },
    intelligence: {
        healthThreshold: 40,
        riskAlertsEnabled: true,
        aiInsightFrequency: 'Real-time',
    },
    notifications: {
        email: true,
        inApp: true,
        slack: false,
    }
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    // Initial load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('app_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings(prev => ({
                    ...prev,
                    ...parsed,
                    // Ensure nested objects are merged
                    financial: { ...prev.financial, ...parsed.financial },
                    visual: { ...prev.visual, ...parsed.visual },
                    intelligence: { ...prev.intelligence, ...parsed.intelligence },
                    notifications: { ...prev.notifications, ...parsed.notifications },
                }));
            } catch (e) {
                console.error('Failed to parse settings');
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever settings change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('app_settings', JSON.stringify(settings));
            applyTheme(settings.visual.theme);
        }
    }, [settings, isLoaded]);

    const applyTheme = (themeId) => {
        const root = document.documentElement;
        root.setAttribute('data-theme', themeId);
        // Additional logic for theme-specific CSS variables can go here
    };

    const updateSettings = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    const resetSettings = () => setSettings(DEFAULT_SETTINGS);

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSettings,
            resetSettings,
            isLoaded,
            isSettingsOpen,
            openSettings,
            closeSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
