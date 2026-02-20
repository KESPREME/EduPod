"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Zap, FileText, Cpu, Headphones, Box, HelpCircle, PlayCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
    const { user, loading } = useAuth();
    const [showSample, setShowSample] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col font-sans transition-colors duration-300">
            {/* Header */}
            <header className="px-6 py-6 flex justify-between items-center border-b-2 border-[var(--border-main)] bg-[var(--bg-card)] sticky top-0 z-50 transition-colors duration-300">
                <div className="flex items-center gap-1 hover:scale-105 transition-transform duration-300 cursor-default group">
                    <span className="text-3xl font-black italic tracking-tighter uppercase text-black bg-[var(--primary)] px-2 py-0.5 rounded-sm shadow-[4px_4px_0px_0px_var(--text-main)] transition-all duration-300 group-hover:shadow-[6px_6px_0px_0px_var(--secondary)]">Edu</span>
                    <span className="text-3xl font-black tracking-tighter uppercase text-[var(--text-main)] transition-colors duration-300 group-hover:text-[var(--secondary)]">Pod.</span>
                </div>
                <div className="flex gap-4">
                    {!loading && (
                        <Link href={user ? "/home" : "/login"} className="btn-neo">
                            {user ? "Dashboard" : "Log In"}
                        </Link>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="px-6 py-20 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-block bg-[var(--accent)] text-white px-4 py-1 font-black uppercase tracking-widest text-sm border-2 border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--shadow-color)] transform -rotate-2">
                            New: V2 Released
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-[var(--text-main)] transition-colors duration-300 drop-shadow-lg">
                            Turn Text<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--secondary)] to-[var(--accent)] paint-order-stroke stroke-[var(--text-main)]" style={{ WebkitTextStroke: '1px var(--text-main)', filter: 'drop-shadow(0 0 5px var(--secondary))' }}>Into Life.</span>
                        </h1>
                        <p className="text-xl font-medium text-[var(--text-muted)] max-w-md border-l-4 border-[var(--primary)] pl-6 transition-colors duration-300">
                            Transform boring PDFs into immersive, 3D classroom experiences with AI-powered teachers.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {!loading && (
                                <Link href={user ? "/home" : "/login"} className="px-8 py-4 bg-[var(--text-main)] text-[var(--bg-card)] font-black uppercase tracking-widest text-lg border-2 border-[var(--border-main)] hover:opacity-90 transition-all flex items-center gap-2 group shadow-[var(--shadow-block)] hover:shadow-[var(--shadow-block-hover)] hover:scale-105">
                                    {user ? "Dashboard Open" : "Get Started"} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}
                            <button
                                onClick={() => setShowSample(true)}
                                className="px-8 py-4 bg-[var(--bg-card)] text-[var(--text-main)] font-black uppercase tracking-widest text-lg border-2 border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all shadow-[var(--shadow-block)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-block-hover)] flex items-center gap-2 group">
                                <PlayCircle className="w-6 h-6 group-hover:text-[var(--primary)] transition-colors" /> See Sample Output
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center group w-full h-full">
                        <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-[var(--primary)] border-2 border-[var(--border-main)] transform translate-x-3 translate-y-3 transition-colors duration-300 group-hover:translate-x-4 group-hover:translate-y-4"></div>
                            <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border-main)] p-6 md:p-8 w-full h-full flex flex-col overflow-hidden transition-colors duration-300">
                                <div className="absolute inset-0 opacity-10 bg-[url('/dot-grid.png')] pointer-events-none"></div>

                                <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] mb-6 z-10 text-center border-b-4 border-[var(--primary)] pb-4 inline-block mx-auto">How It Works</h3>

                                <div className="flex flex-col gap-4 z-10 w-full mb-2 flex-grow">
                                    {/* Step 1: Upload */}
                                    <div className="flex items-center gap-4 bg-[var(--bg-main)] p-4 rounded-xl border-2 border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-transform hover:-translate-y-1 group/step">
                                        <div className="w-12 h-12 min-w-[3rem] bg-[var(--bg-card)] text-[var(--text-main)] rounded-lg flex items-center justify-center border-2 border-[var(--border-main)] font-black text-xl group-hover/step:bg-[var(--primary)] group-hover/step:text-black transition-colors">1</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-lg text-[var(--text-main)] leading-tight truncate">Upload PDF</h4>
                                            <p className="text-sm text-[var(--text-muted)] mt-1 truncate">Drop any document or text</p>
                                        </div>
                                        <FileText className="w-8 h-8 text-[var(--text-main)] opacity-50 group-hover/step:opacity-100 group-hover/step:text-[var(--primary)] transition-all shrink-0" />
                                    </div>

                                    {/* Connecting Line */}
                                    <div className="w-1 h-3 bg-[var(--border-main)] mx-auto opacity-50"></div>

                                    {/* Step 2: AI Processing */}
                                    <div className="flex items-center gap-4 bg-[var(--bg-main)] p-4 rounded-xl border-2 border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-transform hover:-translate-y-1 group/step">
                                        <div className="w-12 h-12 min-w-[3rem] bg-[var(--bg-card)] text-[var(--text-main)] rounded-lg flex items-center justify-center border-2 border-[var(--border-main)] font-black text-xl group-hover/step:bg-[var(--secondary)] group-hover/step:text-[var(--bg-main)] transition-colors">2</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-lg text-[var(--text-main)] leading-tight truncate">AI Generation</h4>
                                            <div className="flex items-center gap-2 mt-1 truncate">
                                                <div className="h-1.5 w-16 bg-[var(--border-main)] rounded-full overflow-hidden shrink-0">
                                                    <div className="h-full bg-[var(--secondary)] animate-[shimmer_1.5s_infinite] w-full origin-left"></div>
                                                </div>
                                                <span className="text-xs font-bold text-[var(--secondary)]">Processing...</span>
                                            </div>
                                        </div>
                                        <Cpu className="w-8 h-8 text-[var(--text-main)] opacity-50 group-hover/step:opacity-100 group-hover/step:text-[var(--secondary)] group-hover/step:animate-[spin_4s_linear_infinite] transition-all shrink-0" />
                                    </div>

                                    <div className="w-1 h-3 bg-[var(--border-main)] mx-auto opacity-50"></div>

                                    {/* Step 3: Outputs */}
                                    <div className="flex items-center gap-4 bg-[var(--bg-main)] p-4 rounded-xl border-2 border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-transform hover:-translate-y-1 group/step">
                                        <div className="w-12 h-12 min-w-[3rem] bg-[var(--bg-card)] text-[var(--text-main)] rounded-lg flex items-center justify-center border-2 border-[var(--border-main)] font-black text-xl group-hover/step:bg-[var(--accent)] group-hover/step:text-white transition-colors">3</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-lg text-[var(--text-main)] leading-tight truncate">Learn & Play</h4>
                                            <div className="flex gap-2 mt-2">
                                                <div className="bg-[var(--bg-card)] p-1.5 border border-[var(--border-main)] rounded text-[var(--text-muted)] group-hover/step:text-[var(--primary)] transition-colors shadow-sm"><Headphones className="w-4 h-4 shrink-0" /></div>
                                                <div className="bg-[var(--bg-card)] p-1.5 border border-[var(--border-main)] rounded text-[var(--text-muted)] group-hover/step:text-[var(--secondary)] transition-colors shadow-sm"><Box className="w-4 h-4 shrink-0" /></div>
                                                <div className="bg-[var(--bg-card)] p-1.5 border border-[var(--border-main)] rounded text-[var(--text-muted)] group-hover/step:text-[var(--accent)] transition-colors shadow-sm"><HelpCircle className="w-4 h-4 shrink-0" /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm font-bold text-[var(--text-muted)] italic text-center w-full bg-[var(--bg-main)] py-2 border-2 border-[var(--border-main)] border-dashed rounded-lg">
                                    Document to immersive lesson in &lt;30s
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sample Video Modal */}
                {showSample && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm md:p-8">
                        <div className="bg-[var(--bg-main)] border-4 border-[var(--border-main)] w-full max-w-6xl relative shadow-[16px_16px_0px_0px_var(--primary)] flex flex-col max-h-[90vh] md:h-[80vh] animate-in fade-in zoom-in duration-300 rounded-xl overflow-hidden">
                            {/* Window Header */}
                            <div className="bg-[var(--bg-card)] border-b-4 border-[var(--border-main)] px-4 py-3 flex justify-between items-center text-[var(--text-main)] z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5 shrink-0">
                                        <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[var(--border-main)]"></div>
                                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-[var(--border-main)]"></div>
                                        <div className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[var(--border-main)]"></div>
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-sm flex items-center gap-2 ml-2 truncate">
                                        <PlayCircle className="w-4 h-4 text-[var(--primary)] shrink-0" /> EduPod Live Experience
                                    </span>
                                </div>
                                <button onClick={() => setShowSample(false)} className="hover:text-[var(--accent)] hover:bg-[var(--bg-main)] p-1 rounded transition-colors shrink-0">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Window Body */}
                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[var(--bg-main)] relative min-h-0">
                                {/* Left Pane: PDF/Document */}
                                <div className="hidden md:flex flex-col w-1/3 min-w-[300px] border-r-4 border-[var(--border-main)] bg-[var(--bg-card)] p-6 relative overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-6 border-b-2 border-[var(--border-main)] pb-4 shrink-0">
                                        <FileText className="w-6 h-6 text-[var(--primary)] shrink-0" />
                                        <h4 className="font-bold text-lg text-[var(--text-main)] truncate">Biology_Chapter_3.pdf</h4>
                                    </div>
                                    <div className="space-y-5 opacity-70">
                                        <div className="h-6 bg-[var(--border-main)] rounded w-3/4"></div>
                                        <div className="space-y-3">
                                            <div className="h-3 bg-[var(--text-muted)] rounded w-full"></div>
                                            <div className="h-3 bg-[var(--text-muted)] rounded w-5/6"></div>
                                            <div className="h-3 bg-[var(--text-muted)] rounded w-full"></div>
                                            <div className="h-3 bg-[var(--text-muted)] rounded w-4/5"></div>
                                        </div>
                                        <div className="h-20 bg-[var(--primary)]/20 border-2 border-[var(--primary)] rounded w-full relative overflow-hidden flex items-center justify-center">
                                            <span className="font-bold text-[var(--primary)] uppercase text-sm">Figure 3.1: Powerhouse</span>
                                            <div className="absolute inset-0 bg-[var(--primary)]/10 w-1/2 animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-3 bg-[var(--text-muted)] rounded w-full"></div>
                                            <div className="h-3 bg-[var(--secondary)] rounded-full w-3/4 relative overflow-hidden mt-4">
                                                <div className="absolute top-0 bottom-0 left-0 bg-[var(--secondary)] animate-pulse w-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 flex items-center gap-3 border-t-2 border-[var(--border-main)] shrink-0">
                                        <div className="p-2 bg-[var(--accent)] rounded-lg border-2 border-[var(--border-main)] shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                                            <Cpu className="text-white w-5 h-5 animate-[spin_3s_linear_infinite]" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-[var(--text-main)] uppercase block leading-tight">AI Analyzing</span>
                                            <span className="text-xs font-medium text-[var(--text-muted)]">Generating 3D Lesson...</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Pane: Interactive Lesson */}
                                <div className="flex-1 flex flex-col p-4 md:p-6 gap-6 bg-[var(--bg-main)] relative overflow-y-auto">

                                    {/* 3D Classroom Viewport */}
                                    <div className="bg-[var(--bg-card)] border-4 border-[var(--border-main)] rounded-2xl aspect-video md:aspect-[21/9] lg:aspect-[2/1] min-h-[250px] flex items-center justify-center relative overflow-hidden shadow-[8px_8px_0px_0px_var(--shadow-color)] shrink-0">
                                        <div className="absolute inset-0 opacity-10 bg-[url('/dot-grid.png')] pointer-events-none"></div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-card)] opacity-80 pointer-events-none"></div>

                                        {/* Virtual Teacher Indicator */}
                                        <div className="absolute top-4 right-4 bg-[var(--bg-main)] border-2 border-[var(--border-main)] px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></div>
                                            AI Teacher Active
                                        </div>

                                        {/* Abstract 3D Teacher Concept */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="w-24 h-24 bg-[var(--primary)] border-4 border-[var(--border-main)] rounded-full flex items-center justify-center animate-bounce shadow-[0_10px_30px_rgba(var(--primary-rgb),0.5)] z-10">
                                                <Box className="w-12 h-12 text-[var(--bg-card)]" />
                                            </div>

                                            {/* Audio waves */}
                                            <div className="flex items-end justify-center gap-1.5 mt-4 h-12 bg-[var(--bg-card)] border-2 border-[var(--border-main)] px-6 py-2 rounded-full shadow-[4px_4px_0px_0px_var(--shadow-color)]">
                                                {[3, 5, 2, 7, 4, 8, 3, 5, 2, 6, 3].map((n, i) => (
                                                    <div key={i} className="w-1.5 bg-[var(--text-main)] rounded-full animate-pulse" style={{ height: `${n * 10}%`, animationDelay: `${i * 100}ms` }}></div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 left-4 bg-[var(--secondary)] text-white border-2 border-[var(--border-main)] px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-3 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
                                            <Headphones className="w-5 h-5 shrink-0" />
                                            <span className="truncate max-w-[200px]">"The mitochondria is the..."</span>
                                        </div>
                                    </div>

                                    {/* Quiz Section */}
                                    <div className="bg-[var(--accent)] border-4 border-[var(--border-main)] rounded-2xl p-5 md:p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)] mt-auto shrink-0 relative overflow-hidden group/opt z-10">
                                        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                                        <div className="flex items-center gap-3 mb-4 relative z-10">
                                            <div className="p-2 bg-white rounded-lg shadow-sm border-2 border-[var(--border-main)]">
                                                <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
                                            </div>
                                            <h4 className="font-black text-white text-xl uppercase tracking-wider">Pop Quiz!</h4>
                                        </div>
                                        <p className="text-white font-bold text-lg md:text-xl mb-6 relative z-10 leading-snug">Based on the text, what is the primary function of the <span className="underline decoration-wavy decoration-white/50 underline-offset-4">mitochondria</span>?</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                                            {['Energy Production', 'Cell Division', 'Protein Synthesis', 'Waste Removal'].map((opt, i) => (
                                                <button key={i} className="bg-[var(--bg-card)] border-2 border-[var(--border-main)] text-[var(--text-main)] font-bold py-3 px-4 rounded-xl hover:bg-[var(--primary)] hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--border-main)] transition-all text-left flex justify-between items-center group w-full">
                                                    <span className="truncate mr-2">{opt}</span>
                                                    {i === 0 && <span className="w-5 h-5 shrink-0 rounded-full border-2 border-[var(--border-main)] group-hover:bg-[var(--text-main)] transition-colors relative"><span className="absolute inset-0 m-auto w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100"></span></span>}
                                                    {i !== 0 && <span className="w-5 h-5 shrink-0 rounded-full border-2 border-[var(--border-main)] bg-[var(--bg-main)]"></span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Features Grid */}
                <section className="bg-[var(--bg-card)] border-t-2 border-[var(--border-main)] py-20 transition-colors duration-300">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-8 border-2 border-[var(--border-main)] hover:shadow-[8px_8px_0px_0px_var(--secondary)] transition-all bg-[var(--bg-main)] hover:-translate-y-2 card-swiss">
                                <BookOpen className="w-12 h-12 mb-6 text-[var(--secondary)]" />
                                <h3 className="text-2xl font-black uppercase mb-2 text-[var(--text-main)]">PDF to Audio</h3>
                                <p className="font-medium text-[var(--text-muted)]">Instantly convert any textbook into an engaging audio lesson with multiple speakers.</p>
                            </div>
                            <div className="p-8 border-2 border-[var(--border-main)] hover:shadow-[8px_8px_0px_0px_var(--primary)] transition-all bg-[var(--bg-main)] hover:-translate-y-2 card-swiss">
                                <Layers className="w-12 h-12 mb-6 text-[var(--text-main)]" />
                                <h3 className="text-2xl font-black uppercase mb-2 text-[var(--text-main)]">3D Classroom</h3>
                                <p className="font-medium text-[var(--text-muted)]">Watch your lesson come to life with animated 3D avatars in a virtual classroom.</p>
                            </div>
                            <div className="p-8 border-2 border-[var(--border-main)] hover:shadow-[8px_8px_0px_0px_var(--accent)] transition-all bg-[var(--bg-main)] hover:-translate-y-2 card-swiss">
                                <Zap className="w-12 h-12 mb-6 text-[var(--accent)]" />
                                <h3 className="text-2xl font-black uppercase mb-2 text-[var(--text-main)]">Interactive Quiz</h3>
                                <p className="font-medium text-[var(--text-muted)]">Test your knowledge immediately after listening with AI-generated quizzes.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-black text-white border-t-2 border-[var(--border-main)] py-12 text-center transition-colors duration-300 dark:border-white">
                <p className="font-black uppercase tracking-widest text-sm text-[var(--primary)]">© 2025 EduPod V2. Built for Builders.</p>
            </footer>
        </div>
    );
}
