"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, UserCircle, BookOpen, Volume2 } from "lucide-react";

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
    // Calculate who is speaking
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
        <div className="relative w-full max-w-5xl mx-auto select-none">
            {/* Classroom Container */}
            <div
                className="relative overflow-hidden"
                style={{
                    aspectRatio: '16/9',
                    background: 'linear-gradient(180deg, #f5f0e6 0%, #e8dcc8 60%, #c4a882 100%)',
                    borderRadius: '8px',
                }}
            >
                {/* === BACK WALL === */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f0ebe0 0%, #e8e0d0 70%, transparent 100%)' }} />

                {/* === CHALKBOARD === */}
                <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[78%] h-[42%]"
                    style={{
                        background: 'linear-gradient(135deg, #2d4a3e, #1a3028)',
                        border: '10px solid #7a5a30',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.3)',
                        borderRadius: '4px',
                    }}
                >
                    {/* Chalk dust texture overlay */}
                    <div className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #fff 0.5px, transparent 0.5px)',
                            backgroundSize: '8px 8px'
                        }}
                    />

                    {/* Current text on the board */}
                    <AnimatePresence mode="wait">
                        {currentText && (
                            <motion.div
                                key={currentText.slice(0, 30)}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 flex items-center justify-center p-3 sm:p-6 md:p-10"
                            >
                                <p
                                    className="text-white/90 text-center leading-relaxed max-w-[90%]"
                                    style={{
                                        fontFamily: "'Caveat', 'Comic Sans MS', cursive",
                                        fontSize: 'clamp(14px, 2.5vw, 22px)',
                                        textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                                    }}
                                >
                                    {currentText.length > 180 ? currentText.slice(0, 180) + "..." : currentText}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* EduPod label - small corner tag */}
                    <div className="absolute top-2 right-3 text-white/20 text-[10px] font-mono tracking-wider">
                        EduPod
                    </div>

                    {/* Chalk tray */}
                    <div className="absolute -bottom-[6px] left-0 right-0 h-[6px] rounded-b"
                        style={{ background: '#7a5a30', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    />

                    {/* Chalk pieces on tray */}
                    <div className="absolute -bottom-[4px] left-[15%] flex gap-2">
                        <div className="w-6 h-[5px] bg-white rounded-sm opacity-90" />
                        <div className="w-5 h-[5px] bg-yellow-300 rounded-sm opacity-90" />
                        <div className="w-4 h-[5px] bg-orange-400 rounded-sm opacity-80" />
                    </div>
                </div>

                {/* === TEACHER DESK === */}
                <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[50%] h-[5%]"
                    style={{
                        background: 'linear-gradient(180deg, #9b6b3a, #7a4f20)',
                        borderRadius: '3px',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                    }}
                >
                    {/* Book on desk */}
                    <div className="absolute -top-[8px] right-[20%] w-8 h-[8px] bg-blue-600 rounded-sm opacity-80" style={{ transform: 'rotate(-3deg)' }} />
                    <div className="absolute -top-[6px] right-[25%] w-6 h-[6px] bg-red-500 rounded-sm opacity-70" style={{ transform: 'rotate(2deg)' }} />
                </div>

                {/* === PROFESSOR AVATAR === */}
                <motion.div
                    animate={activeSpeaker === 'host_1' ? {
                        scale: [1, 1.06, 1],
                        y: [0, -4, 0]
                    } : { scale: 1, y: 0 }}
                    transition={{ repeat: activeSpeaker === 'host_1' ? Infinity : 0, duration: 1 }}
                    className={`absolute bottom-[15%] left-[10%] transition-all duration-300 ${activeSpeaker === 'host_1' ? 'z-20' : 'z-10'}`}
                >
                    <div className="relative">
                        {/* Glow ring */}
                        {activeSpeaker === 'host_1' && (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.15, 0.4] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 rounded-full bg-blue-500"
                                style={{ margin: '-8px' }}
                            />
                        )}
                        <div className={`relative p-2.5 sm:p-4 md:p-5 rounded-full transition-all duration-300 border-3 ${activeSpeaker === 'host_1'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300 shadow-lg shadow-blue-500/40'
                            : 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-200'
                            }`}
                        >
                            <GraduationCap className="w-7 h-7 sm:w-10 sm:h-10 md:w-14 md:h-14 text-white drop-shadow" />

                            {/* Sound waves */}
                            <AnimatePresence>
                                {activeSpeaker === 'host_1' && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow"
                                    >
                                        <Volume2 className="w-3 h-3 text-blue-500" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="mt-2 text-center">
                            <span className={`
                                text-[10px] md:text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded
                                ${activeSpeaker === 'host_1' ? 'bg-blue-600 text-white' : 'bg-black/60 text-white/80'}
                            `}>
                                Professor
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* === STUDENT AVATAR === */}
                <motion.div
                    animate={activeSpeaker === 'host_2' ? {
                        scale: [1, 1.06, 1],
                        y: [0, -4, 0]
                    } : { scale: 1, y: 0 }}
                    transition={{ repeat: activeSpeaker === 'host_2' ? Infinity : 0, duration: 1 }}
                    className={`absolute bottom-[15%] right-[10%] transition-all duration-300 ${activeSpeaker === 'host_2' ? 'z-20' : 'z-10'}`}
                >
                    <div className="relative">
                        {activeSpeaker === 'host_2' && (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.15, 0.4] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 rounded-full bg-orange-500"
                                style={{ margin: '-8px' }}
                            />
                        )}
                        <div className={`relative p-2.5 sm:p-4 md:p-5 rounded-full transition-all duration-300 border-3 ${activeSpeaker === 'host_2'
                            ? 'bg-gradient-to-br from-orange-500 to-red-600 border-orange-300 shadow-lg shadow-orange-500/40'
                            : 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-200'
                            }`}
                        >
                            <UserCircle className="w-7 h-7 sm:w-10 sm:h-10 md:w-14 md:h-14 text-white drop-shadow" />

                            <AnimatePresence>
                                {activeSpeaker === 'host_2' && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow"
                                    >
                                        <Volume2 className="w-3 h-3 text-orange-500" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="mt-2 text-center">
                            <span className={`
                                text-[10px] md:text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded
                                ${activeSpeaker === 'host_2' ? 'bg-orange-600 text-white' : 'bg-black/60 text-white/80'}
                            `}>
                                Student
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* === FLOOR GRADIENT === */}
                <div className="absolute bottom-0 left-0 right-0 h-[25%]"
                    style={{ background: 'linear-gradient(0deg, #b8956a 0%, #c4a882 40%, transparent 100%)' }}
                />

                {/* Window light effect */}
                <div className="absolute top-0 right-0 w-1/4 h-full pointer-events-none"
                    style={{ background: 'linear-gradient(to left, rgba(255,248,220,0.15), transparent)' }}
                />

                {/* Subtle vignette */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.15)' }}
                />
            </div>

            {/* Paused overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center">
                        <motion.div
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <BookOpen className="w-12 h-12 text-white/80 mx-auto mb-3" />
                        </motion.div>
                        <span className="text-white font-black text-sm sm:text-lg uppercase tracking-widest">
                            Press Play to Start
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomScene;
