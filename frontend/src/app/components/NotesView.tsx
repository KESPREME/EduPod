"use client";

import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface NotesViewProps {
    notes: string;
}

const NotesView: React.FC<NotesViewProps> = ({ notes }) => {
    const notesRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);

    const handleDownloadPDF = async () => {
        if (!notesRef.current || isGeneratingPdf) return;
        setIsGeneratingPdf(true);
        setPdfError(null);

        try {
            const element = notesRef.current;

            element.style.position = "absolute";
            element.style.left = "0";
            element.style.top = "0";
            element.style.zIndex = "-9999";
            document.body.appendChild(element);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: "#ffffff",
                logging: false,
                useCORS: true,
                allowTaint: true,
                windowWidth: 800,
                windowHeight: element.scrollHeight,
            });

            document.querySelector(".print-container-parent")?.appendChild(element);
            element.style.position = "";
            element.style.left = "-9999px";
            element.style.zIndex = "";

            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error("Canvas rendering failed - empty result");
            }

            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 1.8;
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;

            let yPosition = 0;
            let remainingHeight = scaledHeight;

            pdf.addImage(imgData, "PNG", 0, yPosition, scaledWidth, scaledHeight);
            remainingHeight -= pdfHeight;

            while (remainingHeight > 0) {
                yPosition -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, yPosition, scaledWidth, scaledHeight);
                remainingHeight -= pdfHeight;
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

            <div className="print-container-parent absolute top-0 left-[-9999px]">
                <div ref={notesRef} className="w-[800px] min-h-[1100px] bg-white text-black p-16 font-sans border border-gray-200">
                    <div className="mb-12 border-b-4 border-black pb-6 flex justify-between items-end">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-black">
                            Study<span style={{ color: "#FFDE59" }}>Notes</span>
                        </h1>
                        <span className="font-bold font-mono text-sm uppercase text-gray-600">EduPod Generated</span>
                    </div>

                    <article
                        className="prose prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-black prose-p:text-black prose-li:text-black prose-blockquote:border-l-8 prose-blockquote:bg-gray-50 prose-blockquote:p-6 prose-blockquote:not-italic prose-blockquote:text-gray-700"
                        style={{ "--tw-prose-strong": "#5E17EB" } as React.CSSProperties}
                    >
                        <ReactMarkdown>{notes}</ReactMarkdown>
                    </article>

                    <div className="mt-20 pt-6 border-t-2 border-gray-200 text-center text-xs font-bold uppercase text-gray-400">Generated by EduPod AI | Learning Redefined</div>
                </div>
            </div>
        </div>
    );
};

export default NotesView;
