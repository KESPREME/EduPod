"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileText, X, ArrowUpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
    onUpload: (file: File) => void;
    isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isProcessing }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf") {
                setFile(droppedFile);
            }
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    }, []);

    const handleSubmit = () => {
        if (file) {
            onUpload(file);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8">
            <motion.div
                layout
                className={`relative p-6 sm:p-12 border-4 border-dashed rounded-lg transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-pointer
                    ${dragActive
                        ? "border-[var(--primary)] bg-[var(--bg-card)] scale-[1.02] shadow-[var(--shadow-block)]"
                        : "border-[var(--text-muted)] bg-[var(--bg-card)] hover:border-[var(--text-main)] hover:bg-[var(--bg-main)]"
                    } ${isProcessing ? "opacity-50 pointer-events-none grayscale" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                animate={{
                    borderColor: dragActive ? "var(--primary)" : "var(--text-muted)",
                    backgroundColor: dragActive ? "var(--bg-card)" : "var(--bg-card)",
                }}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf"
                    onChange={handleChange}
                    disabled={isProcessing}
                />

                <div className="pointer-events-none flex flex-col items-center space-y-4">
                    <motion.div
                        animate={{ y: dragActive ? -10 : 0 }}
                        className="p-4 rounded-full bg-[var(--bg-main)] border-2 border-[var(--border-main)]"
                    >
                        {dragActive ? <ArrowUpCircle size={48} className="text-[var(--primary)]" /> : <Upload size={48} className="text-[var(--text-main)]" />}
                    </motion.div>

                    <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
                            {dragActive ? "Drop PDF Here" : "Upload Textbook Chapter"}
                        </h3>
                        <p className="text-sm sm:text-base text-[var(--text-muted)] font-medium">
                            Drag and drop your PDF here, or click to browse
                        </p>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {file && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="card-swiss bg-[var(--bg-card)] p-3 sm:p-4 flex items-center justify-between gap-2"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded">
                                <FileText className="w-8 h-8 text-[var(--accent)]" />
                            </div>
                            <div>
                                <p className="font-black text-[var(--text-main)] truncate max-w-[250px] md:max-w-md">{file.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">Ready to process</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="p-2 hover:bg-[var(--accent)] hover:text-white transition-colors rounded border-2 border-transparent hover:border-[var(--border-main)] text-[var(--text-muted)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleSubmit}
                disabled={!file || isProcessing}
                className={`touch-target w-full py-3 sm:py-4 text-base sm:text-xl font-black uppercase tracking-widest border-2 border-[var(--border-main)] transition-all
                    ${!file || isProcessing
                        ? "bg-[var(--bg-main)] text-[var(--text-muted)] cursor-not-allowed opacity-50"
                        : "bg-[var(--primary)] text-black shadow-[var(--shadow-block)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-block-hover)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                    }`}
            >
                {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin text-xl">O</span> Processing...
                    </span>
                ) : (
                    "Generate Podcast"
                )}
            </button>
        </div>
    );
};

export default FileUpload;
