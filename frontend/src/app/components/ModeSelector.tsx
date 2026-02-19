"use client";

import React from "react";
import { motion } from "framer-motion";
import { Headphones, Users, PenTool, Sparkles } from "lucide-react";

export type ViewMode = "audio" | "classroom" | "whiteboard" | "full";

interface ModeSelectorProps {
    selectedMode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

const modes = [
    { id: "audio" as ViewMode, label: "Audio Only", icon: Headphones, description: "Simple podcast playback" },
    { id: "classroom" as ViewMode, label: "Classroom", icon: Users, description: "Animated teacher & student" },
    { id: "whiteboard" as ViewMode, label: "Whiteboard", icon: PenTool, description: "Math & diagrams" },
    { id: "full" as ViewMode, label: "Full Experience", icon: Sparkles, description: "Everything combined" },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onModeChange }) => {
    return (
        <div className="w-full max-w-4xl mx-auto mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-center">Choose Your Experience</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {modes.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.id;

                    return (
                        <motion.button
                            key={mode.id}
                            onClick={() => onModeChange(mode.id)}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                relative p-4 border-swiss transition-all duration-200
                ${isSelected
                                    ? 'bg-black text-white shadow-swiss translate-x-[-2px] translate-y-[-2px]'
                                    : 'bg-white hover:bg-[#f8f8f8]'
                                }
              `}
                        >
                            <div className="flex flex-col items-center text-center space-y-2">
                                <Icon className={`w-8 h-8 ${isSelected ? 'text-accent-orange' : 'text-black'}`} />
                                <span className="font-black uppercase tracking-tight text-sm">{mode.label}</span>
                                <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {mode.description}
                                </span>
                            </div>

                            {isSelected && (
                                <motion.div
                                    layoutId="mode-indicator"
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent-orange"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default ModeSelector;
