"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Twitter, Linkedin } from "lucide-react";

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
        const text = encodeURIComponent("Check out this AI-generated podcast from EduPod! 🎧");
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
                className="flex items-center space-x-2 px-4 py-3 bg-accent-blue text-white font-black uppercase tracking-widest border-swiss shadow-swiss hover:bg-accent-blue/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
            </motion.button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-white border-swiss shadow-swiss p-4 z-50"
                >
                    <div className="text-xs font-black uppercase tracking-widest mb-3">Share this podcast</div>

                    {/* Copy link */}
                    <div className="flex items-center space-x-2 mb-4">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 px-3 py-2 text-xs font-mono border-2 border-black bg-gray-50"
                        />
                        <button
                            onClick={handleCopy}
                            className="p-2 border-2 border-black hover:bg-gray-100"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Social buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={shareToTwitter}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-[#1DA1F2] text-white text-xs font-bold"
                        >
                            <Twitter className="w-4 h-4" />
                            <span>Twitter</span>
                        </button>
                        <button
                            onClick={shareToLinkedin}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-[#0A66C2] text-white text-xs font-bold"
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
