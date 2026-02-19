"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, HelpCircle, ChevronRight, Trophy } from "lucide-react";

interface QuizQuestion {
    question: string;
    options: string[];
    correct: string;
    explanation: string;
}

interface QuizCardProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ questions, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const currentQuestion = questions[currentIndex];

    const handleAnswer = (answer: string) => {
        if (showResult) return;

        setSelectedAnswer(answer);
        setShowResult(true);

        const answerLetter = answer.charAt(0);
        if (answerLetter === currentQuestion.correct) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setCompleted(true);
            onComplete(score + (selectedAnswer?.charAt(0) === currentQuestion.correct ? 1 : 0));
        }
    };

    if (completed) {
        const finalScore = score;
        const percentage = Math.round((finalScore / questions.length) * 100);

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl mx-auto bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[12px_12px_0px_0px_var(--primary)] p-12 text-center"
            >
                <Trophy className={`w-24 h-24 mx-auto mb-6 ${percentage >= 70 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 text-[var(--text-main)]">Quiz Complete!</h2>
                <div className="inline-block bg-[var(--text-main)] text-[var(--bg-main)] px-6 py-2 text-6xl font-black mb-8 transform -rotate-2">
                    {percentage}%
                </div>
                <p className="text-xl font-bold uppercase tracking-widest text-[var(--text-main)] mb-8">
                    You got {finalScore} out of {questions.length} Correct
                </p>
                <button
                    onClick={() => {
                        setCurrentIndex(0);
                        setSelectedAnswer(null);
                        setShowResult(false);
                        setScore(0);
                        setCompleted(false);
                    }}
                    className="px-10 py-5 bg-[var(--secondary)] text-white border-2 border-[var(--border-main)] font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_var(--border-main)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--border-main)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--border-main)] transition-all"
                >
                    Try Again
                </button>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Steps / Progress */}
            <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Question {currentIndex + 1} / {questions.length}
                </span>
                <div className="flex gap-1">
                    {questions.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 w-8 border border-[var(--border-main)] transition-colors
                            ${idx < currentIndex ? "bg-[var(--primary)]" : idx === currentIndex ? "bg-[var(--secondary)]" : "bg-transparent"}`}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[12px_12px_0px_0px_var(--border-main)] p-8 md:p-12 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <HelpCircle size={100} className="text-[var(--text-main)]" />
                </div>

                {/* Question */}
                <h3 className="text-3xl font-black mb-10 leading-tight text-[var(--text-main)] relative z-10">
                    {currentQuestion.question}
                </h3>

                {/* Options */}
                <div className="space-y-4 relative z-10">
                    {currentQuestion.options.map((option, idx) => {
                        const optionLetter = option.charAt(0);
                        const isSelected = selectedAnswer === option;
                        const isCorrect = optionLetter === currentQuestion.correct;
                        const showCorrectness = showResult && isCorrect;
                        const showIncorrectness = showResult && isSelected && !isCorrect;

                        return (
                            <motion.button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                disabled={showResult}
                                whileHover={!showResult ? { x: 10, backgroundColor: "var(--primary)", color: "black", borderColor: "black" } : {}}
                                animate={{
                                    borderColor: showCorrectness ? "#22c55e" : showIncorrectness ? "#ef4444" : "var(--border-main)",
                                    backgroundColor: showCorrectness ? "#dcfce7" : showIncorrectness ? "#fee2e2" : "var(--bg-card)",
                                    color: (showCorrectness || showIncorrectness) ? "#000" : "var(--text-main)"
                                }}
                                className={`w-full text-left p-6 border-2 font-bold text-lg flex items-center justify-between group transition-all
                                ${isSelected ? 'shadow-[4px_4px_0px_0px_var(--border-main)] translate-x-1 translate-y-1' : 'hover:shadow-[4px_4px_0px_0px_var(--border-main)]'}`}
                            >
                                <span className={showCorrectness || showIncorrectness ? "font-black" : ""}>{option}</span>
                                {showResult && isCorrect && <CheckCircle className="w-8 h-8 text-green-600" />}
                                {showResult && isSelected && !isCorrect && <XCircle className="w-8 h-8 text-red-600" />}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 32 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="bg-[var(--bg-main)] border-2 border-[var(--border-main)] p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-[var(--primary)] border border-black shrink-0">
                                    <HelpCircle className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1 text-[var(--text-muted)]">Explanation</h4>
                                    <p className="text-md font-medium text-[var(--text-main)] italic">{currentQuestion.explanation}</p>
                                </div>
                            </div>

                            {/* Next Button */}
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-8 py-3 bg-[var(--text-main)] text-[var(--bg-main)] font-black uppercase tracking-widest border-2 border-[var(--border-main)] hover:bg-[var(--secondary)] hover:text-black hover:border-black transition-colors"
                                >
                                    <span>{currentIndex < questions.length - 1 ? "Next Question" : "See Results"}</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuizCard;
