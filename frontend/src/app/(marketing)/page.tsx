"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Zap } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col font-sans transition-colors duration-300">
            {/* Header */}
            <header className="px-6 py-6 flex justify-between items-center border-b-2 border-[var(--border-main)] bg-[var(--bg-card)] sticky top-0 z-50 transition-colors duration-300">
                <div className="flex items-center gap-1 hover:scale-105 transition-transform duration-300 cursor-default group">
                    <span className="text-3xl font-black italic tracking-tighter uppercase text-black bg-[var(--primary)] px-2 py-0.5 rounded-sm shadow-[4px_4px_0px_0px_var(--text-main)] transition-all duration-300 group-hover:shadow-[6px_6px_0px_0px_var(--secondary)]">Edu</span>
                    <span className="text-3xl font-black tracking-tighter uppercase text-[var(--text-main)] transition-colors duration-300 group-hover:text-[var(--secondary)]">Pod.</span>
                </div>
                <div className="flex gap-4">
                    <Link href="/home" className="btn-neo">
                        Launch App
                    </Link>
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
                        <div className="flex gap-4">
                            <Link href="/home" className="px-8 py-4 bg-[var(--text-main)] text-[var(--bg-card)] font-black uppercase tracking-widest text-lg border-2 border-[var(--border-main)] hover:opacity-90 transition-all flex items-center gap-2 group shadow-[var(--shadow-block)] hover:shadow-[var(--shadow-block-hover)] hover:scale-105">
                                Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="px-8 py-4 bg-[var(--bg-card)] text-[var(--text-main)] font-black uppercase tracking-widest text-lg border-2 border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all shadow-[var(--shadow-block)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-block-hover)]">
                                Demo Video
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-[var(--primary)] border-2 border-[var(--border-main)] transform translate-x-4 translate-y-4 transition-colors duration-300 group-hover:translate-x-6 group-hover:translate-y-6 group-hover:rotate-1"></div>
                        <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border-main)] p-4 aspect-video flex items-center justify-center overflow-hidden transition-colors duration-300">
                            <div className="absolute inset-0 opacity-10 bg-[url('/dot-grid.png')]"></div>
                            {/* Simple visual representation of the app */}
                            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-main)] border-2 border-[var(--border-main)] border-dashed transition-colors duration-300 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
                                <span className="font-black text-4xl text-[var(--text-muted)] uppercase z-10 drop-shadow-md">App Preview</span>
                            </div>
                        </div>
                    </div>
                </section>

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
