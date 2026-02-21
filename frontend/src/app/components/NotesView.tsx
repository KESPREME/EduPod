"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

interface NotesViewProps {
    notes: string;
}

/**
 * Strips emoji, dingbats, symbols, and other non-Latin characters that
 * jsPDF's built-in helvetica font cannot render (they appear as garbled Ø=ÜØ).
 */
const stripEmojisAndSymbols = (text: string): string => {
    return text
        // Remove emoji (Unicode emoji ranges)
        .replace(/[\u{1F600}-\u{1F64F}]/gu, "")   // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")   // Misc Symbols & Pictographs
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")   // Transport & Map Symbols
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")   // Flags
        .replace(/[\u{2600}-\u{26FF}]/gu, "")      // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, "")      // Dingbats
        .replace(/[\u{FE00}-\u{FE0F}]/gu, "")      // Variation selectors
        .replace(/[\u{200D}]/gu, "")                // Zero width joiner
        .replace(/[\u{20E3}]/gu, "")                // Enclosing keycap
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")   // Supplemental Symbols
        .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")   // Chess Symbols
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")   // Symbols Extended-A
        .replace(/[\u{231A}-\u{231B}]/gu, "")      // Watch/Hourglass
        .replace(/[\u{23E9}-\u{23F3}]/gu, "")      // Media controls
        .replace(/[\u{23F8}-\u{23FA}]/gu, "")      // More media controls
        .replace(/[\u{25AA}-\u{25AB}]/gu, "")      // Squares
        .replace(/[\u{25B6}]/gu, "")                // Play button
        .replace(/[\u{25C0}]/gu, "")                // Reverse button
        .replace(/[\u{25FB}-\u{25FE}]/gu, "")      // Squares
        .replace(/[\u{2934}-\u{2935}]/gu, "")      // Arrows
        .replace(/[\u{2B05}-\u{2B07}]/gu, "")      // Arrows
        .replace(/[\u{2B1B}-\u{2B1C}]/gu, "")      // Squares
        .replace(/[\u{2B50}]/gu, "")                // Star
        .replace(/[\u{2B55}]/gu, "")                // Circle
        .replace(/[\u{3030}]/gu, "")                // Wavy dash
        .replace(/[\u{303D}]/gu, "")                // Part alternation mark
        .replace(/[\u{3297}]/gu, "")                // Circled Ideograph Congratulation
        .replace(/[\u{3299}]/gu, "")                // Circled Ideograph Secret
        .trim();
};

const markdownToPlainText = (markdown: string) => {
    return markdown
        // Strip code blocks
        .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, "").trim())
        // Convert markdown headers (potentially with emojis) to plain uppercase
        .replace(/^#{1,6}\s+/gm, "")
        // Remove bold formatting (** and __)
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        // Remove italic formatting (* and _)
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        // Remove any remaining stray asterisks
        .replace(/\*/g, "")
        // Inline code
        .replace(/`([^`]+)`/g, "$1")
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
        // List items
        .replace(/^\s*[-*+]\s+/gm, "- ")
        // Clean up whitespace
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
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 16;
            const contentWidth = pageWidth - margin * 2;
            const bodyLineHeight = 6;
            let y = margin;

            // Helper: check page break and add new page if needed
            const ensureSpace = (needed: number) => {
                if (y + needed > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
            };

            // --- Document Title ---
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(24);
            pdf.text("EduPod Study Notes", margin, y);
            y += 10;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
            y += 5;

            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 10;
            pdf.setTextColor(0, 0, 0);

            // --- Parse markdown line by line ---
            const cleanedNotes = stripEmojisAndSymbols(notes);
            const lines = cleanedNotes.split("\n");

            for (const rawLine of lines) {
                const line = rawLine.replace(/\*/g, "").trim();

                // Skip empty lines but add a small gap
                if (!line) {
                    y += 3;
                    continue;
                }

                // ## Section Header
                const headerMatch = line.match(/^#{1,3}\s+(.*)/);
                if (headerMatch) {
                    const headerText = headerMatch[1].trim();
                    if (!headerText) continue;

                    y += 6; // space before header
                    ensureSpace(14);

                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(16);
                    const wrappedHeader = pdf.splitTextToSize(headerText.toUpperCase(), contentWidth) as string[];
                    for (const hLine of wrappedHeader) {
                        ensureSpace(8);
                        pdf.text(hLine, margin, y);
                        y += 8;
                    }

                    // Underline the header
                    pdf.setDrawColor(180, 180, 180);
                    pdf.setLineWidth(0.3);
                    pdf.line(margin, y, margin + 60, y);
                    y += 5;
                    continue;
                }

                // - Bullet point
                const bulletMatch = line.match(/^[-*+]\s+(.*)/);
                if (bulletMatch) {
                    const bulletText = bulletMatch[1].trim();
                    if (!bulletText) continue;

                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(11);
                    const bulletIndent = margin + 4;
                    const bulletContentWidth = contentWidth - 4;
                    const wrappedBullet = pdf.splitTextToSize(bulletText, bulletContentWidth) as string[];

                    for (let i = 0; i < wrappedBullet.length; i++) {
                        ensureSpace(bodyLineHeight);
                        if (i === 0) {
                            pdf.text("-", margin, y); // safe bullet
                        }
                        pdf.text(wrappedBullet[i], bulletIndent, y);
                        y += bodyLineHeight;
                    }
                    y += 1; // small gap after bullet
                    continue;
                }

                // Regular paragraph text
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(11);
                const wrappedText = pdf.splitTextToSize(line, contentWidth) as string[];
                for (const tLine of wrappedText) {
                    ensureSpace(bodyLineHeight);
                    pdf.text(tLine, margin, y);
                    y += bodyLineHeight;
                }
                y += 1;
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
                    <article className="notes-article max-w-none mx-auto">
                        <ReactMarkdown>{notes}</ReactMarkdown>
                    </article>
                </div>
            </div>

            {pdfError && <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-center">Warning: {pdfError}</div>}
        </div>
    );
};

export default NotesView;
