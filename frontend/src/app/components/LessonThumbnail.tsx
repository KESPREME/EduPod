"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface LessonThumbnailProps {
    title: string;
    className?: string;
}

// Simple hash function to generate a deterministic number from a string
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Neo-Brutalist color palette
const COLORS = [
    "#FF3366", // Neon Pink (Primary)
    "#7C3AED", // Deep Purple (Secondary)
    "#00E6A8", // Mint Green (Accent)
    "#FFB800", // Bright Yellow
    "#00D4FF", // Cyan
    "#FF5722", // Strong Orange
];

const SHAPES = ["circle", "square", "triangle", "pill", "star"];

export function LessonThumbnail({ title, className = "" }: LessonThumbnailProps) {
    const config = useMemo(() => {
        const hash = hashString(title || "edu");

        // Base background color
        const bgColor = COLORS[hash % COLORS.length];

        // Pick primary and secondary shapes based on hash
        const shapeType1 = SHAPES[(hash >> 2) % SHAPES.length];
        const shapeType2 = SHAPES[(hash >> 3) % SHAPES.length];

        // Pick complementary/contrasting colors for the shapes
        const shapeColor1 = COLORS[(hash >> 4) % COLORS.length];
        const shapeColor2 = COLORS[(hash >> 5) % COLORS.length];

        return {
            bgColor,
            shapeType1,
            shapeType2,
            // Ensure shape colors contrast a bit or at least aren't identical to bg
            shapeColor1: shapeColor1 === bgColor ? COLORS[(hash + 1) % COLORS.length] : shapeColor1,
            shapeColor2: shapeColor2 === bgColor ? COLORS[(hash + 2) % COLORS.length] : shapeColor2,
            rotation1: (hash % 360),
            rotation2: ((hash >> 1) % 360),
            scale1: 0.8 + ((hash % 10) / 20), // 0.8 to 1.3
            scale2: 0.6 + (((hash >> 1) % 10) / 20), // 0.6 to 1.1
        };
    }, [title]);

    // Renders the appropriate SVG path/shape
    const renderShape = (type: string, color: string) => {
        switch (type) {
            case "circle":
                return <circle cx="50" cy="50" r="30" fill={color} stroke="#000" strokeWidth="4" />;
            case "square":
                return <rect x="20" y="20" width="60" height="60" fill={color} stroke="#000" strokeWidth="4" />;
            case "triangle":
                return <polygon points="50,15 85,85 15,85" fill={color} stroke="#000" strokeWidth="4" strokeLinejoin="round" />;
            case "pill":
                return <rect x="15" y="35" width="70" height="30" rx="15" fill={color} stroke="#000" strokeWidth="4" />;
            case "star":
                return (
                    <polygon
                        points="50,10 61,35 88,35 66,51 74,77 50,61 26,77 34,51 12,35 39,35"
                        fill={color}
                        stroke="#000"
                        strokeWidth="4"
                        strokeLinejoin="round"
                    />
                );
            default:
                return <circle cx="50" cy="50" r="30" fill={color} stroke="#000" strokeWidth="4" />;
        }
    };

    return (
        <div
            className={`relative w-full h-full overflow-hidden flex items-center justify-center border-b-2 border-black transition-colors ${className}`}
            style={{ backgroundColor: config.bgColor }}
        >
            {/* Dot Grid Overlay for Neo-Brutalism feel */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('/dot-grid.png')" }}></div>

            {/* SVG Canvas */}
            <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] absolute pointer-events-none" preserveAspectRatio="xMidYMid slice">
                {/* Background Shape 1 - Slow float */}
                <motion.g
                    initial={{ rotate: config.rotation1, scale: config.scale1, x: -10, y: -10 }}
                    animate={{
                        rotate: [config.rotation1, config.rotation1 + 10, config.rotation1 - 10, config.rotation1],
                        y: [-10, -15, -5, -10]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="origin-center"
                    style={{ transformOrigin: '30% 30%' }}
                >
                    <g transform="translate(-10, -10)">
                        {renderShape(config.shapeType1, config.shapeColor1)}
                    </g>
                </motion.g>

                {/* Foreground Shape 2 - Faster rotation */}
                <motion.g
                    initial={{ rotate: config.rotation2, scale: config.scale2, x: 20, y: 10 }}
                    animate={{
                        rotate: [config.rotation2, config.rotation2 - 15, config.rotation2 + 5, config.rotation2],
                        x: [20, 25, 15, 20]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="origin-center"
                    style={{ transformOrigin: '70% 70%' }}
                >
                    <g transform="translate(40, 40)">
                        {renderShape(config.shapeType2, config.shapeColor2)}
                    </g>
                </motion.g>
            </svg>

            {/* Add a noise overlay for extra texture (optional but fits the aesthetic) */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }}></div>
        </div>
    );
}
