export const SUBJECT_KEYS = ['math', 'science', 'history', 'literature', 'code', 'english', 'other'] as const;
export type SubjectKey = typeof SUBJECT_KEYS[number];

export const DIFFICULTY_KEYS = ['easy', 'medium', 'hard', 'critical'] as const;
export type DifficultyKey = typeof DIFFICULTY_KEYS[number];

export interface Note {
  id: string;
  userId: string;
  displayId?: number;
  subject: SubjectKey;
  lesson: string;
  source: string;
  mistake: string;
  correction: string;
  futureNote: string;
  referenceLink?: string;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
  difficulty: DifficultyKey;
}

export type View = 'notes' | 'new_note' | 'edit_note' | 'dashboard';

export interface ProgressAnalysis {
    evaluation: string;
    chartDataByDifficulty: {
        name: string;
        [key: string]: number | string;
    }[];
    chartDataBySubject: {
        name: string;
        [key: string]: number | string;
    }[];
}