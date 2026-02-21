"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, Share2, Clock, Search, Plus, X, Layers, CheckCircle, BookOpen, GraduationCap, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { LessonThumbnail } from "../../components/LessonThumbnail";

interface Lesson {
    id: string;
    title: string;
    date: string;
    duration: number;
    language: string;
}

export default function Library() {
    const [lessons, setLessons] = useState<Lesson[]>(() => {
        if (typeof window === "undefined") return [];
        const saved = localStorage.getItem("edupod_lessons");
        return saved ? JSON.parse(saved) : [];
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this lesson?")) {
            const updated = lessons.filter(l => l.id !== id);
            setLessons(updated);
            localStorage.setItem("edupod_lessons", JSON.stringify(updated));
        }
    };

    const handleLessonSelect = (id: string) => {
        router.push(`/lesson/${id}`);
    };

    const handleQuickAction = (id: string, tab: string, e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/lesson/${id}?tab=${tab}`);
    };

    const handleShare = async (id: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/lesson/${id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `EduPod Lesson: ${title}`,
                    text: `Check out this lesson I generated on EduPod!`,
                    url: url,
                });
            } catch (err) {
                console.log("Share skipped", err);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(url);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const filteredLessons = lessons.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 100 }
        }
    };

    return (
        <div className="responsive-container w-full max-w-7xl mx-auto space-y-8 sm:space-y-12 pb-16 sm:pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[var(--border-main)] pb-8 mt-8">
                <div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-[var(--text-main)] mb-2 relative inline-block">
                        My Library
                        <span className="hidden sm:block absolute -top-8 -right-20 text-lg bg-[var(--accent)] text-white px-3 py-1 transform rotate-12 shadow-[4px_4px_0px_0px_black] z-10 tracking-normal whitespace-nowrap">
                            {lessons.length}&nbsp;&nbsp;ITEMS
                        </span>
                    </h2>
                    <p className="text-[var(--text-muted)] font-bold text-sm sm:text-lg uppercase tracking-widest">
                        Your generated knowledge base
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors z-10" />
                        <input
                            type="text"
                            placeholder="SEARCH ARCHIVES..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--bg-card)] border-4 border-[var(--border-main)] p-3 sm:p-4 pl-12 sm:pl-14 font-black text-base sm:text-xl uppercase outline-none text-[var(--text-main)] shadow-[4px_4px_0px_0px_var(--border-main)] focus:shadow-[8px_8px_0px_0px_var(--primary)] focus:-translate-y-1 transition-all placeholder:text-gray-300"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-black hover:text-white rounded-full transition-colors z-10"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {lessons.length === 0 ? (
                <div className="w-full py-16 sm:py-24 border-4 border-dashed border-[var(--text-muted)] rounded-3xl text-center bg-[var(--bg-card)]/50 dark:hover:border-[var(--secondary)] dark:hover:shadow-[0_0_20px_var(--secondary)] transition-all duration-300">
                    <div className="inline-block p-6 bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[8px_8px_0px_0px_var(--border-main)] rounded-full mb-8">
                        <GraduationCap className="w-16 h-16 text-[var(--primary)]" />
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-main)]">Library Empty</h3>
                    <p className="text-[var(--text-muted)] mb-8 sm:mb-10 font-bold text-base sm:text-xl uppercase tracking-widest max-w-md mx-auto">
                        Your learning journey begins here. Create your first lesson now.
                    </p>
                    <button
                        onClick={() => router.push('/create')}
                        className="relative touch-target px-8 sm:px-12 py-4 sm:py-6 bg-[#FFFF00] text-black border-4 border-black font-black text-lg sm:text-2xl uppercase tracking-widest 
                        shadow-[8px_8px_0px_0px_#00FFFF] 
                        hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_#00FFFF,0_0_30px_#00FFFF] 
                        active:translate-y-[0px] active:shadow-[4px_4px_0px_0px_#00FFFF] 
                        transition-all flex items-center gap-3 mx-auto z-20 group"
                    >
                        <Plus size={24} strokeWidth={4} />
                        <span>Create First Lesson</span>

                        {/* Glow element for exact replication of screenshot style */}
                        <div className="absolute inset-0 z-[-1] bg-[#00FFFF] blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                    </button>
                </div>
            ) : (
                /* Grid Layout */
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8"
                >
                    <AnimatePresence>
                        {filteredLessons.map((lesson) => (
                            <motion.div
                                key={lesson.id}
                                variants={itemVariants}
                                layout
                                className="group relative bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[8px_8px_0px_0px_var(--border-main)] hover:shadow-[16px_16px_0px_0px_var(--primary)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
                                onClick={() => handleLessonSelect(lesson.id)}
                            >
                                {/* Card Header / Preview */}
                                <div className="h-40 sm:h-48 relative overflow-hidden flex items-center justify-center border-b-4 border-[var(--border-main)] group-hover:bg-[var(--primary)] transition-colors duration-300">
                                    <LessonThumbnail
                                        title={lesson.title || `Lesson ${lesson.id}`}
                                        className="absolute inset-0 w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>

                                    <div className="z-20 text-center transform group-hover:scale-110 transition-transform duration-300">
                                        <div className="w-16 h-16 bg-[var(--bg-card)] border-4 border-[var(--border-main)] flex items-center justify-center rounded-full mx-auto mb-3 shadow-[4px_4px_0px_0px_var(--border-main)]">
                                            <Play className="w-6 h-6 ml-1 text-[var(--text-main)]" />
                                        </div>
                                        <div className="inline-block bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-[var(--border-main)] shadow-[2px_2px_0px_0px_var(--border-main)]">
                                            {formatDuration(lesson.duration)}
                                        </div>
                                    </div>

                                    {/* Share Button (Top Right) */}
                                    <div className="absolute top-3 right-3 z-20">
                                        <button
                                            onClick={(e) => handleShare(lesson.id, lesson.title, e)}
                                            className="p-2 bg-[var(--bg-card)] border-2 border-[var(--border-main)] hover:bg-[var(--secondary)] hover:text-white transition-all shadow-[2px_2px_0px_0px_var(--border-main)] active:translate-y-1 active:shadow-none"
                                            title="Share Lesson"
                                        >
                                            {copiedId === lesson.id ? <Check size={16} /> : <Share2 size={16} />}
                                        </button>
                                    </div>

                                    {/* Language Badge (Top Left) */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <span className="bg-[var(--secondary)] text-white border-2 border-[var(--border-main)] px-2 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_var(--border-main)]">
                                            {lesson.language.substring(0, 2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 sm:p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black uppercase tracking-tight text-xl sm:text-2xl leading-6 sm:leading-7 text-[var(--text-main)] line-clamp-2 min-h-[3.5rem] group-hover:text-[var(--primary)] transition-colors">
                                            {lesson.title || `Untitled Lesson`}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6">
                                        <Clock size={14} />
                                        <span>Created on {formatDate(lesson.date)}</span>
                                    </div>

                                    {/* Quick Actions Bar */}
                                    <div className="mt-auto pt-6 border-t-2 border-dashed border-[var(--border-main)] grid grid-cols-3 gap-2">
                                        <button
                                            onClick={(e) => handleQuickAction(lesson.id, 'flashcards', e)}
                                            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--bg-main)] rounded-lg transition-colors group/btn"
                                            title="Flashcards"
                                        >
                                            <Layers size={20} className="text-[var(--text-muted)] group-hover/btn:text-[var(--primary)] transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Cards</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleQuickAction(lesson.id, 'quiz', e)}
                                            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--bg-main)] rounded-lg transition-colors group/btn"
                                            title="Take Quiz"
                                        >
                                            <CheckCircle size={20} className="text-[var(--text-muted)] group-hover/btn:text-[var(--secondary)] transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Quiz</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleQuickAction(lesson.id, 'notes', e)}
                                            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--bg-main)] rounded-lg transition-colors group/btn"
                                            title="Study Notes"
                                        >
                                            <BookOpen size={20} className="text-[var(--text-muted)] group-hover/btn:text-[var(--accent)] transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Notes</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Delete Action (Hover reveal) */}
                                <button
                                    onClick={(e) => handleDelete(lesson.id, e)}
                                    className="absolute -bottom-3 right-6 bg-[var(--accent)] text-white p-2 border-2 border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--border-main)] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 hover:scale-110 z-30"
                                    title="Delete Lesson"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
