"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Play, Pause, RotateCcw, Volume2, Download, GraduationCap, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioSegment {
    host: string;
    content: string;
    duration: number;
}

interface AudioPlayerProps {
    url: string;
    metadata: AudioSegment[] | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, metadata }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    // Calculate who is speaking based on current time and metadata
    const activeSpeaker = useMemo(() => {
        if (!metadata) return null;
        let accumulatedTime = 0;
        const pauseDuration = 0.7; // Matches synth.py duration=700

        for (const segment of metadata) {
            if (currentTime >= accumulatedTime && currentTime < (accumulatedTime + segment.duration)) {
                return segment.host;
            }
            accumulatedTime += segment.duration + pauseDuration;
        }
        return null;
    }, [currentTime, metadata]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const reset = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(currentProgress);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'podcast.mp3');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-12 w-full max-w-4xl mx-auto bg-[var(--bg-card)] border-2 border-[var(--border-main)] p-8 shadow-[var(--shadow-block)]">
            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Talking Avatars Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Professor Card */}
                <div className={`p-6 border-2 border-[var(--border-main)] transition-all duration-300 ${activeSpeaker === 'host_1' ? 'bg-accent-blue text-white shadow-[var(--shadow-block)] translate-x-[-2px] translate-y-[-2px]' : 'bg-[var(--bg-main)] text-[var(--text-main)]'}`}>
                    <div className="flex items-center space-x-4">
                        <motion.div
                            animate={activeSpeaker === 'host_1' ? { scale: [1, 1.15, 1], rotate: [0, 2, -2, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                            className="p-3 bg-black rounded-none border-2 border-white"
                        >
                            <GraduationCap className="w-10 h-10 text-white" />
                        </motion.div>
                        <div>
                            <h3 className="font-black uppercase tracking-tighter text-2xl">Professor</h3>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Master Host</p>
                        </div>
                    </div>
                    <AnimatePresence>
                        {activeSpeaker === 'host_1' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 flex space-x-1"
                            >
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [10, 25, 10] }}
                                        transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }}
                                        className="w-1 bg-white"
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Student Card */}
                <div className={`p-6 border-2 border-[var(--border-main)] transition-all duration-300 ${activeSpeaker === 'host_2' ? 'bg-accent-orange text-white shadow-[var(--shadow-block)] translate-x-[-2px] translate-y-[-2px]' : 'bg-[var(--bg-main)] text-[var(--text-main)]'}`}>
                    <div className="flex items-center space-x-4">
                        <motion.div
                            animate={activeSpeaker === 'host_2' ? { scale: [1, 1.15, 1], rotate: [0, -2, 2, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                            className="p-3 bg-black rounded-none border-2 border-white"
                        >
                            <UserCircle className="w-10 h-10 text-white" />
                        </motion.div>
                        <div>
                            <h3 className="font-black uppercase tracking-tighter text-2xl">Student</h3>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Curious Mind</p>
                        </div>
                    </div>
                    <AnimatePresence>
                        {activeSpeaker === 'host_2' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 flex space-x-1"
                            >
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [10, 20, 10] }}
                                        transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.05 }}
                                        className="w-1 bg-white"
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic text-[var(--text-main)]">Podcast Feed</h2>
                    <div className="flex items-center space-x-4">
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4].map(i => <div key={i} className={`w-3 h-3 border-black border ${i % 2 === 0 ? 'bg-accent-orange' : 'bg-accent-blue'}`}></div>)}
                        </div>
                        <Volume2 className="w-6 h-6 text-[var(--text-main)]" />
                    </div>
                </div>

                <div className="relative w-full h-8 bg-[var(--bg-main)] border-2 border-[var(--border-main)] cursor-pointer group"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percent = x / rect.width;
                        if (audioRef.current) audioRef.current.currentTime = percent * audioRef.current.duration;
                    }}>
                    <div
                        className="absolute top-0 left-0 h-full bg-[var(--text-main)] transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-black uppercase mix-blend-difference text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        Seek Position
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <button
                        onClick={togglePlay}
                        className="flex items-center justify-center space-x-4 py-6 bg-[var(--text-main)] text-[var(--bg-card)] border-4 border-[var(--border-main)] hover:opacity-90 transition-all shadow-[var(--shadow-block)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black text-2xl uppercase tracking-widest"
                    >
                        {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
                        <span>{isPlaying ? "Pause" : "Play Now"}</span>
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={reset}
                            className="flex-1 flex items-center justify-center border-2 border-[var(--border-main)] p-4 bg-[var(--bg-card)] shadow-[var(--shadow-block)] hover:bg-[var(--bg-main)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-[var(--text-main)]"
                        >
                            <RotateCcw className="w-10 h-10" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center bg-accent-orange text-white border-2 border-[var(--border-main)] p-4 shadow-[var(--shadow-block)] hover:bg-[#e62e00] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            <Download className="w-10 h-10" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
