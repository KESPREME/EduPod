"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TranscriptViewProps {
    metadata: { host: string; content: string; duration: number }[] | null;
    currentTime: number;
    onSeek: (time: number) => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ metadata, currentTime, onSeek }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLDivElement>(null);

    if (!metadata) return null;

    // Calculate which segment is active
    let accumulatedTime = 0;
    const pauseDuration = 0.7;

    const segments = metadata.map((segment, index) => {
        const startTime = accumulatedTime;
        const isActive = currentTime >= startTime && currentTime < (startTime + segment.duration);
        accumulatedTime += segment.duration + pauseDuration;

        return { ...segment, index, startTime, isActive };
    });

    // Auto-scroll to active segment
    useEffect(() => {
        if (activeRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const activeEl = activeRef.current;

            // Simple center alignment
            const topPos = activeEl.offsetTop - container.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);

            container.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
        }
    }, [currentTime]); // Trigger on time update implies active segment change

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header commented out as it's handled by parent usually, but good to keep structure clean */}

            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 custom-scrollbar"
            >
                {segments.map((segment) => (
                    <motion.div
                        key={segment.index}
                        ref={segment.isActive ? activeRef : null}
                        initial={{ opacity: 0.5 }}
                        animate={{
                            opacity: segment.isActive ? 1 : 0.4,
                            scale: segment.isActive ? 1.02 : 1,
                            x: segment.isActive ? 4 : 0
                        }}
                        onClick={() => onSeek(segment.startTime)}
                        className={`
                            p-4 cursor-pointer transition-all duration-300 border-l-4 rounded-r-lg
                            ${segment.isActive
                                ? segment.host === 'host_1'
                                    ? 'border-[var(--secondary)] bg-[var(--secondary)]/10'
                                    : 'border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'border-transparent hover:bg-[var(--bg-main)]/50'
                            }
                        `}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <span className={`
                                text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm
                                ${segment.host === 'host_1'
                                    ? 'bg-[var(--secondary)] text-[var(--text-on-secondary)]'
                                    : 'bg-[var(--primary)] text-[var(--text-on-primary)]'
                                }
                            `}>
                                {segment.host === 'host_1' ? 'Professor' : 'Student'}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] font-mono">
                                {Math.floor(segment.startTime / 60)}:{String(Math.floor(segment.startTime % 60)).padStart(2, '0')}
                            </span>
                        </div>
                        <p className={`text-sm leading-relaxed text-[var(--text-main)] ${segment.isActive ? 'font-medium' : 'font-light'}`}>
                            {segment.content}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default TranscriptView;
