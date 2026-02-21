"use client";

import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { RotateCcw, Check, X, Download } from "lucide-react";

interface Flashcard {
    term: string;
    definition: string;
}

interface FlashcardDeckProps {
    cards: Flashcard[];
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCards, setKnownCards] = useState<number[]>([]);
    const [reviewCards, setReviewCards] = useState<number[]>([]);
    const [direction, setDirection] = useState(0);

    if (!cards.length) {
        return (
            <div className="w-full max-w-xl mx-auto text-center py-16 border-2 border-[var(--border-main)] bg-[var(--bg-card)] shadow-[6px_6px_0px_var(--border-main)]">
                <p className="font-black uppercase tracking-widest text-[var(--text-muted)]">Flashcards are being prepared...</p>
            </div>
        );
    }

    const currentCard = cards[currentIndex] ?? cards[0];
    const progress = Math.round(((knownCards.length + reviewCards.length) / cards.length) * 100);

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleKnown = () => {
        setDirection(1);
        if (!knownCards.includes(currentIndex)) setKnownCards([...knownCards, currentIndex]);
        setTimeout(nextCard, 200);
    };

    const handleReview = () => {
        setDirection(-1);
        if (!reviewCards.includes(currentIndex)) setReviewCards([...reviewCards, currentIndex]);
        setTimeout(nextCard, 200);
    };

    const nextCard = () => {
        setIsFlipped(false);
        setDirection(0);
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > 100) handleKnown();
        else if (info.offset.x < -100) handleReview();
    };

    const exportToAnki = () => {
        const tsvContent = cards.map((card) => `${card.term}\t${card.definition}`).join("\n");
        const blob = new Blob([tsvContent], { type: "text/tab-separated-values" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "edupod_flashcards.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-xl mx-auto font-mono">
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 border-2 border-[var(--border-main)] bg-[var(--bg-card)] shadow-[4px_4px_0px_var(--border-main)] relative overflow-hidden">
                <div className="flex justify-between items-end mb-2 relative z-10">
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Deck Progress</span>
                    <span className="text-2xl font-black italic text-[var(--primary)]">{progress}%</span>
                </div>
                <div className="h-4 w-full bg-[var(--bg-main)] border border-[var(--border-main)] relative p-0.5">
                    <motion.div className="h-full bg-[var(--primary)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
                <div className="flex gap-4 mt-2 text-[10px] uppercase font-bold tracking-widest">
                    <span className="text-green-500">Known: {knownCards.length}</span>
                    <span className="text-[var(--accent)]">Review: {reviewCards.length}</span>
                </div>
            </div>

            <div className="relative h-[320px] sm:h-[400px] perspective-1000">
                <motion.div
                    key={currentIndex}
                    initial={{ x: direction * 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -direction * 50, opacity: 0 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDrag}
                    onClick={handleFlip}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-full cursor-pointer relative preserve-3d transition-transform duration-500"
                    style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", transformStyle: "preserve-3d" }}
                >
                    <div className="absolute inset-0 backface-hidden">
                        <div className="h-full w-full bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[12px_12px_0px_0px_var(--border-main)] p-4 sm:p-8 flex flex-col items-center justify-center text-center hover:shadow-[16px_16px_0px_0px_var(--primary)] transition-shadow">
                            <span className="absolute top-6 left-6 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] border border-[var(--text-muted)] px-2 py-1 rounded-full">Term</span>
                            <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-[var(--text-main)] leading-tight">{currentCard?.term}</h3>
                            <div className="absolute bottom-6 flex items-center gap-2 text-[var(--text-muted)] text-xs font-bold uppercase animate-pulse">
                                <RotateCcw size={14} /> Tap to flip
                            </div>
                        </div>
                    </div>

                    <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(180deg)" }}>
                        <div className="h-full w-full bg-[var(--text-main)] border-4 border-[var(--border-main)] shadow-[12px_12px_0px_0px_var(--secondary)] p-4 sm:p-8 flex flex-col items-center justify-center text-center">
                            <span className="absolute top-6 right-6 text-xs font-black uppercase tracking-widest text-[var(--bg-main)] bg-[var(--primary)] px-2 py-1 border border-black">Definition</span>
                            <p className="text-base sm:text-xl font-bold leading-relaxed text-[var(--bg-main)]">{currentCard?.definition}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
                <button
                    onClick={handleReview}
                    className="touch-target flex items-center justify-center gap-2 p-4 border-2 border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--accent)] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all shadow-[4px_4px_0px_var(--border-main)] active:translate-y-1 active:shadow-none"
                >
                    <X size={20} /> Needs Review
                </button>
                <button
                    onClick={handleKnown}
                    className="touch-target flex items-center justify-center gap-2 p-4 border-2 border-[var(--border-main)] bg-[var(--bg-card)] text-green-500 font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all shadow-[4px_4px_0px_var(--border-main)] active:translate-y-1 active:shadow-none"
                >
                    <Check size={20} /> I Know It
                </button>
            </div>

            <div className="mt-8 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">Card {currentIndex + 1} / {cards.length}</div>

            <button onClick={exportToAnki} className="mt-4 w-full flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors text-xs font-bold uppercase">
                <Download size={14} /> Export Deck to Anki
            </button>
        </div>
    );
};

export default FlashcardDeck;
