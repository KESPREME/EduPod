"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

export type Language = "en" | "hi" | "es" | "fr" | "de" | "zh";

interface LanguageSelectorProps {
    selectedLanguage: Language;
    onLanguageChange: (lang: Language) => void;
}

const languages = [
    { code: "en" as Language, label: "English", flag: "🇺🇸" },
    { code: "hi" as Language, label: "हिंदी", flag: "🇮🇳" },
    { code: "es" as Language, label: "Español", flag: "🇪🇸" },
    { code: "fr" as Language, label: "Français", flag: "🇫🇷" },
    { code: "de" as Language, label: "Deutsch", flag: "🇩🇪" },
    { code: "zh" as Language, label: "中文", flag: "🇨🇳" },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
    return (
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Language</span>
            </div>

            <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                    <motion.button
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
              px-3 py-2 text-sm font-bold border-2 border-black transition-all
              ${selectedLanguage === lang.code
                                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                                : 'bg-white hover:bg-gray-50'
                            }
            `}
                    >
                        <span className="mr-1">{lang.flag}</span>
                        {lang.label}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSelector;
