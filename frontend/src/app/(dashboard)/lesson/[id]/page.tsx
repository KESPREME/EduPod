"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Maximize, Minimize, Edit2, Check, Settings2, Play, Pause, FileText, Layers, CheckCircle, BookOpen, Bot, Loader2, GripHorizontal } from "lucide-react";

import StatusBadge from "../../../components/StatusBadge";
import SeekBar from "../../../components/SeekBar";
import PlaybackSpeed from "../../../components/PlaybackSpeed";
import ClassroomScene from "../../../components/ClassroomScene";
import ShareButton from "../../../components/ShareButton";
import DownloadButton from "../../../components/DownloadButton";
import FlashcardDeck from "../../../components/FlashcardDeck";
import QuizCard from "../../../components/QuizCard";
import NotesView from "../../../components/NotesView";
import AITutor from "../../../components/AITutor";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "@/lib/supabase";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";
const MOBILE_BREAKPOINT = 768;
const MOBILE_VIEW_PREF_KEY = "edupod_mobile_lesson_view";

const Classroom3DAdvanced = dynamic(() => import("../../../components/Classroom3DAdvanced"), {
    ssr: false,
    loading: () => <div className="w-full aspect-video bg-black/80 animate-pulse" />,
});

const LazyTranscriptView = dynamic(() => import("../../../components/TranscriptView"), {
    ssr: false,
    loading: () => (
        <div className="p-4 text-sm font-bold uppercase text-[var(--text-muted)]">
            Loading transcript...
        </div>
    )
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

const QUIZ_OPTION_LABELS = ["A", "B", "C", "D"] as const;
const STOP_WORDS = new Set([
    "about", "after", "also", "and", "are", "because", "been", "before", "being", "between",
    "both", "could", "does", "from", "have", "into", "just", "more", "most", "only", "other",
    "over", "some", "such", "than", "that", "their", "there", "these", "they", "this", "those",
    "through", "under", "very", "what", "when", "where", "which", "while", "with", "would",
    "your", "from", "were", "will", "them"
]);

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").replace(/\*/g, "").trim();

/** Strip markdown syntax (##, -, **, `) so raw notes don't leak into flashcards/quiz */
const stripMarkdownSyntax = (text: string): string =>
    text
        .replace(/^#{1,6}\s+/gm, "")       // ## headers
        .replace(/\*\*(.*?)\*\*/g, "$1")    // **bold**
        .replace(/\*(.*?)\*/g, "$1")        // *italic*
        .replace(/`([^`]+)`/g, "$1")        // `code`
        .replace(/^\s*[-*+]\s+/gm, "")      // - bullet points (remove prefix entirely)
        .replace(/\*/g, "")                  // stray asterisks
        .replace(/#+/g, "")                  // stray hash marks
        .replace(/\n{2,}/g, ". ")            // paragraph breaks → sentence breaks
        .replace(/\n/g, " ")                 // remaining newlines
        .replace(/\s+/g, " ")
        .trim();

const toRecord = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== "object") return null;
    return value as Record<string, unknown>;
};

const stripOptionPrefix = (value: string) => value.replace(/^[A-D][.)]\s*/i, "");

const extractSourceText = (metadata: TranscriptSegment[] | null, notes: string) => {
    const transcriptText = stripMarkdownSyntax(metadata?.map((segment) => segment.content).join(" ") ?? "");
    // Strip markdown from notes before using as fallback source
    const cleanNotes = stripMarkdownSyntax(notes);
    return normalizeWhitespace(`${cleanNotes} ${transcriptText}`);
};

const splitSentences = (text: string) =>
    text
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => normalizeWhitespace(sentence))
        .filter((sentence) => sentence.length >= 35 && sentence.length <= 220 && !/^#/.test(sentence));

const sentenceToTerm = (sentence: string, fallbackIndex: number) => {
    const words = sentence
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
        .slice(0, 3);

    if (!words.length) return `Concept ${fallbackIndex + 1}`;
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const buildFallbackFlashcards = (metadata: TranscriptSegment[] | null, notes: string): FlashcardItem[] => {
    const sourceText = extractSourceText(metadata, notes);
    const sentences = splitSentences(sourceText);
    const cards: FlashcardItem[] = [];
    const seenTerms = new Set<string>();

    for (const sentence of sentences) {
        const term = sentenceToTerm(sentence, cards.length);
        const dedupeKey = term.toLowerCase();
        if (seenTerms.has(dedupeKey)) continue;
        seenTerms.add(dedupeKey);
        cards.push({ term, definition: sentence });
        if (cards.length >= 8) break;
    }

    return cards;
};

const normalizeFlashcards = (raw: unknown, metadata: TranscriptSegment[] | null, notes: string): FlashcardItem[] => {
    const candidates = Array.isArray(raw) ? raw : [];
    const normalized: FlashcardItem[] = [];
    const seenTerms = new Set<string>();

    for (const candidate of candidates) {
        const record = toRecord(candidate);
        if (!record) continue;
        const term = normalizeWhitespace(
            String(record.term ?? record.title ?? record.front ?? record.keyword ?? "")
        );
        const definition = normalizeWhitespace(
            String(record.definition ?? record.back ?? record.answer ?? record.explanation ?? "")
        );

        if (!term || !definition) continue;
        if (/^(error|null|undefined|term)$/i.test(term)) continue;
        if (/^(error|null|undefined)$/i.test(definition)) continue;

        const dedupeKey = term.toLowerCase();
        if (seenTerms.has(dedupeKey)) continue;
        seenTerms.add(dedupeKey);
        normalized.push({ term: stripMarkdownSyntax(term), definition: stripMarkdownSyntax(definition) });
    }

    if (normalized.length >= 4) return normalized.slice(0, 16);

    const fallbackCards = buildFallbackFlashcards(metadata, notes);
    if (fallbackCards.length) return fallbackCards;

    return normalized;
};

const parseCorrectLetter = (record: Record<string, unknown>, cleanOptions: string[]): string => {
    const directValue = record.correct ?? record.correct_answer ?? record.answer;

    if (typeof directValue === "number") {
        const idx = Math.max(0, Math.min(cleanOptions.length - 1, directValue));
        return QUIZ_OPTION_LABELS[idx] ?? "A";
    }

    if (typeof directValue === "string") {
        const clean = directValue.trim();
        const firstChar = clean.charAt(0).toUpperCase();
        if (QUIZ_OPTION_LABELS.includes(firstChar as (typeof QUIZ_OPTION_LABELS)[number])) {
            return firstChar;
        }

        const optionIdx = cleanOptions.findIndex((option) => option.toLowerCase() === clean.toLowerCase());
        if (optionIdx >= 0) return QUIZ_OPTION_LABELS[optionIdx] ?? "A";
    }

    return "A";
};

const buildFallbackQuiz = (
    flashcards: FlashcardItem[],
    metadata: TranscriptSegment[] | null,
    notes: string
): QuizQuestionItem[] => {
    const sourceCards = flashcards.length ? flashcards : buildFallbackFlashcards(metadata, notes);
    const cardPool = sourceCards.slice(0, 6);
    const quizItems: QuizQuestionItem[] = [];

    for (let index = 0; index < cardPool.length && quizItems.length < 4; index++) {
        const card = cardPool[index];
        const distractors = cardPool
            .filter((candidate) => candidate.term !== card.term)
            .map((candidate) => normalizeWhitespace(candidate.definition))
            .filter(Boolean)
            .slice(0, 3);

        if (!distractors.length) continue;

        const optionsText = [
            normalizeWhitespace(card.definition),
            ...distractors
        ].slice(0, 4);

        while (optionsText.length < 4) {
            optionsText.push(`Not related to ${card.term.toLowerCase()}.`);
        }

        const orderedOptions = optionsText.map((option) =>
            option.length > 120 ? `${option.slice(0, 117)}...` : option
        );

        const correctLetter = QUIZ_OPTION_LABELS[0];
        const prefixedOptions = orderedOptions.map((option, optionIdx) => `${QUIZ_OPTION_LABELS[optionIdx]}) ${option}`);

        quizItems.push({
            question: `What best describes "${card.term}"?`,
            options: prefixedOptions,
            correct: correctLetter,
            explanation: card.definition
        });
    }

    return quizItems;
};

const normalizeQuiz = (
    raw: unknown,
    flashcards: FlashcardItem[],
    metadata: TranscriptSegment[] | null,
    notes: string
): QuizQuestionItem[] => {
    const candidates = Array.isArray(raw) ? raw : [];
    const normalized: QuizQuestionItem[] = [];
    const seenQuestions = new Set<string>();

    for (const candidate of candidates) {
        const record = toRecord(candidate);
        if (!record) continue;

        const question = normalizeWhitespace(stripMarkdownSyntax(String(record.question ?? record.prompt ?? "")));
        if (!question) continue;

        const rawOptionsValue = record.options;
        let rawOptions: string[] = [];
        if (Array.isArray(rawOptionsValue)) {
            rawOptions = rawOptionsValue.map((option) => normalizeWhitespace(stripMarkdownSyntax(String(option))));
        } else if (rawOptionsValue && typeof rawOptionsValue === "object") {
            rawOptions = Object.values(rawOptionsValue as Record<string, unknown>).map((option) => normalizeWhitespace(stripMarkdownSyntax(String(option))));
        }

        const cleanOptions = rawOptions
            .map(stripOptionPrefix)
            .filter(Boolean)
            .slice(0, 4);

        if (cleanOptions.length < 2) continue;

        const dedupeKey = question.toLowerCase();
        if (seenQuestions.has(dedupeKey)) continue;
        seenQuestions.add(dedupeKey);

        const prefixedOptions = cleanOptions.map((option, idx) => `${QUIZ_OPTION_LABELS[idx]}) ${option}`);
        const correct = parseCorrectLetter(record, cleanOptions);
        const explanation = normalizeWhitespace(stripMarkdownSyntax(String(record.explanation ?? record.reason ?? `The best answer is ${correct}.`)));

        normalized.push({
            question,
            options: prefixedOptions,
            correct,
            explanation
        });
    }

    const looksGeneric = normalized.some((item) =>
        /main topic discussed in this podcast/i.test(item.question) ||
        item.options.some((option) => /cooking recipes|sports news|weather forecast/i.test(option))
    );

    if (normalized.length >= 3 && !looksGeneric) {
        return normalized;
    }

    const fallbackQuiz = buildFallbackQuiz(flashcards, metadata, notes);
    return fallbackQuiz.length ? fallbackQuiz : normalized;
};

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
    const [isTranscriptSheetExpanded, setIsTranscriptSheetExpanded] = useState(false);
    const [use3D, setUse3D] = useState(true);
    const [isMobileViewport, setIsMobileViewport] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.innerWidth <= MOBILE_BREAKPOINT;
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
            setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
        };

        syncViewport();
        window.addEventListener("resize", syncViewport);
        return () => window.removeEventListener("resize", syncViewport);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!isMobileViewport) {
            setUse3D(true);
            setIsTranscriptSheetExpanded(false);
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
                    const responseData = response.data as Record<string, unknown>;
                    const metadataData = Array.isArray(responseData.metadata)
                        ? (responseData.metadata as TranscriptSegment[])
                        : null;
                    const notesData = typeof responseData.notes === "string" ? responseData.notes : "";
                    const normalizedFlashcards = normalizeFlashcards(responseData.flashcards, metadataData, notesData);
                    const normalizedQuiz = normalizeQuiz(responseData.quiz, normalizedFlashcards, metadataData, notesData);

                    setAudioUrl(`${BACKEND_URL}/download/${jobId}`);
                    setMetadata(metadataData);
                    setNotes(notesData);
                    setFlashcards(normalizedFlashcards);
                    setQuiz(normalizedQuiz);
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

    const { user, isGuest } = useAuth(); // Need useAuth to check if we should update supabase
    const [hasCompleted, setHasCompleted] = useState(false);

    const handleTimeUpdate = async () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        setCurrentTime(current);

        // Check for completion (e.g., reached 90% of duration)
        if (duration > 0 && current >= duration * 0.9 && !hasCompleted) {
            setHasCompleted(true);

            // 1. Update local storage (for both guests and authenticated to show "done" state locally)
            const savedLessons = localStorage.getItem("edupod_lessons");
            if (savedLessons) {
                const lessons = JSON.parse(savedLessons);
                const updatedLessons = lessons.map((l: any) => {
                    if (l.id === jobId) return { ...l, completed: true };
                    return l;
                });
                localStorage.setItem("edupod_lessons", JSON.stringify(updatedLessons));
            }

            // 2. Update Supabase if authenticated 
            // We use an RPC call or simple fetch/update (since there's no atomic increment in JS client without RPC, we'll read then update, or just fetch total_lessons)
            // But wait, the best way without RPC is to just get current streak/lessons then update.
            // Let's do that.
            if (user && !isGuest) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('total_lessons')
                        .eq('id', user.id)
                        .single();

                    if (!error && data) {
                        await supabase
                            .from('users')
                            .update({ total_lessons: (data.total_lessons || 0) + 1 })
                            .eq('id', user.id);
                    }
                } catch (e) {
                    console.error("Failed to update completion stats", e);
                }
            }
        }
    };
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            const realDuration = audioRef.current.duration;
            setDuration(realDuration);
            // Update real duration in local storage
            const savedLessons = localStorage.getItem("edupod_lessons");
            if (savedLessons) {
                const lessons = JSON.parse(savedLessons);
                const updatedLessons = lessons.map((l: any) => {
                    if (l.id === jobId) return { ...l, duration: realDuration };
                    return l;
                });
                localStorage.setItem("edupod_lessons", JSON.stringify(updatedLessons));
            }
        }
    };
    const handleSeek = (time: number) => { if (audioRef.current) audioRef.current.currentTime = time; };

    const learningTabs = [
        { id: "transcript", label: "Transcript", icon: <FileText size={16} /> },
        { id: "flashcards", label: "Flashcards", icon: <Layers size={16} /> },
        { id: "quiz", label: "Quiz", icon: <CheckCircle size={16} /> },
        { id: "notes", label: "Study Notes", icon: <BookOpen size={16} /> },
        { id: "tutor", label: "AI Tutor", icon: <Bot size={16} /> },
    ] as const;

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }
        audioRef.current?.play();
        setIsPlaying(true);
    };

    const renderLearningTabContent = (mobileSheet = false) => {
        if (activeTab === "transcript") {
            return (
                <div className={`card-swiss bg-[var(--bg-card)] border-2 border-[var(--border-main)] ${mobileSheet ? "p-3" : "p-4"}`}>
                    <LazyTranscriptView
                        metadata={metadata}
                        currentTime={currentTime}
                        onSeek={(time) => {
                            if (audioRef.current) audioRef.current.currentTime = time;
                        }}
                    />
                </div>
            );
        }

        if (activeTab === "flashcards") {
            return (
                <div className={mobileSheet ? "py-4" : "py-6"}>
                    {flashcards.length > 0 ? (
                        <FlashcardDeck cards={flashcards} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            <p className="font-bold uppercase">Generating Flashcards...</p>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === "quiz") {
            return (
                <div className={mobileSheet ? "py-4" : "py-6"}>
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
            );
        }

        if (activeTab === "notes") {
            return <NotesView notes={notes} />;
        }

        return <AITutor jobId={jobId as string} />;
    };

    return (
        <div className={`responsive-page ${theaterMode ? "fixed inset-0 z-[100] bg-black flex flex-col" : "mobile-page-padding md:px-0 space-y-4 md:space-y-8 pb-[calc(1rem+env(safe-area-inset-bottom))]"}`}>

            {/* --- HEADER (Standard) --- */}
            {!theaterMode && (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4 bg-[var(--bg-card)] border-2 border-[var(--border-main)] p-4 md:p-4 card-swiss">
                    <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0">
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
                                    <h1 className="font-black uppercase tracking-tight text-lg md:text-xl leading-none text-[var(--text-main)] hover:text-[var(--primary)] transition-colors truncate">
                                        {lessonTitle}
                                    </h1>
                                    <Edit2 size={14} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] transition-opacity" />
                                </div>
                            )}
                            <StatusBadge status={status} compact={isMobileViewport} />
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                        {audioUrl && !isMobileViewport && (
                            <>
                                <ShareButton jobId={jobId} />
                                <DownloadButton jobId={jobId} audioUrl={audioUrl} />
                            </>
                        )}
                        {audioUrl && isMobileViewport && (
                            <div className="self-start">
                                <ShareButton jobId={jobId} />
                            </div>
                        )}
                        <button onClick={() => setTheaterMode(true)} className="touch-target btn-neo-secondary flex items-center justify-center gap-2 px-4 py-2.5 active:opacity-90">
                            <Maximize size={16} />
                            <span className="text-xs md:text-sm">Theater Mode</span>
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
                <motion.div layout className={`relative ${theaterMode ? "flex-1 flex flex-col" : "space-y-6 md:space-y-8"}`}>
                    <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={() => setIsPlaying(false)} className="hidden" />

                    {/* --- MAIN STAGE --- */}
                    <div className={`
                        relative transition-all duration-500 ease-in-out border-2 border-[var(--border-main)] overflow-hidden
                        ${theaterMode ? "flex-1 w-full bg-black border-none" : "card-swiss bg-black"}
                    `}>
                        {isMobileViewport && !theaterMode && (
                            <div className="mobile-card-padding border-b-2 border-[var(--border-main)] bg-[var(--bg-card)]">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Lesson Player</p>
                                        <h2 className="text-base font-black uppercase tracking-tight truncate">{lessonTitle}</h2>
                                    </div>
                                    <div className="inline-flex border-2 border-[var(--border-main)] rounded overflow-hidden bg-black">
                                        <button
                                            onClick={() => setUse3D(true)}
                                            className={`touch-target px-4 text-[11px] font-black uppercase tracking-wide transition-colors ${use3D ? "bg-[var(--primary)] text-black" : "text-white"}`}
                                        >
                                            3D
                                        </button>
                                        <button
                                            onClick={() => setUse3D(false)}
                                            className={`touch-target px-4 text-[11px] font-black uppercase tracking-wide transition-colors ${!use3D ? "bg-[var(--secondary)] text-white" : "text-white"}`}
                                        >
                                            2D
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3D/2D Toggle Overlay - Desktop + Theater */}
                        {(!isMobileViewport || theaterMode) && (
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
                        )}

                        {/* Viewport */}
                        <div className={`w-full relative ${!theaterMode ? "bg-[var(--bg-main)] border-2 border-white/20 aspect-video" : "h-full"}`}>
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
                                {(!isMobileViewport || theaterMode) && use3D && activeContent && (
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

                        {isMobileViewport && !theaterMode && use3D && activeContent && (
                            <div className="mobile-card-padding bg-black text-white border-t-2 border-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                                    {activeSpeaker === "host_1" ? "Professor" : "Student"}
                                </p>
                                <p className="text-sm leading-relaxed">{activeContent}</p>
                            </div>
                        )}

                        {isMobileViewport && !theaterMode && (
                            <div className="mobile-card-padding bg-[var(--bg-card)] border-t-2 border-[var(--border-main)] space-y-3 sticky bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-30">
                                <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />

                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handlePlayPause();
                                    }}
                                    className="touch-target w-full px-4 py-3 border-2 border-[var(--border-main)] bg-[var(--primary)] text-black font-black uppercase tracking-widest flex items-center justify-center gap-2 active:opacity-90"
                                >
                                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                                    <span>{isPlaying ? "Pause Lesson" : "Play Lesson"}</span>
                                </button>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab("transcript");
                                            setIsTranscriptSheetExpanded(true);
                                        }}
                                        className={`touch-target px-4 py-2.5 border-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "transcript" ? "bg-[var(--primary)] text-black border-[var(--border-main)]" : "bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-main)]"}`}
                                    >
                                        Transcript
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab("flashcards");
                                            setIsTranscriptSheetExpanded(true);
                                        }}
                                        className={`touch-target px-4 py-2.5 border-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "flashcards" ? "bg-[var(--primary)] text-black border-[var(--border-main)]" : "bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-main)]"}`}
                                    >
                                        Flashcards
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <PlaybackSpeed audioRef={audioRef as React.RefObject<HTMLAudioElement>} />
                                    <button
                                        onClick={() => setTheaterMode(true)}
                                        className="touch-target btn-neo-secondary flex items-center justify-center gap-2 px-4 py-2.5 text-xs active:opacity-90"
                                    >
                                        <Maximize size={14} />
                                        Theater
                                    </button>
                                </div>

                                <DownloadButton jobId={jobId} audioUrl={audioUrl} fullWidth={true} />
                            </div>
                        )}

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
                                        <div className="flex flex-col sm:flex-row sm:justify-center items-center gap-3 sm:gap-6">
                                            <PlaybackSpeed audioRef={audioRef as React.RefObject<HTMLAudioElement>} theaterMode={true} />
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handlePlayPause();
                                                }}
                                                className="touch-target w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border-4 border-black bg-[var(--primary)] text-black hover:opacity-90 active:opacity-90"
                                            >
                                                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                            </button>
                                            <Settings2 className="text-white/50 hover:text-white transition-colors cursor-pointer" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* --- STANDARD INFO DECK (Hidden in Theater) --- */}
                    {!theaterMode && !isMobileViewport && (
                        <div className="card-swiss p-3 sm:p-6 bg-[var(--bg-card)] border-2 border-[var(--primary)] shadow-[8px_8px_0px_var(--primary)] text-[var(--text-main)] space-y-4">
                            <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
                            <div className="flex items-center justify-center gap-6">
                                <PlaybackSpeed audioRef={audioRef as React.RefObject<HTMLAudioElement>} />
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handlePlayPause();
                                    }}
                                    className="touch-target w-20 h-20 flex items-center justify-center rounded-full border-4 bg-[var(--bg-card)] text-[var(--primary)] border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--border-main)] hover:opacity-90 active:opacity-90"
                                >
                                    {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- LEARNING DECK --- */}
                    {!theaterMode && !isMobileViewport && (
                        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Tabs */}
                            <div className="flex gap-2 sm:gap-3 pb-4 sm:pb-6 overflow-x-auto whitespace-nowrap pr-2">
                                {learningTabs.map((tab) => (
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
                            <div>{renderLearningTabContent()}</div>
                        </div>
                    )}

                    {isMobileViewport && !theaterMode && (
                        <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
                            <motion.div
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 320 }}
                                dragElastic={0.15}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 80) {
                                        setIsTranscriptSheetExpanded(false);
                                    } else if (info.offset.y < -40) {
                                        setIsTranscriptSheetExpanded(true);
                                    }
                                }}
                                animate={{ y: isTranscriptSheetExpanded ? 0 : "calc(80dvh - 72px)" }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="pointer-events-auto mx-4 card-swiss bg-[var(--bg-card)] h-[80dvh] max-h-[80dvh] flex flex-col border-2 border-[var(--border-main)] shadow-[0_-8px_24px_rgba(0,0,0,0.2)]"
                                style={{ willChange: "transform" }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsTranscriptSheetExpanded((prev) => !prev)}
                                    className="touch-target flex items-center justify-center border-b-2 border-[var(--border-main)]"
                                    aria-label="Toggle transcript panel"
                                >
                                    <GripHorizontal size={22} className="text-[var(--text-muted)]" />
                                </button>

                                <div className="sticky top-0 z-10 bg-[var(--bg-card)] border-b-2 border-[var(--border-main)]">
                                    <div className="overflow-x-auto whitespace-nowrap px-2 py-2 flex gap-2">
                                        {learningTabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    setActiveTab(tab.id);
                                                    setIsTranscriptSheetExpanded(true);
                                                }}
                                                className={`touch-target flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-wide border-2 shrink-0 ${activeTab === tab.id
                                                    ? "bg-[var(--primary)] text-black border-[var(--border-main)]"
                                                    : "bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-main)]"
                                                    }`}
                                            >
                                                {tab.icon}
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                                    {renderLearningTabContent(true)}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            ) : (
                /* Loading / Error State - Cyberpunk Terminal Style */
                <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 font-mono">
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
