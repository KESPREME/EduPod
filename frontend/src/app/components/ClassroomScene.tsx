"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, UserCircle } from "lucide-react";

interface AudioSegment {
    host: string;
    content: string;
    duration: number;
}

interface ClassroomSceneProps {
    metadata: AudioSegment[] | null;
    currentTime: number;
    isPlaying: boolean;
}

const ClassroomScene: React.FC<ClassroomSceneProps> = ({ metadata, currentTime, isPlaying }) => {
    // Calculate who is speaking based on current time
    const activeSpeaker = useMemo(() => {
        if (!metadata) return null;
        let accumulatedTime = 0;
        const pauseDuration = 0.7;

        for (const segment of metadata) {
            if (currentTime >= accumulatedTime && currentTime < (accumulatedTime + segment.duration)) {
                return segment.host;
            }
            accumulatedTime += segment.duration + pauseDuration;
        }
        return null;
    }, [currentTime, metadata]);

    // Get current speaker's text
    const currentText = useMemo(() => {
        if (!metadata) return "";
        let accumulatedTime = 0;
        const pauseDuration = 0.7;

        for (const segment of metadata) {
            if (currentTime >= accumulatedTime && currentTime < (accumulatedTime + segment.duration)) {
                return segment.content;
            }
            accumulatedTime += segment.duration + pauseDuration;
        }
        return "";
    }, [currentTime, metadata]);

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Classroom Container */}
            <div className="relative bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d0] border-swiss shadow-swiss overflow-hidden" style={{ aspectRatio: '16/9' }}>

                {/* Chalkboard */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[80%] h-[45%] bg-gradient-to-br from-[#2d4a3e] to-[#1a3028] border-8 border-[#8b7355] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                    {/* Chalk dust texture */}
                    <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiPjwvcmVjdD4KPC9zdmc+')]" />

                    {/* Current Text on Board */}
                    <AnimatePresence mode="wait">
                        {currentText && (
                            <motion.div
                                key={currentText.slice(0, 20)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center p-8"
                            >
                                <p className="text-white font-mono text-lg md:text-xl text-center leading-relaxed" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                                    {currentText.length > 150 ? currentText.slice(0, 150) + "..." : currentText}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chalk tray */}
                    <div className="absolute -bottom-3 left-0 right-0 h-3 bg-[#8b7355]" />
                </div>

                {/* Teacher Avatar */}
                <motion.div
                    animate={activeSpeaker === 'host_1' ? {
                        scale: [1, 1.05, 1],
                        y: [0, -5, 0]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className={`absolute bottom-8 left-8 transition-all duration-300 ${activeSpeaker === 'host_1' ? 'z-20' : 'z-10'}`}
                >
                    <div className={`relative p-4 rounded-full ${activeSpeaker === 'host_1' ? 'bg-accent-blue' : 'bg-gray-300'} transition-colors duration-300`}>
                        <GraduationCap className="w-16 h-16 md:w-20 md:h-20 text-white" />

                        {/* Speech indicator */}
                        <AnimatePresence>
                            {activeSpeaker === 'host_1' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -top-2 -right-2 flex space-x-1"
                                >
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [8, 16, 8] }}
                                            transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }}
                                            className="w-1 bg-white rounded-full"
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-2 py-1">Professor</span>
                    </div>
                </motion.div>

                {/* Student Avatar */}
                <motion.div
                    animate={activeSpeaker === 'host_2' ? {
                        scale: [1, 1.05, 1],
                        y: [0, -5, 0]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className={`absolute bottom-8 right-8 transition-all duration-300 ${activeSpeaker === 'host_2' ? 'z-20' : 'z-10'}`}
                >
                    <div className={`relative p-4 rounded-full ${activeSpeaker === 'host_2' ? 'bg-accent-orange' : 'bg-gray-300'} transition-colors duration-300`}>
                        <UserCircle className="w-16 h-16 md:w-20 md:h-20 text-white" />

                        {/* Speech indicator */}
                        <AnimatePresence>
                            {activeSpeaker === 'host_2' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -top-2 -right-2 flex space-x-1"
                                >
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [8, 14, 8] }}
                                            transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.08 }}
                                            className="w-1 bg-white rounded-full"
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-2 py-1">Student</span>
                    </div>
                </motion.div>

                {/* Classroom floor pattern */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#c4a882] to-transparent opacity-50" />

                {/* Window light effect */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-yellow-100/20 to-transparent pointer-events-none" />
            </div>

            {/* Playback indicator */}
            {!isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white font-black text-2xl uppercase tracking-widest">Press Play to Start</span>
                </div>
            )}
        </div>
    );
};

export default ClassroomScene;
