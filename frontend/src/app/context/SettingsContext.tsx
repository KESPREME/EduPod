"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface UserProfile {
    name: string;
    email: string;
    avatar?: string;
}

interface Preferences {
    darkMode: boolean;
    notifications: boolean;
    emailDigest: boolean;
    ttsProvider: 'chatterbox' | 'melo' | 'edge';
}

interface SettingsContextType {
    user: UserProfile;
    preferences: Preferences;
    updateUser: (updates: Partial<UserProfile>) => void;
    toggleTheme: () => void;
    updatePreferences: (updates: Partial<Preferences>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Default State
    const [user, setUser] = useState<UserProfile>({
        name: "Student User",
        email: "student@edupod.ai"
    });

    const [preferences, setPreferences] = useState<Preferences>({
        darkMode: false,
        notifications: true,
        emailDigest: false,
        ttsProvider: 'chatterbox' // Default to Chatterbox TTS (Colab T4)
    });

    // Load from LocalStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("edupod_user");
        const storedPrefs = localStorage.getItem("edupod_prefs");

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedPrefs) {
            const parsed = JSON.parse(storedPrefs);
            setPreferences(parsed);
            // Apply Theme Immediately
            if (parsed.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }
    }, []);

    // Persist User
    const updateUser = (updates: Partial<UserProfile>) => {
        const newUser = { ...user, ...updates };
        setUser(newUser);
        localStorage.setItem("edupod_user", JSON.stringify(newUser));
    };

    // Toggle Theme
    const toggleTheme = () => {
        const newMode = !preferences.darkMode;
        const newPrefs = { ...preferences, darkMode: newMode };
        setPreferences(newPrefs);
        localStorage.setItem("edupod_prefs", JSON.stringify(newPrefs));

        if (newMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    };

    // Update other preferences
    const updatePreferences = (updates: Partial<Preferences>) => {
        const newPrefs = { ...preferences, ...updates };
        setPreferences(newPrefs);
        localStorage.setItem("edupod_prefs", JSON.stringify(newPrefs));
    };

    return (
        <SettingsContext.Provider value={{ user, preferences, updateUser, toggleTheme, updatePreferences }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
};
