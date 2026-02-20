"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const { signInWithGoogle, signInAsGuest } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { email } }
                });
                if (error) throw error;
                // Auto sign in or redirect
                window.location.href = '/home';
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                window.location.href = '/home';
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-4">
            <a href="/" className="absolute top-8 left-8 flex items-center gap-2 font-black uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
                <ArrowLeft size={24} /> Back
            </a>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[12px_12px_0px_0px_var(--border-main)] p-8 md:p-12 relative"
            >
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[var(--accent)] border-4 border-[var(--border-main)] flex items-center justify-center rotate-12 z-10">
                    <UserIcon size={32} className="text-black" />
                </div>

                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-[var(--text-main)]">
                    {isSignUp ? "Join EduPod" : "Welcome Back"}
                </h1>
                <p className="text-[var(--text-muted)] font-medium mb-8">
                    {isSignUp ? "Sign up to save your lessons." : "Log in to access your saved lessons."}
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-sm uppercase">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-black uppercase tracking-widest mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[var(--bg-main)] border-2 border-[var(--border-main)] p-4 font-bold text-lg focus:outline-none focus:border-[var(--primary)] focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all"
                            placeholder="you@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-black uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[var(--bg-main)] border-2 border-[var(--border-main)] p-4 font-bold text-lg focus:outline-none focus:border-[var(--primary)] focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[var(--secondary)] text-white font-black uppercase tracking-widest border-2 border-[var(--border-main)] shadow-[6px_6px_0px_0px_var(--border-main)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--border-main)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--border-main)] transition-all flex justify-center items-center h-14"
                    >
                        {loading ? <span className="animate-spin text-2xl">⏳</span> : (isSignUp ? "Create Account" : "Sign In")}
                    </button>
                </form>

                <div className="my-8 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-[var(--border-main)] border-dashed"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-[var(--bg-card)] px-4 font-black text-sm uppercase text-[var(--text-muted)]">OR</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={signInWithGoogle}
                        type="button"
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-[2px_2px_0px_0px_black] transition-all flex items-center justify-center gap-3"
                    >
                        {/* Google G Logo SVG */}
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            <path fill="none" d="M1 1h22v22H1z" />
                        </svg>
                        Continue with Google
                    </button>

                    <button
                        onClick={async () => {
                            await signInAsGuest();
                            window.location.href = '/home';
                        }}
                        type="button"
                        className="w-full py-4 bg-[var(--bg-main)] text-[var(--text-main)] font-black uppercase tracking-widest border-2 border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--border-main)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--border-main)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_var(--border-main)] transition-all"
                    >
                        Continue as Guest
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                        className="font-bold underline uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    >
                        {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
