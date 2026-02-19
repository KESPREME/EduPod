"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    if (!status) return null;

    const isError = status.toLowerCase().includes("error");
    const isCompleted = status.toLowerCase().includes("completed");
    const isProcessing = !isError && !isCompleted;

    // Determine colors based on intent
    let borderColor = "var(--border-main)";
    let bgColor = "var(--bg-main)";
    let textColor = "var(--text-main)";

    if (isProcessing) {
        borderColor = "var(--primary)";
        bgColor = "var(--bg-card)";
    } else if (isCompleted) {
        borderColor = "var(--secondary)"; // Green/Cyan
        bgColor = "var(--bg-card)";
    } else if (isError) {
        borderColor = "var(--accent)"; // Red/Magenta
        bgColor = "var(--bg-card)";
    }

    return (
        <div
            className="mt-6 p-4 inline-flex items-center space-x-3 transition-all border-2 shadow-[4px_4px_0px_0px_var(--shadow-color)]"
            style={{
                borderColor: borderColor,
                backgroundColor: bgColor,
                color: textColor
            }}
        >
            {isProcessing && <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />}
            {isCompleted && <CheckCircle2 className="w-6 h-6 text-[var(--secondary)]" />}
            {isError && <AlertCircle className="w-6 h-6 text-[var(--accent)]" />}

            <span className="font-black text-lg uppercase tracking-tight text-[var(--text-main)]">
                {status}
            </span>
        </div>
    );
};

export default StatusBadge;
