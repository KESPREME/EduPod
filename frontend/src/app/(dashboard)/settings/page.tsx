"use client";

import React from "react";
import Image from "next/image";
import { User, Bell, Palette, ToggleRight, ToggleLeft, type LucideIcon } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

interface SettingsSectionProps {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}

function SettingsSection({ title, icon: Icon, children }: SettingsSectionProps) {
    return (
        <div className="card-swiss bg-[var(--bg-card)] p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-4 border-b-2 border-[var(--border-main)]">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">{title}</h2>
            </div>
            <div className="space-y-5 sm:space-y-6">{children}</div>
        </div>
    );
}

interface ToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
    return (
        <button type="button" className="w-full flex items-center justify-between cursor-pointer group text-left" onClick={onChange}>
            <div className="pr-3">
                <p className="font-bold">{label}</p>
                {description && <p className="text-sm text-[var(--text-muted)]">{description}</p>}
            </div>
            <span className={`transition-colors ${checked ? "text-[var(--secondary)]" : "text-[var(--text-muted)]"}`}>
                {checked ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </span>
        </button>
    );
}

export default function SettingsPage() {
    const { user: settingsUser, preferences, updateUser, toggleTheme, updatePreferences } = useSettings();
    const { user: authUser, isGuest } = useAuth();
    const { showToast } = useToast();

    const displayUser = authUser
        ? {
            name: isGuest ? "Guest User" : authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Student",
            email: authUser.email || "guest@edupod.ai",
            avatar: authUser.user_metadata?.avatar_url || settingsUser.avatar,
        }
        : settingsUser;

    const handlePushNotificationToggle = async () => {
        if (!preferences.notifications) {
            // Turning it ON
            if (typeof window !== "undefined" && "Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    updatePreferences({ notifications: true });
                    showToast("Push notifications enabled.", "success");
                } else {
                    showToast("Permission denied for push notifications.", "error");
                    updatePreferences({ notifications: false });
                }
            } else {
                showToast("Push notifications are not supported by this browser.", "error");
            }
        } else {
            // Turning it OFF
            updatePreferences({ notifications: false });
            showToast("Push notifications disabled.", "info");
        }
    };

    const handleEmailDigestToggle = () => {
        if (!preferences.emailDigest) {
            // Turning it ON
            if (isGuest || !authUser) {
                showToast("Please sign in to subscribe to the email digest.", "error");
            } else {
                updatePreferences({ emailDigest: true });
                showToast(`Weekly email digest enabled for ${authUser.email}.`, "success");
            }
        } else {
            // Turning it OFF
            updatePreferences({ emailDigest: false });
            showToast("Email digest disabled.", "info");
        }
    };

    return (
        <div className="responsive-container max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-6 sm:mb-8">Settings</h1>

            <SettingsSection title="Profile" icon={User}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--text-main)] rounded-full border-2 border-[var(--border-main)] overflow-hidden flex items-center justify-center">
                        {displayUser.avatar ? (
                            <Image
                                src={displayUser.avatar}
                                alt="Avatar"
                                width={80}
                                height={80}
                                sizes="(max-width: 640px) 64px, 80px"
                                className="w-full h-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <span className="text-[var(--bg-main)] font-black text-xl sm:text-2xl">{displayUser.name.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <button className="touch-target btn-neo bg-[var(--bg-main)] text-[var(--text-main)] text-sm py-2 px-4 mb-2">Change Avatar</button>
                        <p className="text-xs text-[var(--text-muted)]">Recommended size: 400x400px</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 uppercase text-[var(--text-main)]">Display Name</label>
                        <input
                            type="text"
                            value={displayUser.name}
                            onChange={(e) => updateUser({ name: e.target.value })}
                            disabled={!isGuest && !!authUser}
                            className={`input-neo ${!isGuest && !!authUser ? "bg-[var(--bg-main)] text-[var(--text-muted)] cursor-not-allowed" : "text-[var(--text-main)]"}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 uppercase text-[var(--text-main)]">Email</label>
                        <input type="email" value={displayUser.email} disabled className="input-neo bg-[var(--bg-main)] text-[var(--text-muted)] cursor-not-allowed" />
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="Appearance" icon={Palette}>
                <Toggle label="Dark Mode" description="Switch to a dark theme" checked={preferences.darkMode} onChange={toggleTheme} />
            </SettingsSection>

            <SettingsSection title="Notifications" icon={Bell}>
                <Toggle
                    label="Push Notifications"
                    description="Get notified when your lessons are ready"
                    checked={preferences.notifications}
                    onChange={handlePushNotificationToggle}
                />
                <Toggle
                    label="Email Digest"
                    description="Weekly summary of your learning progress"
                    checked={preferences.emailDigest}
                    onChange={handleEmailDigestToggle}
                />
            </SettingsSection>

            <SettingsSection title="Audio Generation" icon={ToggleRight}>
                <div className="space-y-4">
                    <p className="font-bold mb-2">Text-to-Speech Engine</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => updatePreferences({ ttsProvider: "azure" })}
                            className={`touch-target p-4 border-2 rounded-lg text-left transition-all ${preferences.ttsProvider === "azure"
                                ? "border-[var(--secondary)] bg-[var(--secondary)] text-white shadow-[4px_4px_0px_0px_var(--text-main)]"
                                : "border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-main)]"
                                }`}
                        >
                            <div className="font-black uppercase">Azure Neural TTS</div>
                            <div className="text-xs opacity-80 mt-1">Emotional, expressive voices with SSML. Premium quality.</div>
                        </button>

                        <button
                            onClick={() => updatePreferences({ ttsProvider: "edge" })}
                            className={`touch-target p-4 border-2 rounded-lg text-left transition-all ${preferences.ttsProvider === "edge"
                                ? "border-[var(--secondary)] bg-[var(--secondary)] text-white shadow-[4px_4px_0px_0px_var(--text-main)]"
                                : "border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-main)]"
                                }`}
                        >
                            <div className="font-black uppercase">Edge TTS (Cloud)</div>
                            <div className="text-xs opacity-80 mt-1">Microsoft cloud. Fast, reliable, free.</div>
                        </button>
                    </div>
                </div>
            </SettingsSection>

            <div className="text-center text-[var(--text-muted)] text-sm font-bold mt-12 mb-20">EduPod V2.2.0 | Build 2025.12.19</div>
        </div>
    );
}
