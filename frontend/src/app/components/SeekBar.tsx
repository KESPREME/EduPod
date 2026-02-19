"use client";

import React from "react";

interface SeekBarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    theaterMode?: boolean;
}

const formatTime = (seconds: number): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SeekBar: React.FC<SeekBarProps> = ({ currentTime, duration, onSeek, theaterMode = false }) => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        onSeek(percent * duration);
    };

    const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return;
        handleClick(e);
    };

    // Robust Colors
    // Theater Mode = Always White/Neon on Black/Transparent
    // Standard Mode = Theme aware
    const containerClasses = theaterMode
        ? "bg-black/50 border-white/30 backdrop-blur-sm"
        : "bg-[var(--bg-main)] border-[var(--text-main)]";

    const fillClasses = theaterMode
        ? "bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]"
        : "bg-[var(--text-main)]";

    const knobClasses = theaterMode
        ? "bg-white border-[var(--primary)] shadow-[0_0_15px_var(--primary)]"
        : "bg-[var(--text-main)] border-white";

    const textClasses = theaterMode
        ? "text-white text-shadow-sm font-bold"
        : "text-[var(--text-main)] font-bold";

    return (
        <div className="w-full space-y-2 select-none">
            {/* Progress bar Container */}
            <div
                className={`relative w-full h-4 border-2 cursor-pointer group rounded-full transition-all overflow-hidden ${containerClasses}`}
                onClick={handleClick}
                onMouseMove={handleDrag}
            >
                {/* Progress fill */}
                <div
                    className={`absolute top-0 left-0 h-full transition-all duration-75 ${fillClasses}`}
                    style={{ width: `${progress}%` }}
                />

                {/* Hover indicator (Knob) - Visible on hover/drag */}
                <div
                    className={`absolute top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-invert`}
                    style={{ left: `calc(${progress}% - 2px)` }}
                />
            </div>

            {/* Time display */}
            <div className={`flex justify-between text-xs font-mono uppercase tracking-wider ${textClasses}`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default SeekBar;
