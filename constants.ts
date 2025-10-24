
import React from 'react';
import { SubjectKey, DifficultyKey } from './types';
import { MathIcon, ScienceIcon, HistoryIcon, LiteratureIcon, CodeIcon, EnglishIcon, OtherIcon } from './components/icons';

type SubjectInfo = {
    label: string;
    icon: React.FC;
    color: string;
};

export const SUBJECTS: Record<SubjectKey, SubjectInfo> = {
    math: { label: 'Toán học', icon: MathIcon, color: 'text-blue-400' },
    science: { label: 'Khoa học', icon: ScienceIcon, color: 'text-green-400' },
    history: { label: 'Lịch sử', icon: HistoryIcon, color: 'text-yellow-400' },
    literature: { label: 'Ngữ văn', icon: LiteratureIcon, color: 'text-purple-400' },
    code: { label: 'Lập trình', icon: CodeIcon, color: 'text-pink-400' },
    english: { label: 'Tiếng Anh', icon: EnglishIcon, color: 'text-teal-400' },
    other: { label: 'Khác', icon: OtherIcon, color: 'text-gray-400' },
};

type DifficultyInfo = {
    label: string;
    color: string;
    borderColor: string;
};

export const DIFFICULTY_LEVELS: Record<DifficultyKey, DifficultyInfo> = {
    easy: { label: 'Dễ', color: 'bg-green-500/20 text-green-300', borderColor: 'border-green-500/50' },
    medium: { label: 'Trung bình', color: 'bg-yellow-500/20 text-yellow-300', borderColor: 'border-yellow-500/50' },
    hard: { label: 'Khó', color: 'bg-orange-500/20 text-orange-300', borderColor: 'border-orange-500/50' },
    critical: { label: 'Rất khó', color: 'bg-red-500/20 text-red-300', borderColor: 'border-red-500/50' },
};
