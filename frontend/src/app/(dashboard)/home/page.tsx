"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Play, Clock, FileText, TrendingUp, Award, Zap, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import TutorialOverlay from "../../components/TutorialOverlay";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Lesson {
    id: string;
    title: string;
    date: string;
    duration: number;
    language: string;
}

export default function Home() {
    const { user, isGuest } = useAuth();
    const router = useRouter();

    const [lessons, setLessons] = useState<Lesson[]>(() => {
        if (typeof window === "undefined") return [];
        const saved = localStorage.getItem("edupod_lessons");
        return saved ? JSON.parse(saved) : [];
    });

    // Remote Metrics
    const [dbStreak, setDbStreak] = useState(0);
    const [dbTotalLessons, setDbTotalLessons] = useState(0);

    useEffect(() => {
        // Load metrics from Supabase if authenticated
        const fetchMetrics = async () => {
            if (user && !isGuest) {
                const { data, error } = await supabase
                    .from('users')
                    .select('streak, total_lessons')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setDbStreak(data.streak || 0);
                    setDbTotalLessons(data.total_lessons || 0);
                }
            }
        };

        fetchMetrics();
    }, [user, isGuest]);

    const handleDelete = (id: string) => {
        const updated = lessons.filter(l => l.id !== id);
        setLessons(updated);
        localStorage.setItem("edupod_lessons", JSON.stringify(updated));
    };

    const handleLessonSelect = (id: string) => {
        router.push(`/lesson/${id}`);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    // Calculate Stats (Fallback to local if Guest)
    const totalMinutes = Math.floor(lessons.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60);
    const completedLocalLessons = lessons.filter((l: any) => l.completed).length;
    const displayedLessons = (user && !isGuest) ? dbTotalLessons : completedLocalLessons;
    const displayedStreak = (user && !isGuest) ? dbStreak : 2; // Guest uses proxy 2 streak

    return (
        <div className="responsive-container w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
            <TutorialOverlay />

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Activity: Primary (Yellow) -> Text on Primary */}
                <div className="card-swiss bg-[var(--primary)] p-4 sm:p-6 flex flex-col justify-between h-28 sm:h-32">
                    <div className="flex justify-between items-start">
                        <TrendingUp className="w-6 h-6 text-[var(--text-on-primary)]" />
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-on-primary)]">ACTIVITY</span>
                    </div>
                    <div>
                        <span className="text-3xl sm:text-4xl font-black text-[var(--text-on-primary)]">{totalMinutes}</span>
                        <span className="text-xs sm:text-sm font-bold ml-1 text-[var(--text-on-primary)]">mins listened</span>
                    </div>
                </div>

                {/* Complete: Secondary -> Text on Secondary */}
                <div className="card-swiss bg-[var(--secondary)] p-4 sm:p-6 flex flex-col justify-between h-28 sm:h-32 transition-colors">
                    <div className="flex justify-between items-start">
                        <Award className="w-6 h-6 text-[var(--text-on-secondary)]" />
                        <span className="text-xs font-black uppercase tracking-widest opacity-80 text-[var(--text-on-secondary)]">COMPLETE</span>
                    </div>
                    <div>
                        <span className="text-3xl sm:text-4xl font-black text-[var(--text-on-secondary)]">{displayedLessons}</span>
                        <span className="text-xs sm:text-sm font-bold ml-1 text-[var(--text-on-secondary)]">lessons</span>
                    </div>
                </div>

                {/* Streak: Surface (White/Black) -> Text Main */}
                <div className="card-swiss bg-[var(--bg-card)] p-4 sm:p-6 flex flex-col justify-between h-28 sm:h-32">
                    <div className="flex justify-between items-start">
                        <Zap className="w-6 h-6 text-[var(--accent)]" />
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">STREAK</span>
                    </div>
                    <div>
                        <span className="text-3xl sm:text-4xl font-black text-[var(--text-main)]">{displayedStreak}</span>
                        <span className="text-xs sm:text-sm font-bold ml-1 text-[var(--text-main)]">day streak</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div>
                <div className="flex items-center justify-between mb-6 gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[var(--text-main)]">Your Library</h2>
                    <span className="text-sm font-bold text-[var(--text-muted)] border-2 border-[var(--border-main)] px-2 py-1 bg-[var(--bg-card)]">{lessons.length} LESSONS</span>
                </div>

                {lessons.length === 0 ? (
                    <div className="w-full p-6 sm:p-12 card-swiss text-center bg-[var(--bg-main)]">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-2 text-[var(--text-main)]">No Lessons Yet</h3>
                        <p className="text-[var(--text-muted)] mb-6 font-medium">Upload a PDF to create your first lesson</p>
                        <button onClick={() => router.push('/create')} className="btn-neo flex items-center gap-2 mx-auto">
                            <Plus size={20} /> Create First Lesson
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lessons.map((lesson, index) => (
                            <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card-swiss hover:shadow-[var(--shadow-block-hover)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer group bg-[var(--bg-card)]"
                                onClick={() => handleLessonSelect(lesson.id)}
                            >
                                {/* Preview area */}
                                <div className="h-32 bg-[var(--bg-main)] border-b-2 border-[var(--border-main)] flex items-center justify-center relative overflow-hidden group-hover:bg-[var(--primary)] transition-colors">
                                    <div className="absolute inset-0 opacity-10 bg-[url('/dot-grid.png')]"></div>
                                    <Play className="w-10 h-10 text-[var(--text-main)] opacity-20 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Info */}
                                <div className="p-5">
                                    <h3 className="font-black uppercase tracking-tight text-lg leading-tight mb-3 line-clamp-2 text-[var(--text-main)]">
                                        {lesson.title || `Lesson ${lesson.id.slice(0, 8)}`}
                                    </h3>

                                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] mb-4">
                                        <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDuration(lesson.duration)}</span>
                                        </div>
                                        <span className="bg-black text-white px-2 py-0.5">{lesson.language.toUpperCase()}</span>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[var(--bg-main)]">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }}
                                            className="p-2 hover:bg-[var(--accent)] hover:text-white transition-colors rounded border-2 border-transparent hover:border-[var(--border-main)] text-[var(--text-muted)]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
