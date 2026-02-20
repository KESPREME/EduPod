"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import HelpModal from "../components/HelpModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <div className="responsive-page flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans transition-colors duration-300">

            {/* Sidebar Component handles responsive behavior internally but we need a placeholder for desktop layout */}
            <Sidebar />

            {/* Help Modal */}
            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen relative w-full overflow-x-clip">

                {/* Header */}
                <header className="h-16 border-b-2 border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 ml-14 md:ml-0 transition-colors duration-300">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-tight text-[var(--text-muted)]">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span className="text-[var(--text-main)] truncate">Overview</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="touch-target w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center border-2 border-[var(--border-main)] rounded-full hover:bg-[var(--text-main)] hover:text-[var(--bg-card)] transition-colors text-[var(--text-main)] hover:scale-110 active:scale-95"
                            title="Help & Guide"
                        >
                            <span className="font-bold text-xs">?</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[url('/dot-grid.png')] bg-fixed">
                    {children}
                </div>

            </main>
        </div>
    );
}
