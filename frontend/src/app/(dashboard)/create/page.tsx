"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "../../components/FileUpload"; // Adjusted path
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

const BACKEND_URL = "http://localhost:8005"; // Revert to 8005

export default function CreateLessonPage() {
    const router = useRouter();
    const { preferences } = useSettings();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (file: File) => {
        setIsProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        // Defaulting language to english for now, could add selector here later
        formData.append("language", "en");
        formData.append("tts_provider", preferences.ttsProvider || "chatterbox");

        try {
            const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 120000
            });

            const jobId = response.data.job_id;

            // On success, save preliminary info to local storage for "recent lessons"
            // Note: The main metadata comes from backend, but we store creation intent here
            const existing = localStorage.getItem("edupod_lessons");
            const lessons = existing ? JSON.parse(existing) : [];

            // We don't have full metadata yet, but we'll create a placeholder
            // The real lesson data will be populated when the backend finishes
            //Ideally backend handles persistence, but for this MVP we rely on localStorage
            const newLesson = {
                id: jobId,
                title: file.name.replace(".pdf", ""),
                date: new Date().toISOString(),
                duration: 600, // Placeholder
                language: "en"
            };

            localStorage.setItem("edupod_lessons", JSON.stringify([newLesson, ...lessons]));

            // Redirect to the lesson page (which will poll for status)
            router.push(`/lesson/${jobId}`);

        } catch (error) {
            console.error("Upload failed", error);
            setError("Failed to upload file. Please ensure the backend is running.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            <button
                onClick={() => router.back()}
                className="mb-8 flex items-center gap-2 font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
                <ChevronLeft size={20} />
                Back
            </button>

            <div className="mb-12 text-center">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-main)]">Create New Lesson</h1>
                <p className="text-xl text-[var(--text-muted)] font-medium">Upload a PDF chapter to generate an interactive audio lesson.</p>
            </div>

            <FileUpload onUpload={handleUpload} isProcessing={isProcessing} />

            {error && (
                <div className="mt-6 p-4 border-2 border-black bg-[#FF4D4D] text-white font-bold text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
