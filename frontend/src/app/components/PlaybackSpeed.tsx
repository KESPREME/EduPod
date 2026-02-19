"use client";

import React, { useState, useEffect } from "react";
import { Gauge } from "lucide-react";

interface PlaybackSpeedProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    theaterMode?: boolean;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

const PlaybackSpeed: React.FC<PlaybackSpeedProps> = ({ audioRef, theaterMode = false }) => {
    const [speed, setSpeed] = useState(1);
    const [isOpen, setIsOpen] = useState(false);

    // Load saved preference
    useEffect(() => {
        const saved = localStorage.getItem("edupod_playback_speed");
        if (saved) {
            const savedSpeed = parseFloat(saved);
            setSpeed(savedSpeed);
            if (audioRef.current) {
                audioRef.current.playbackRate = savedSpeed;
            }
        }
    }, [audioRef]);

    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        localStorage.setItem("edupod_playback_speed", newSpeed.toString());
        if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 font-bold text-xs cursor-pointer select-none transition-opacity duration-150 hover:opacity-80 active:opacity-60 ${theaterMode
                    ? "bg-black/50 text-white border-white/50"
                    : "bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-main)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    }`}
                title="Playback Speed"
            >
                <Gauge size={16} />
                <span>{speed}x</span>
            </button>

            {isOpen && (
                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col p-1 rounded-lg border-2 z-[200] min-w-[80px] shadow-xl ${theaterMode
                    ? "bg-black border-[var(--primary)] shadow-[0_0_20px_var(--primary)]"
                    : "bg-[var(--bg-card)] border-[var(--border-main)]"
                    }`}>
                    {speeds.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSpeedChange(s);
                            }}
                            className={`px-3 py-2 text-xs font-bold rounded cursor-pointer select-none transition-opacity hover:opacity-80 ${theaterMode
                                ? (speed === s ? 'bg-[var(--primary)] text-black' : 'text-white')
                                : (speed === s ? 'bg-[var(--primary)] text-black' : 'text-[var(--text-main)]')
                                }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlaybackSpeed;
