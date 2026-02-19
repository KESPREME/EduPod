"use client";

import React from "react";
import { User, Bell, Palette, ToggleRight, ToggleLeft } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

export default function SettingsPage() {
    const { user, preferences, updateUser, toggleTheme, updatePreferences } = useSettings();

    const SettingsSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <div className="card-swiss bg-[var(--bg-card)] p-6 mb-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[var(--border-main)]">
                <Icon className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
            </div>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );

    const Toggle = ({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: () => void }) => (
        <div className="flex items-center justify-between cursor-pointer group" onClick={onChange}>
            <div>
                <p className="font-bold">{label}</p>
                {description && <p className="text-sm text-[var(--text-muted)]">{description}</p>}
            </div>
            <button className={`transition-colors ${checked ? "text-[var(--secondary)]" : "text-[var(--text-muted)]"}`}>
                {checked ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Settings</h1>

            <SettingsSection title="Profile" icon={User}>
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[var(--text-main)] rounded-full border-2 border-[var(--border-main)] overflow-hidden flex items-center justify-center">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[var(--bg-main)] font-black text-2xl">{user.name.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <button className="btn-neo text-sm py-2 px-4 mb-2">Change Avatar</button>
                        <p className="text-xs text-[var(--text-muted)]">Recommended size: 400x400px</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 uppercase">Display Name</label>
                        <input
                            type="text"
                            value={user.name}
                            onChange={(e) => updateUser({ name: e.target.value })}
                            className="input-neo"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 uppercase">Email</label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="input-neo bg-[var(--bg-main)] text-[var(--text-muted)] cursor-not-allowed"
                        />
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="Appearance" icon={Palette}>
                <Toggle
                    label="Dark Mode"
                    description="Switch to a dark theme"
                    checked={preferences.darkMode}
                    onChange={toggleTheme}
                />
            </SettingsSection>

            <SettingsSection title="Notifications" icon={Bell}>
                <Toggle
                    label="Push Notifications"
                    description="Get notified when your lessons are ready"
                    checked={preferences.notifications}
                    onChange={() => updatePreferences({ notifications: !preferences.notifications })}
                />
                <Toggle
                    label="Email Digest"
                    description="Weekly summary of your learning progress"
                    checked={preferences.emailDigest}
                    onChange={() => updatePreferences({ emailDigest: !preferences.emailDigest })}
                />
            </SettingsSection>

            <SettingsSection title="Audio Generation" icon={ToggleRight}>
                <div className="space-y-4">
                    <p className="font-bold mb-2">Text-to-Speech Engine</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => updatePreferences({ ttsProvider: 'azure' })}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${preferences.ttsProvider === 'azure'
                                ? "border-[var(--secondary)] bg-[var(--secondary)] text-white shadow-[4px_4px_0px_0px_var(--text-main)]"
                                : "border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-main)]"
                                }`}
                        >
                            <div className="font-black uppercase">Azure Neural TTS 🎭</div>
                            <div className="text-xs opacity-80 mt-1">Emotional, expressive voices with SSML. Premium quality.</div>
                        </button>

                        <button
                            onClick={() => updatePreferences({ ttsProvider: 'edge' })}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${preferences.ttsProvider === 'edge'
                                ? "border-[var(--secondary)] bg-[var(--secondary)] text-white shadow-[4px_4px_0px_0px_var(--text-main)]"
                                : "border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-main)]"
                                }`}
                        >
                            <div className="font-black uppercase">Edge TTS (Cloud) ☁️</div>
                            <div className="text-xs opacity-80 mt-1">Microsoft cloud. Fast, reliable, free.</div>
                        </button>
                    </div>
                </div>
            </SettingsSection>

            <div className="text-center text-[var(--text-muted)] text-sm font-bold mt-12 mb-20">
                EduPod V2.2.0 • Build 2025.12.19
            </div>
        </div>
    );
}
