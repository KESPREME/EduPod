"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-80 max-w-[calc(100vw-2rem)]">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`
                                pointer-events-auto flex items-start gap-3 p-4 border-4 shadow-[4px_4px_0px_0px_var(--border-main)]
                                ${toast.type === "success" ? "bg-[#e8f5e9] border-[#2e7d32] text-[#1b5e20]" : ""}
                                ${toast.type === "error" ? "bg-[#ffebee] border-[#c62828] text-[#b71c1c]" : ""}
                                ${toast.type === "info" ? "bg-[#e3f2fd] border-[#1565c0] text-[#0d47a1]" : ""}
                            `}
                        >
                            <div className="shrink-0 mt-0.5">
                                {toast.type === "success" && <CheckCircle2 size={20} />}
                                {toast.type === "error" && <AlertCircle size={20} />}
                                {toast.type === "info" && <Info size={20} />}
                            </div>

                            <div className="flex-1 font-bold text-sm leading-tight pr-2">
                                {toast.message}
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
