"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Maximize, Minimize, Edit2, Check, Settings2, Subtitles, Play, Pause, FileText, Layers, CheckCircle, BookOpen, Bot, Loader2 } from "lucide-react";

import StatusBadge from "../../../components/StatusBadge";
import SeekBar from "../../../components/SeekBar";
import PlaybackSpeed from "../../../components/PlaybackSpeed";
import ClassroomScene from "../../../components/ClassroomScene";
import TranscriptView from "../../../components/TranscriptView";
import ShareButton from "../../../components/ShareButton";
import DownloadButton from "../../../components/DownloadButton";
import FlashcardDeck from "../../../components/FlashcardDeck";
import QuizCard from "../../../components/QuizCard";
import NotesView from "../../../components/NotesView";
import AITutor from "../../../components/AITutor";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";
const MOBILE_VIEW_PREF_KEY = "edupod_mobile_lesson_view";

const Classroom3DAdvanced = dynamic(() => import("../../../components/Classroom3DAdvanced"), {
    ssr: false,
    loading: () => <div className="w-full aspect-video bg-black/80 animate-pulse" />,
});

interface TranscriptSegment {
    host: "host_1" | "host_2";
    content: string;
    duration: number;
}

interface FlashcardItem {
    term: string;
    definition: string;
}

interface QuizQuestionItem {
    question: string;
    options: string[];
    correct: string;
    explanation: string;
}

