"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Linkedin } from "lucide-react";

interface ShareButtonProps {
    jobId: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ jobId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/listen/${jobId}`
        : "";

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToTwitter = () => {
        const text = encodeURIComponent("Check out this AI-generated podcast from EduPod!");
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const shareToLinkedin = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="touch-target flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-accent-blue text-white font-black uppercase tracking-widest border-swiss shadow-swiss hover:bg-accent-blue/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
            </motion.button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] sm:w-72 bg-[var(--bg-card)] border-2 border-[var(--border-main)] shadow-[var(--shadow-block)] p-3 sm:p-4 z-50 text-[var(--text-main)]"
                >
                    <div className="text-xs font-black uppercase tracking-widest mb-3 text-[var(--text-muted)]">Share this podcast</div>

                    {/* Copy link */}
                    <div className="flex items-center space-x-2 mb-4">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 min-w-0 px-2 sm:px-3 py-2 text-xs font-mono border-2 border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors"
                        />
                        <button
                            onClick={handleCopy}
                            className="p-2 border-2 border-[var(--border-main)] hover:bg-[var(--bg-main)] text-[var(--text-main)] transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Social buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={shareToTwitter}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-black text-white text-xs font-bold hover:brightness-125 transition-all border-2 border-transparent hover:border-[var(--border-main)]"
                        >
                            {/* X Logo SVG */}
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>X</span>
                        </button>
                        <button
                            onClick={shareToLinkedin}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-[#0A66C2] text-white text-xs font-bold hover:brightness-110 transition-all border-2 border-transparent hover:border-[var(--border-main)]"
                        >
                            <Linkedin className="w-4 h-4" />
                            <span>LinkedIn</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ShareButton;
