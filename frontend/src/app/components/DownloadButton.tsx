"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileAudio, Video, Loader2 } from "lucide-react";
import axios from "axios";

interface DownloadButtonProps {
    jobId: string;
    audioUrl: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ jobId, audioUrl }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    const handleDownloadAudio = () => {
        const link = document.createElement("a");
        link.href = audioUrl;
        link.download = `EduPod_Lesson_${jobId.slice(0, 8)}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsOpen(false);
    };

    const handleDownloadVideo = async () => {
        try {
            setIsGeneratingVideo(true);
            const response = await axios.post(`http://localhost:8005/generate_video/${jobId}`);

            if (response.data.url) {
                const videoUrl = `http://localhost:8005${response.data.url}`;
                const link = document.createElement("a");
                link.href = videoUrl;
                link.download = `EduPod_Lesson_${jobId.slice(0, 8)}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error("Video generation failed", error);
            alert("Failed to generate video. Please try again.");
        } finally {
            setIsGeneratingVideo(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-3 bg-[var(--primary)] text-black font-black uppercase tracking-widest border-swiss shadow-swiss hover:bg-[var(--primary)]/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
                <Download className="w-5 h-5" />
                <span>Download</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-[var(--bg-card)] border-2 border-[var(--border-main)] shadow-[var(--shadow-block)] z-50 overflow-hidden"
                    >
                        <div className="flex flex-col">
                            <button
                                onClick={handleDownloadAudio}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-main)] transition-colors text-left border-b border-[var(--border-main)] text-[var(--text-main)]"
                            >
                                <FileAudio size={18} className="text-[var(--secondary)]" />
                                <span className="font-bold text-sm uppercase">Audio (MP3)</span>
                            </button>

                            <button
                                onClick={handleDownloadVideo}
                                disabled={isGeneratingVideo}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-main)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-main)]"
                            >
                                {isGeneratingVideo ? (
                                    <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                                ) : (
                                    <Video size={18} className="text-[var(--accent)]" />
                                )}
                                <span className="font-bold text-sm uppercase">
                                    {isGeneratingVideo ? "Generating..." : "Video (MP4)"}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DownloadButton;
