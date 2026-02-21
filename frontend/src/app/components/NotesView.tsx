"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

interface NotesViewProps {
    notes: string;
}

const markdownToPlainText = (markdown: string) => {
    return markdown
        .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, "").trim())
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
        .replace(/^\s*[-*+]\s+/gm, "- ")
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const NotesView: React.FC<NotesViewProps> = ({ notes }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);

    const handleDownloadPDF = async () => {
        if (!notes || isGeneratingPdf) return;

        setIsGeneratingPdf(true);
        setPdfError(null);

        try {
            const plainText = markdownToPlainText(notes);
            if (!plainText) {
                throw new Error("No note content available for PDF export.");
            }

            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 14;
            const contentWidth = pageWidth - margin * 2;
            const lineHeight = 6;
            let y = margin;

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.text("EduPod Study Notes", margin, y);
            y += 8;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
            y += 6;

            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.4);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 8;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            const wrappedLines = pdf.splitTextToSize(plainText, contentWidth) as string[];

            for (const line of wrappedLines) {
                if (y > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text(line, margin, y);
                y += lineHeight;
            }

            pdf.save("EduPod_Study_Notes.pdf");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to generate PDF. Please try again.";
            console.error("PDF Generation failed:", err);
            setPdfError(errorMessage);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (!notes) {
        return (
            <div className="text-center py-20 opacity-50">
                <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                <p className="font-bold text-xl uppercase text-[var(--text-muted)]">No notes available yet</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-[var(--text-main)] drop-shadow-[2px_2px_0px_var(--primary)]">Study Notes</h2>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPdf}
                    className="touch-target flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-[var(--text-main)] text-[var(--bg-main)] font-bold uppercase tracking-widest border-2 border-[var(--border-main)] hover:bg-[var(--secondary)] hover:text-black hover:border-black transition-all shadow-[4px_4px_0px_0px_var(--border-main)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--border-main)] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                    {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    <span>{isGeneratingPdf ? "Generating PDF..." : "Download PDF"}</span>
                </button>
            </div>

            <div className="bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[12px_12px_0px_0px_var(--accent)] p-0 overflow-hidden text-[var(--text-main)]">
                <div className="h-4 bg-[var(--primary)] border-b-2 border-[var(--border-main)] flex items-center gap-1 px-2">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                </div>

                <div className="p-4 sm:p-8 md:p-12 min-h-[320px] sm:min-h-[400px]">
                    <article className="prose prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-strong:text-[var(--primary)] prose-li:text-[var(--text-main)] prose-blockquote:border-l-4 prose-blockquote:border-[var(--primary)] prose-blockquote:bg-[var(--bg-main)] prose-blockquote:p-4 prose-blockquote:not-italic prose-blockquote:text-[var(--text-main)] mx-auto">
                        <ReactMarkdown>{notes}</ReactMarkdown>
                    </article>
                </div>
            </div>

            {pdfError && <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-center">Warning: {pdfError}</div>}
        </div>
    );
};

export default NotesView;