export default function LessonPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = params.id as string;

    const [status, setStatus] = useState<string>("Loading...");
    const [statusStep, setStatusStep] = useState(0); // 0: Start, 1: Text, 2: Script, 3: Audio, 4: Done

    // Initialize tab from URL query param or default to 'transcript'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "transcript");

    // Status & Data
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<TranscriptSegment[] | null>(null);
    const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
    const [quiz, setQuiz] = useState<QuizQuestionItem[]>([]);
    const [notes, setNotes] = useState<string>("");

    // Player State
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [use3D, setUse3D] = useState(true);
    const [isMobileViewport, setIsMobileViewport] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.innerWidth <= 640;
    });
    const [duration, setDuration] = useState(0);
    const [theaterMode, setTheaterMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Title State
    const [lessonTitle, setLessonTitle] = useState(`Lesson ${jobId.slice(0, 6)}`);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const maxRetries = 5;

    // Scroll Locking
    useEffect(() => {
        if (theaterMode) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [theaterMode]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const syncViewport = () => {
            setIsMobileViewport(window.innerWidth <= 640);
        };

        syncViewport();
        window.addEventListener("resize", syncViewport);
        return () => window.removeEventListener("resize", syncViewport);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!isMobileViewport) {
            setUse3D(true);
            return;
        }

        const storedView = localStorage.getItem(MOBILE_VIEW_PREF_KEY);
        setUse3D(storedView === "3d");
    }, [isMobileViewport]);

    useEffect(() => {
        if (typeof window === "undefined" || !isMobileViewport) return;
        localStorage.setItem(MOBILE_VIEW_PREF_KEY, use3D ? "3d" : "2d");
    }, [use3D, isMobileViewport]);

    // Load Title
    useEffect(() => {
        const savedLessons = localStorage.getItem("edupod_lessons");
        if (savedLessons) {
            const lessons = JSON.parse(savedLessons) as Array<{ id: string; title?: string }>;
            const currentLesson = lessons.find((l) => l.id === jobId);
            if (currentLesson && currentLesson.title) setLessonTitle(currentLesson.title);
        }
    }, [jobId]);

    const handleTitleSave = () => {
        setIsEditingTitle(false);
        const savedLessons = localStorage.getItem("edupod_lessons");
        if (savedLessons) {
            const lessons = JSON.parse(savedLessons) as Array<{ id: string; title?: string }>;
            const updatedLessons = lessons.map((l) => {
                if (l.id === jobId) return { ...l, title: lessonTitle };
                return l;
            });
            localStorage.setItem("edupod_lessons", JSON.stringify(updatedLessons));
        }
    };

    // Robust Polling
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;
        let retries = 0;

        const fetchStatus = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/status/${jobId}`);
                setError(null); // Clear previous errors
                retries = 0; // Reset retries on success

                const currentStatus = response.data.status;
                setStatus(currentStatus);

                // Map status to progress steps for UI
                if (currentStatus.includes("Processing PDF") || currentStatus.includes("Extracting")) setStatusStep(1);
                else if (currentStatus.includes("Generating")) setStatusStep(2);
                else if (currentStatus.includes("Synthesizing")) setStatusStep(3);
                else if (currentStatus === "Completed") setStatusStep(4);

                if (currentStatus === "Completed") {
                    setAudioUrl(`${BACKEND_URL}/download/${jobId}`);
                    setMetadata(response.data.metadata);
                    if (response.data.flashcards) setFlashcards(response.data.flashcards);
                    if (response.data.quiz) setQuiz(response.data.quiz);
                    if (response.data.notes) setNotes(response.data.notes);
                    if (intervalId) clearInterval(intervalId);
                } else if (currentStatus.startsWith("Error")) {
                    setError(currentStatus);
                    if (intervalId) clearInterval(intervalId);
                }
            } catch (err: unknown) {
                console.error("Status check failed", err);
                const axiosErr = axios.isAxiosError(err) ? err : null;

                // Handle 404 specifically (Job Not Found / Expired)
                if (axiosErr?.response?.status === 404) {
                    setError("Lesson not found or expired. Please upload again.");
                    if (intervalId) clearInterval(intervalId);
                    return;
                }

                // Handle Connection Refused / Network Error with Retries
                retries++;
                if (retries > maxRetries) {
                    setError("Connection lost. Is the backend server running?");
                    if (intervalId) clearInterval(intervalId);
                }
            }
        };

        fetchStatus(); // Initial call
        intervalId = setInterval(fetchStatus, 3000); // 3s polling
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [jobId]);

    // Active Speaker & Content
    const { activeSpeaker, activeContent } = useMemo(() => {
        if (!metadata) return { activeSpeaker: null, activeContent: null };
        let accumulatedTime = 0;
        const pauseDuration = 0.7;
        for (const segment of metadata) {
            if (currentTime >= accumulatedTime && currentTime < (accumulatedTime + segment.duration)) {
                return { activeSpeaker: segment.host, activeContent: segment.content };
            }
            accumulatedTime += segment.duration + pauseDuration;
        }
        return { activeSpeaker: null, activeContent: null };
    }, [currentTime, metadata]);

    const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
    const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
    const handleSeek = (time: number) => { if (audioRef.current) audioRef.current.currentTime = time; };

    // --- RENDER HELPERS ---
    const PlayerControls = ({ minimal = false }) => (
        <div className={`flex items-center gap-3 sm:gap-6 ${minimal ? "justify-center" : "justify-center mt-4 sm:mt-6"}`}>
            <PlaybackSpeed audioRef={audioRef as React.RefObject<HTMLAudioElement>} theaterMode={minimal} />

            {/* Play/Pause Button - onMouseDown for instant response, smooth opacity transition */}
            <button
                type="button"
                onMouseDown={(e) => {
                    e.preventDefault();
                    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
                    else { audioRef.current?.play(); setIsPlaying(true); }
                }}
                className={`touch-target relative flex items-center justify-center rounded-full border-4 cursor-pointer select-none transition-opacity duration-150 ${minimal
                    ? "w-14 h-14 sm:w-16 sm:h-16 bg-[var(--primary)] text-black border-black hover:opacity-80 active:opacity-60"
                    : "w-16 h-16 sm:w-20 sm:h-20 bg-[var(--bg-card)] text-[var(--primary)] border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--border-main)] hover:opacity-80 active:opacity-60"
                    }`}
            >
                {isPlaying ? <Pause size={minimal ? 32 : 40} fill="currentColor" /> : <Play size={minimal ? 32 : 40} fill="currentColor" className="ml-1" />}
            </button>

            {/* Transcript Button - Yellow when active, onMouseDown for instant response, smooth opacity transition */}
            <button
                type="button"
                onMouseDown={(e) => {
                    e.preventDefault();
                    setShowTranscript(!showTranscript);
                }}
                className={`touch-target flex items-center justify-center border-2 rounded-full cursor-pointer select-none transition-opacity duration-150 ${showTranscript
                    ? "w-11 h-11 sm:w-12 sm:h-12 bg-[var(--primary)] text-black border-[var(--primary)] hover:opacity-80 active:opacity-60"
                    : minimal
                        ? "w-11 h-11 sm:w-12 sm:h-12 bg-black/50 text-white border-white/50 hover:opacity-80 active:opacity-60"
                        : "w-11 h-11 sm:w-12 sm:h-12 bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-main)] shadow-[2px_2px_0px_0px_var(--border-main)] hover:opacity-80 active:opacity-60"
                    }`}
                title="Transcript"
            >
                <Subtitles size={24} />
            </button>
        </div>
    );

    return (
        <div className={`responsive-page ${theaterMode ? "fixed inset-0 z-[100] bg-black flex flex-col" : "space-y-4 sm:space-y-6"}`}>

            {/* --- HEADER (Standard) --- */}
            {!theaterMode && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-[var(--bg-card)] border-2 border-[var(--border-main)] p-3 sm:p-4 card-swiss">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        <button onClick={() => router.back()} className="touch-target p-2 border-2 border-transparent hover:border-[var(--border-main)] hover:bg-[var(--bg-main)] rounded transition-all text-[var(--text-main)] shrink-0">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="min-w-0">
                            {isEditingTitle ? (
                                <div className="flex items-center gap-2 min-w-0">
                                    <input
                                        type="text"
                                        value={lessonTitle}
                                        onChange={(e) => setLessonTitle(e.target.value)}
                                        className="input-neo text-base sm:text-xl font-black uppercase py-1 px-2 w-full sm:w-80 md:w-96"
                                        autoFocus
                                        onBlur={handleTitleSave}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                    />
                                    <button onClick={handleTitleSave} className="touch-target p-1 text-[var(--secondary)] hover:bg-[var(--bg-main)] rounded shrink-0">
                                        <Check size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group cursor-pointer min-w-0" onClick={() => setIsEditingTitle(true)}>
                                    <h1 className="font-black uppercase tracking-tight text-base sm:text-xl leading-none text-[var(--text-main)] hover:text-[var(--primary)] transition-colors truncate">
                                        {lessonTitle}
                                    </h1>
                                    <Edit2 size={14} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] transition-opacity" />
                                </div>
                            )}
                            <StatusBadge status={status} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {audioUrl && (
                            <>
                                <ShareButton jobId={jobId} />
                                <DownloadButton jobId={jobId} audioUrl={audioUrl} />
                            </>
                        )}
                        <button onClick={() => setTheaterMode(true)} className="touch-target btn-neo-secondary flex items-center gap-2">
                            <Maximize size={16} />
                            <span className="hidden md:inline">Theater Mode</span>
                        </button>
                    </div>
                </div>
            )}

            {/* --- THEATER HEADER --- */}
            <AnimatePresence>
                {theaterMode && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[110] p-3 sm:p-6 flex justify-between items-start pointer-events-none gap-3"
                    >
                        <div className="pointer-events-auto bg-black/50 backdrop-blur-md border border-white/20 px-3 sm:px-4 py-2 rounded-lg max-w-[70vw]">
                            <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                                <span className="truncate">{lessonTitle}</span>
                            </h2>
                        </div>
                        <button
                            onClick={() => setTheaterMode(false)}
                            className="pointer-events-auto touch-target btn-neo bg-[var(--accent)] text-white border-white hover:bg-[var(--accent)] hover:text-white flex items-center gap-2 shadow-[0_0_15px_var(--accent)]"
                        >
                            <Minimize size={16} />
                            <span className="hidden sm:inline">Exit Theater</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {audioUrl ? (
                <motion.div layout className={`relative ${theaterMode ? "flex-1 flex flex-col" : "space-y-6"}`}>
                    <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={() => setIsPlaying(false)} className="hidden" />

                    {/* --- MAIN STAGE --- */}
                    <div className={`
                        relative transition-all duration-500 ease-in-out border-2 border-[var(--border-main)] overflow-hidden
                        ${theaterMode ? "flex-1 w-full bg-black border-none" : "card-swiss bg-black p-1.5 sm:p-2 min-h-[320px] sm:min-h-[500px]"}
                    `}>
                        {/* 3D/2D Toggle Overlay - Fixed Z-index */}
                        <div className={`absolute z-[105] flex gap-2 ${theaterMode ? "top-20 sm:top-24 right-3 sm:right-8" : "top-3 sm:top-4 right-3 sm:right-4"}`}>
                            <div className="flex bg-black border-2 border-white rounded overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                                <button
                                    onClick={() => setUse3D(true)}
                                    className={`touch-target px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase transition-colors ${use3D ? 'bg-[var(--primary)] text-black' : 'text-white hover:bg-white/20'}`}
                                >
                                    3D View
                                </button>
                                <button
                                    onClick={() => setUse3D(false)}
                                    className={`touch-target px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase transition-colors ${!use3D ? 'bg-[var(--secondary)] text-white' : 'text-white hover:bg-white/20'}`}
                                >
                                    2D View
                                </button>
                            </div>
                        </div>

                        {/* Viewport */}
                        <div className={`w-full h-full relative ${!theaterMode ? "bg-[var(--bg-main)] border-2 border-white/20" : ""}`}>
                            {use3D ? (
                                <Classroom3DAdvanced
                                    activeSpeaker={activeSpeaker}
                                    isPlaying={isPlaying}
                                    teacherModelUrl="/models/teacher.glb"
                                    studentModelUrl="/models/student.glb"
                                />
                            ) : (
                                <ClassroomScene metadata={metadata} currentTime={currentTime} isPlaying={isPlaying} />
                            )}

                            {/* Subtitle Overlay (3D Mode) */}
                            <AnimatePresence>
                                {use3D && activeContent && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 w-[92%] sm:w-3/4 max-w-2xl text-center z-[100] pointer-events-none"
                                    >
                                        <div className="bg-black/70 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-white/20 shadow-2xl">
                                            <span className={`
                                                inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2
                                                ${activeSpeaker === 'host_1' ? 'bg-[#0066FF] text-white' : 'bg-[#FF3D00] text-white'}
                                            `}>
                                                {activeSpeaker === 'host_1' ? 'Professor' : 'Student'}
                                            </span>
                                            <p className="text-white text-sm sm:text-lg font-medium leading-relaxed drop-shadow-md">
                                                {activeContent}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* --- THEATER CONTROLS OVERLAY --- */}
                        <AnimatePresence>
                            {theaterMode && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t-2 border-[var(--primary)] p-3 sm:p-6 z-[120] pb-4 sm:pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
                                >
                                    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                                        <div className="w-full">
                                            <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} theaterMode={true} />
                                        </div>
                                        <div className="flex justify-between items-center relative">
                                            <div className="w-1/3 flex items-center gap-4">
                                                {/* Left Side Controls (Volume/Settings placeholder) */}
                                                <Settings2 className="text-white/50 hover:text-white transition-colors cursor-pointer" />
                                            </div>

                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                                <PlayerControls minimal={true} />
                                            </div>

                                            <div className="w-1/3 flex justify-end">
                                                {/* Right Side Controls */}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* --- STANDARD INFO DECK (Hidden in Theater) --- */}
                    {!theaterMode && (
                        <div className="card-swiss p-3 sm:p-6 bg-[var(--bg-card)] border-2 border-[var(--primary)] shadow-[8px_8px_0px_var(--primary)] text-[var(--text-main)]">
                            <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
                            <PlayerControls minimal={false} />
                        </div>
                    )}

                    {/* --- LEARNING DECK --- */}
                    {!theaterMode && (
                        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Tabs */}
                            <div className="flex gap-2 sm:gap-3 pb-4 sm:pb-6 overflow-x-auto whitespace-nowrap pr-2">
                                {[
                                    { id: "transcript", label: "Transcript", icon: <FileText size={18} /> },
                                    { id: "flashcards", label: "Flashcards", icon: <Layers size={18} /> },
                                    { id: "quiz", label: "Quiz", icon: <CheckCircle size={18} /> },
                                    { id: "notes", label: "Study Notes", icon: <BookOpen size={18} /> },
                                    { id: "tutor", label: "AI Tutor", icon: <Bot size={18} /> },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            touch-target flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-black uppercase tracking-widest transition-all border-2 shrink-0 text-xs sm:text-sm
                                            ${activeTab === tab.id
                                                ? "bg-[var(--primary)] text-black border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--border-main)] -translate-y-1"
                                                : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-main)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] hover:shadow-[2px_2px_0px_0px_var(--border-main)]"}
                                        `}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="min-h-[280px] sm:min-h-[400px]">
                                {activeTab === "transcript" && (
                                    <div className="card-swiss bg-[var(--bg-card)] p-3 sm:p-4 max-h-[70dvh] sm:max-h-[600px] overflow-auto border-2 border-[var(--border-main)]">
                                        <TranscriptView
                                            metadata={metadata}
                                            currentTime={currentTime}
                                            onSeek={(time) => { if (audioRef.current) audioRef.current.currentTime = time; }}
                                        />
                                    </div>
                                )}
                                {activeTab === "flashcards" && (
                                    <div className="py-4 sm:py-8">
                                        {flashcards.length > 0 ? (
                                            <FlashcardDeck cards={flashcards} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                                <p className="font-bold uppercase">Generating Flashcards...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === "quiz" && (
                                    <div className="py-4 sm:py-8">
                                        {quiz.length > 0 ? (
                                            <QuizCard
                                                questions={quiz}
                                                onComplete={(score) => console.log("Quiz Score:", score)}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                                <p className="font-bold uppercase">Generating Quiz...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === "notes" && (
                                    <NotesView notes={notes} />
                                )}
                                {activeTab === "tutor" && (
                                    <AITutor jobId={jobId as string} />
                                )}
                            </div>
                        </div>
                    )}

                </motion.div>
            ) : (
                /* Loading / Error State - Cyberpunk Terminal Style */
                <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-3xl mx-auto px-3 sm:px-6 font-mono">
                    {error ? (
                        <div className="card-swiss bg-[#1a0000] border-2 border-[var(--accent)] p-4 sm:p-8 text-center w-full shadow-[8px_8px_0px_var(--accent)]">
                            <div className="inline-block p-4 rounded-full bg-[var(--accent)] text-white mb-6 animate-pulse">
                                <Settings2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black uppercase text-[var(--accent)] mb-4 tracking-widest glitch-effect">SYSTEM FAILURE</h2>
                            <div className="bg-black/50 p-4 border border-[var(--accent)] mb-8 text-left font-mono text-sm text-[var(--accent)] overflow-auto max-h-32">
                                <span className="opacity-50">{`> ERROR_CODE: 500`}<br /></span>
                                <span className="opacity-50">{`> TIMESTAMP: ${new Date().toISOString()}`}<br /></span>
                                <span className="text-white">{`> ${error}`}</span>
                            </div>
                            <button
                                onClick={() => router.push('/create')}
                                className="touch-target w-full py-4 bg-[var(--accent)] text-white font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[var(--shadow-block)] hover:shadow-[var(--shadow-block-hover)] border-2 border-white"
                            >
                                REBOOT SYSTEM
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            {/* Adaptive Loading Card - Uses CSS-based theming */}
                            <div className="loading-card card-swiss overflow-hidden relative">
                                {/* Scanlines Overlay - Shown via CSS in dark mode */}
                                <div className="absolute inset-0 pointer-events-none loading-scanlines z-50" />

                                {/* Header Bar */}
                                <div className="px-4 py-3 flex justify-between items-center border-b-2 border-[var(--border-main)] bg-[var(--primary)]">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[var(--accent)] border border-black/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-[var(--secondary)] border border-black/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500 border border-black/20"></div>
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-sm text-black">
                                        EduPod // Process Manager
                                    </span>
                                </div>

                                {/* Content Area */}
                                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 relative">
                                    {/* Grid Background */}
                                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(var(--border-main)_1px,transparent_1px),linear-gradient(90deg,var(--border-main)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                                    {/* Status Badge */}
                                    <div className="relative z-10 text-center space-y-6">
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[var(--secondary)]/10 border-2 border-[var(--secondary)]">
                                            <div className="w-2 h-2 bg-[var(--secondary)] rounded-full animate-ping"></div>
                                            <span className="text-xs font-bold tracking-widest uppercase text-[var(--secondary)]">
                                                Live Processing
                                            </span>
                                        </motion.div>

                                        {/* Main Status Text */}
                                        <motion.h2
                                            key={statusStep}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-main)]">
                                            {statusStep === 0 && (
                                                <span className="text-[var(--text-muted)]">
                                                    Initializing<span className="cursor-blink">_</span>
                                                </span>
                                            )}
                                            {statusStep === 1 && (
                                                <span className="text-[var(--primary)]" style={{ textShadow: 'var(--glow-color, transparent) 0 0 20px' }}>
                                                    Extracting<span className="cursor-blink">_</span>
                                                </span>
                                            )}
                                            {statusStep === 2 && (
                                                <span className="text-[var(--secondary)]" style={{ textShadow: '0 0 20px var(--glow-color, transparent)' }}>
                                                    Scripting<span className="cursor-blink">_</span>
                                                </span>
                                            )}
                                            {statusStep === 3 && (
                                                <span className="text-[var(--accent)]" style={{ textShadow: '0 0 20px var(--glow-color, transparent)' }}>
                                                    Synthesizing<span className="cursor-blink">_</span>
                                                </span>
                                            )}
                                            {statusStep === 4 && (
                                                <span className="text-green-500" style={{ textShadow: '0 0 20px var(--glow-color, transparent)' }}>
                                                    Complete<span className="cursor-blink">_</span>
                                                </span>
                                            )}
                                        </motion.h2>

                                        {/* Subtitle */}
                                        <p className="text-sm text-[var(--text-muted)] font-medium max-w-md mx-auto">
                                            {status}
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative z-10">
                                        <div className="flex justify-between text-xs font-bold uppercase text-[var(--text-muted)] mb-3 px-1">
                                            <span>Start</span>
                                            <span className="text-[var(--primary)]">{Math.round((statusStep / 4) * 100)}%</span>
                                            <span>Complete</span>
                                        </div>
                                        <div className="progress-track">
                                            <motion.div
                                                className="h-full relative overflow-hidden"
                                                initial={{ width: "0%" }}
                                                animate={{
                                                    width: `${Math.max(5, (statusStep / 4) * 100)}%`,
                                                    backgroundColor: statusStep === 2 ? 'var(--secondary)' : statusStep === 3 ? 'var(--accent)' : statusStep === 4 ? '#22c55e' : 'var(--primary)'
                                                }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                            >
                                                {/* Animated shimmer */}
                                                <div className="absolute inset-0 loading-stripes" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Step Indicators */}
                                    <div className="relative z-10 flex justify-between items-center px-1 sm:px-4 gap-2">
                                        {[
                                            { step: 1, label: "Extract", icon: "E" },
                                            { step: 2, label: "Script", icon: "S" },
                                            { step: 3, label: "Voice", icon: "V" },
                                            { step: 4, label: "Done", icon: "D" }
                                        ].map(({ step, label, icon }) => (
                                            <motion.div
                                                key={step}
                                                initial={{ scale: 0.8 }}
                                                animate={{
                                                    scale: statusStep >= step ? 1 : 0.9,
                                                    opacity: statusStep >= step ? 1 : 0.4
                                                }}
                                                className="flex flex-col items-center gap-2">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all
                                                    ${statusStep >= step
                                                        ? 'bg-[var(--primary)] border-[var(--border-main)] shadow-[2px_2px_0px_var(--shadow-color)]'
                                                        : 'bg-[var(--bg-main)] border-[var(--border-main)]'}`}>
                                                    {icon}
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-bold uppercase text-[var(--text-muted)]">{label}</span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Log Output */}
                                    <div className="log-area relative z-10 overflow-hidden">
                                        <div className="px-4 py-2 border-b border-[var(--border-main)] flex items-center gap-2 bg-[var(--bg-card)]">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">System Log</span>
                                        </div>
                                        <div className="p-4 font-mono text-sm space-y-1 h-28 overflow-hidden flex flex-col justify-end">
                                            <div className="text-[var(--text-muted)] line-through opacity-40">{`> init_env... OK`}</div>
                                            {statusStep >= 1 && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-[var(--primary)]"
                                                >{`> pdf_parse... OK`}</motion.div>
                                            )}
                                            {statusStep >= 2 && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-[var(--secondary)]"
                                                >{`> ai_script... OK`}</motion.div>
                                            )}
                                            {statusStep >= 3 && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-[var(--accent)]"
                                                >{`> tts_synth... RUNNING`}</motion.div>
                                            )}
                                            <div className="text-[var(--text-main)] flex items-center gap-2">
                                                <span className="text-green-500">$</span>
                                                <span className="truncate">{status.toLowerCase().replace('...', '')}</span>
                                                <span className="cursor-blink text-[var(--primary)]">|</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
