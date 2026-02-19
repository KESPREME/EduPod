"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioSegment {
    host: string;
    content: string;
    duration: number;
}

interface WhiteboardCanvasProps {
    metadata: AudioSegment[] | null;
    currentTime: number;
    isPlaying: boolean;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ metadata, currentTime, isPlaying }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [charIndex, setCharIndex] = useState(0);

    // Get current segment's text
    const currentSegment = useMemo(() => {
        if (!metadata) return null;
        let accumulatedTime = 0;
        const pauseDuration = 0.7;

        for (const segment of metadata) {
            if (currentTime >= accumulatedTime && currentTime < (accumulatedTime + segment.duration)) {
                return segment;
            }
            accumulatedTime += segment.duration + pauseDuration;
        }
        return null;
    }, [currentTime, metadata]);

    // Typewriter effect
    useEffect(() => {
        if (!currentSegment || !isPlaying) return;

        const text = currentSegment.content;
        const charsPerSecond = text.length / currentSegment.duration;

        // Calculate how many chars should be shown based on elapsed time in this segment
        let accumulatedTime = 0;
        const pauseDuration = 0.7;

        if (metadata) {
            for (const segment of metadata) {
                if (segment === currentSegment) break;
                accumulatedTime += segment.duration + pauseDuration;
            }
        }

        const elapsedInSegment = currentTime - accumulatedTime;
        const expectedChars = Math.min(Math.floor(elapsedInSegment * charsPerSecond), text.length);

        setDisplayedText(text.slice(0, expectedChars));
        setCharIndex(expectedChars);
    }, [currentTime, currentSegment, isPlaying, metadata]);

    // Reset when segment changes
    useEffect(() => {
        if (currentSegment) {
            setDisplayedText("");
            setCharIndex(0);
        }
    }, [currentSegment?.content]);

    const activeSpeaker = currentSegment?.host;

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Whiteboard Container */}
            <div className="relative bg-gradient-to-br from-[#1a3028] via-[#2d4a3e] to-[#1a3028] border-8 border-[#8b7355] shadow-[inset_0_0_50px_rgba(0,0,0,0.5),_8px_8px_0px_0px_rgba(0,0,0,0.8)]" style={{ aspectRatio: '16/9' }}>

                {/* Chalk dust texture overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
                />

                {/* Speaker indicator */}
                <div className="absolute top-4 left-4 flex items-center space-x-3">
                    <motion.div
                        animate={activeSpeaker ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                        className={`px-4 py-2 font-black uppercase tracking-widest text-sm ${activeSpeaker === 'host_1'
                                ? 'bg-accent-blue text-white'
                                : activeSpeaker === 'host_2'
                                    ? 'bg-accent-orange text-white'
                                    : 'bg-gray-600 text-gray-300'
                            }`}
                    >
                        {activeSpeaker === 'host_1' ? '📚 Professor' : activeSpeaker === 'host_2' ? '🎓 Student' : 'Waiting...'}
                    </motion.div>
                </div>

                {/* Main content area */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Writing text with chalk effect */}
                        <AnimatePresence mode="wait">
                            {displayedText && (
                                <motion.div
                                    key={currentSegment?.content.slice(0, 20)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center max-w-4xl"
                                >
                                    <p
                                        className="text-2xl md:text-3xl lg:text-4xl font-mono leading-relaxed"
                                        style={{
                                            color: '#f0f0e8',
                                            textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.1)',
                                            fontFamily: '"Courier New", monospace'
                                        }}
                                    >
                                        {displayedText}
                                        <motion.span
                                            animate={{ opacity: [1, 0, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                            className="inline-block w-3 h-8 bg-white/80 ml-1 align-middle"
                                        />
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Placeholder when not playing */}
                        {!currentSegment && (
                            <div className="text-center">
                                <p className="text-white/50 text-2xl font-mono">Press play to start the lesson...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chalk tray */}
                <div className="absolute -bottom-4 left-4 right-4 h-6 bg-[#8b7355] shadow-[0_4px_0_0_rgba(0,0,0,0.3)]">
                    <div className="absolute top-1 left-4 flex space-x-3">
                        <div className="w-16 h-3 bg-white/80 rounded-sm shadow-md"></div>
                        <div className="w-12 h-3 bg-yellow-200/80 rounded-sm shadow-md"></div>
                        <div className="w-14 h-3 bg-pink-200/80 rounded-sm shadow-md"></div>
                    </div>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-2 right-2 text-white/20 text-xs font-mono">EduPod V2</div>
            </div>

            {/* Controls hint */}
            <div className="mt-6 text-center text-sm font-bold uppercase tracking-widest text-gray-500">
                {isPlaying ? "📝 Writing in progress..." : "Click play to see the lesson unfold"}
            </div>
        </div>
    );
};

export default WhiteboardCanvas;
