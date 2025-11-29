export const SUBJECT_KEYS = ['math', 'science', 'history', 'literature', 'code', 'english', 'other'] as const;
export type SubjectKey = typeof SUBJECT_KEYS[number];

export const DIFFICULTY_KEYS = ['easy', 'medium', 'hard', 'critical'] as const;
export type DifficultyKey = typeof DIFFICULTY_KEYS[number];

export interface Note {
  id: string;
  // core fields (make optional if some records don't have them)
  title?: string;
  content?: string;
  subject?: string;
  difficulty?: string;
  // analysis / error fields
  errors?: string[];    // array of error strings (if any)
  mistakes?: any[];     // any structured mistakes returned from AI
  // timestamps can be number | string | Date | Firestore Timestamp-like object
  createdAt?: number | string | Date | { toDate?: () => Date };
  updatedAt?: number | string | Date | { toDate?: () => Date };
  userId?: string;
  // keep any other existing fields
  [key: string]: any;
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