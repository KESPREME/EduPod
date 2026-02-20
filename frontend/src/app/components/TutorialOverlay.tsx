"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, LayoutDashboard, Plus, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabase";

const steps = [
    {
        title: "Welcome to EduPod",
        description: "Let's take a quick tour of your new learning hub.",
        icon: LayoutDashboard,
        color: "var(--primary)"
    },
    {
        title: "Your Library",
        description: "All your generated podcasts, quizzes, and 3D classrooms live here.",
        icon: BookOpen,
        color: "var(--secondary)"
    },
    {
        title: "Create a Lesson",
        description: "Upload any PDF to instantly turn it into an interactive audio experience.",
        icon: Plus,
        color: "var(--accent)"
    }
];

export default function TutorialOverlay() {
    const { user, isGuest } = useAuth();
    const [show, setShow] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const checkTutorialState = async () => {
            // Guests don't get the saved tutorial, and if locally flagged, skip
            if (!user || isGuest) return;
            if (localStorage.getItem(`tutorial_completed_${user.id}`) === "true") {
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("users")
                    .select("has_completed_tutorial")
                    .eq("id", user.id)
                    .single();

                if (!error && data && !data.has_completed_tutorial) {
                    setShow(true);
                } else if (error && error.code === 'PGRST116') {
                    // Profile might not exist yet if the trigger just fired, check again or assume true
                    setShow(true);
                } else if (!error && data && data.has_completed_tutorial) {
                    // Sync local storage if db says true
                    localStorage.setItem(`tutorial_completed_${user.id}`, "true");
                }
            } catch (err) {
                console.error("Error checking tutorial state:", err);
            }
        };

        checkTutorialState();
    }, [user, isGuest]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeTutorial();
        }
    };

    const completeTutorial = async () => {
        setShow(false);
        if (user && !isGuest) {
            localStorage.setItem(`tutorial_completed_${user.id}`, "true");
            await supabase
                .from("users")
                .upsert({ id: user.id, has_completed_tutorial: true })
                .eq("id", user.id);
        }
    };

    if (!show) return null;

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-[var(--bg-card)] border-4 border-[var(--border-main)] p-8 md:p-12 relative shadow-[16px_16px_0px_0px_var(--border-main)]"
                >
                    {/* Decorative Background Icon */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 border-4 border-[var(--border-main)] flex items-center justify-center rotate-12 bg-[var(--bg-main)] shadow-[8px_8px_0px_0px_var(--border-main)]" style={{ backgroundColor: step.color }}>
                        <Icon size={48} className="text-black" />
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex gap-2 mb-8">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-3 flex-1 border-2 border-[var(--border-main)] transition-colors duration-300 ${idx <= currentStep ? "bg-[var(--text-main)]" : "bg-transparent"}`}
                                style={{ backgroundColor: idx <= currentStep ? step.color : "transparent" }}
                            />
                        ))}
                    </div>

                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-main)] leading-none">{step.title}</h2>
                    <p className="text-xl font-medium text-[var(--text-muted)] mb-10 leading-relaxed border-l-4 border-[var(--border-main)] pl-4" style={{ borderColor: step.color }}>
                        {step.description}
                    </p>

                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-dashed border-[var(--border-main)]">
                        <button
                            onClick={completeTutorial}
                            className="font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        >
                            Skip
                        </button>

                        <button
                            onClick={handleNext}
                            className="px-8 py-4 text-black font-black uppercase tracking-widest border-2 border-black shadow-[6px_6px_0px_0px_black] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_black] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_black] transition-all flex items-center gap-2"
                            style={{ backgroundColor: step.color }}
                        >
                            {currentStep === steps.length - 1 ? (
                                <><span>Get Started</span> <Check size={20} /></>
                            ) : (
                                <><span>Next</span> <ArrowRight size={20} /></>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
