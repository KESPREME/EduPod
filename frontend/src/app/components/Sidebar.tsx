"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings, Menu, X, LogOut, Plus, Sun, Moon } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Consume Context
    const { toggleTheme, preferences } = useSettings();
    const { user, isGuest, signOut } = useAuth();

    const displayUser = user ? {
        name: isGuest ? "Guest User" : user.user_metadata?.full_name || user.email?.split('@')[0] || "Student",
        email: user.email || "",
        avatar: user.user_metadata?.avatar_url || ""
    } : { name: "Loading...", email: "", avatar: "" };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/home" },
        { icon: BookOpen, label: "My Library", href: "/library" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleLogout = async () => {
        await signOut();
        router.push("/");
    };

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={toggleSidebar}
                className="touch-target md:hidden fixed z-50 top-3 left-3 w-11 h-11 flex items-center justify-center bg-[var(--primary)] border-2 border-[var(--border-main)] shadow-[var(--shadow-block)] active:translate-y-[2px] active:shadow-none transition-all"
                aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-64 bg-[var(--bg-sidebar)] border-r-2 border-[var(--border-main)] transition-transform duration-300 ease-in-out flex flex-col
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0 md:sticky md:top-0 md:flex
            `}>
                {/* Branding */}
                <div className="h-20 flex flex-shrink-0 items-center px-5 sm:px-6 border-b-2 border-[var(--border-main)] bg-[var(--primary)]">
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-black">EduPod.</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    touch-target flex items-center gap-3 px-4 py-3 font-bold border-2 border-[var(--border-main)] transition-all
                                    ${isActive
                                        ? "bg-[var(--secondary)] text-[var(--text-on-secondary)] shadow-[0_0_20px_var(--secondary)] border-[var(--secondary)] translate-x-[-2px] translate-y-[-2px]"
                                        : "bg-[var(--bg-card)] text-[var(--text-main)] hover-glow hover:text-black hover:bg-[var(--primary)] hover:translate-x-[-2px] hover:translate-y-[-2px]"}
                                `}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="pt-8 flex flex-col gap-4">
                        <Link href="/create" className="touch-target w-full btn-neo flex items-center justify-center gap-2 hover:bg-[#FFDE59] hover:text-black active:bg-[#5E17EB] active:text-white transition-colors">
                            <Plus size={20} />
                            <span>New Lesson</span>
                        </Link>
                    </div>
                </nav>

                {/* Footer User Profile & Theme Toggle */}
                <div className="p-4 sm:p-6 border-t-2 border-[var(--border-main)] bg-[var(--bg-main)] flex-shrink-0 flex flex-col gap-4">

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="touch-target flex items-center justify-between w-full p-2 rounded border-2 border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-main)] transition-all group"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                            {preferences.darkMode ? "Light Mode" : "Dark Mode"}
                        </span>
                        <div className="relative w-10 h-6">
                            {preferences.darkMode ? (
                                <Sun className="w-5 h-5 text-[var(--text-main)] absolute right-0 animate-spin-slow" />
                            ) : (
                                <Moon className="w-5 h-5 text-[var(--text-main)] absolute right-0" />
                            )}
                        </div>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--text-main)] flex-shrink-0 overflow-hidden flex items-center justify-center border-2 border-[var(--border-main)]">
                            {displayUser.avatar ? (
                                <Image
                                    src={displayUser.avatar}
                                    alt="Avatar"
                                    width={40}
                                    height={40}
                                    sizes="40px"
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <span className="text-[var(--bg-main)] font-black text-lg">{displayUser.name?.charAt(0) || "-"}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-[var(--text-main)]">{displayUser.name}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate">{isGuest ? "Guest Session" : "Free Plan"}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="touch-target p-2 hover:bg-[var(--bg-card)] rounded border-2 border-transparent hover:border-[var(--border-main)] transition-all text-[var(--text-main)]"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
