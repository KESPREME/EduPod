"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import axios from "axios";

interface Message {
    role: "user" | "ai";
    content: string;
}

interface AITutorProps {
    jobId: string;
}

const AITutor: React.FC<AITutorProps> = ({ jobId }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hi! I'm your AI Tutor. Ask me anything about this lesson! 👋" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            // Build history for context
            const history = messages.slice(-6).map(m => [m.content, ""]); // Simple format adjustment

            const res = await axios.post("http://localhost:8005/ask_tutor", {
                job_id: jobId,
                question: userMsg,
                history: history
            });

            setMessages(prev => [...prev, { role: "ai", content: res.data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "ai", content: "⚠️ Sorry, I had trouble connecting. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto h-[600px] flex flex-col bg-[var(--bg-card)] border-4 border-[var(--border-main)] shadow-[12px_12px_0px_0px_var(--primary)]">
            {/* Header */}
            <div className="p-6 bg-[var(--text-main)] text-[var(--bg-main)] flex items-center gap-4 border-b-4 border-[var(--border-main)]">
                <div className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center border-2 border-[var(--bg-main)]">
                    <Bot className="text-black" size={24} />
                </div>
                <div>
                    <h3 className="font-black uppercase tracking-widest text-xl">AI Tutor</h3>
                    <p className="text-xs text-[var(--bg-main)]/80 font-bold uppercase tracking-wider">Online • Ready to help</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-main)]/50" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center border-2 border-[var(--border-main)] flex-shrink-0 shadow-[2px_2px_0px_0px_var(--border-main)]
                            ${msg.role === "ai" ? "bg-[var(--primary)] text-black" : "bg-[var(--bg-card)] text-[var(--text-main)]"}
                        `}>
                            {msg.role === "ai" ? <Bot size={20} /> : <User size={20} />}
                        </div>
                        <div className={`
                            max-w-[80%] p-5 text-sm font-bold leading-relaxed border-2 border-[var(--border-main)] shadow-[4px_4px_0px_0px_var(--border-main)]
                            ${msg.role === "ai"
                                ? "bg-[var(--bg-card)] text-[var(--text-main)] rounded-tr-xl rounded-br-xl rounded-bl-xl"
                                : "bg-[var(--text-main)] text-[var(--bg-main)] rounded-tl-xl rounded-bl-xl rounded-br-xl"}
                        `}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-black flex items-center justify-center border-2 border-[var(--border-main)]">
                            <Bot size={20} />
                        </div>
                        <div className="bg-[var(--bg-card)] p-4 border-2 border-[var(--border-main)] flex items-center gap-3 shadow-[4px_4px_0px_0px_var(--border-main)]">
                            <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
                            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Computing...</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-[var(--bg-card)] border-t-4 border-[var(--border-main)]">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask a question about the lesson..."
                        className="flex-1 w-full bg-[var(--bg-main)] border-2 border-[var(--border-main)] p-4 font-bold outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="p-4 bg-[var(--text-main)] text-[var(--bg-main)] border-2 border-[var(--border-main)] hover:bg-[var(--secondary)] hover:text-black hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_var(--border-main)] active:translate-y-1 active:shadow-none"
                    >
                        <Send size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AITutor;
