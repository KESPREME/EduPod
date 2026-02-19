"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, FileText, Mic, Download, Share2 } from "lucide-react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[160] p-6"
                    >
                        <div className="card-swiss bg-white text-black max-h-[85vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_black]">
                                        <HelpCircle size={24} className="text-black" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">How to Use EduPod</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-black hover:text-white transition-colors rounded-full border-2 border-transparent hover:border-black"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <InstructionItem
                                        icon={<FileText size={20} />}
                                        title="1. Upload Content"
                                        desc="Start by uploading a PDF, text file, or pasting a URL. EduPod will analyze the content automatically."
                                        color="bg-blue-100"
                                    />
                                    <InstructionItem
                                        icon={<Mic size={20} />}
                                        title="2. Generate Audio"
                                        desc="Our AI hosts will turn your content into an engaging podcast. You can choose different languages and styles."
                                        color="bg-yellow-100"
                                    />
                                    <InstructionItem
                                        icon={<Download size={20} />}
                                        title="3. Download & Share"
                                        desc="Download your podcast as an MP3 audio file or an MP4 video to share on social media."
                                        color="bg-green-100"
                                    />
                                </div>

                                <div className="bg-black text-white p-6 border-2 border-[var(--primary)] shadow-[8px_8px_0px_var(--primary)]">
                                    <h3 className="font-black uppercase tracking-widest text-[var(--primary)] mb-2">Pro Tip</h3>
                                    <p className="font-medium text-sm leading-relaxed">
                                        Try the <strong>3D Classroom Mode</strong> for an immersive experience! You can switch between 2D and 3D views at any time during playback.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t-2 border-black flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-black text-white font-bold uppercase tracking-widest hover:bg-[var(--primary)] hover:text-black hover:shadow-[4px_4px_0px_black] border-2 border-black transition-all"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const InstructionItem = ({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) => (
    <div className={`flex items-start gap-4 p-4 rounded-xl border-2 border-black/10 hover:border-black hover:shadow-[4px_4px_0px_black] transition-all ${color} bg-opacity-50`}>
        <div className="p-2 bg-white border-2 border-black rounded-lg shadow-sm">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-lg uppercase tracking-tight mb-1">{title}</h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default HelpModal;
