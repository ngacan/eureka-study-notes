import React, { useState, useMemo } from 'react';
import { Note, SubjectKey, DifficultyKey, SUBJECT_KEYS, DIFFICULTY_KEYS } from '../types';
import NoteItem from './NoteItem';
import { SUBJECTS, DIFFICULTY_LEVELS } from '../constants';

interface NoteListProps {
  notes: Note[];
  onDeleteNote: (id: string) => void;
  onEditNote: (note: Note) => void;
  onCopyNote: (note: Note) => void;
  onNewNote: () => void;
}

const NoteList: React.FC<NoteListProps> = ({ notes, onDeleteNote, onEditNote, onCopyNote, onNewNote }) => {
  const [subjectFilter, setSubjectFilter] = useState<SubjectKey | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyKey | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'difficulty'>('updatedAt');

  const filteredNotes = useMemo(() => {
    const sortedNotes = [...notes]
      .sort((a, b) => {
        if (sortBy === 'difficulty') {
          const difficultyOrder: Record<string, number> = { 'critical': 4, 'hard': 3, 'medium': 2, 'easy': 1 };
          return (difficultyOrder[b.difficulty] ?? 0) - (difficultyOrder[a.difficulty] ?? 0);
        }
        if (sortBy === 'createdAt') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // For 'updatedAt' (default)
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return sortedNotes
        .filter(note => subjectFilter === 'all' || note.subject === subjectFilter)
        .filter(note => difficultyFilter === 'all' || note.difficulty === difficultyFilter);

  }, [notes, subjectFilter, difficultyFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
            <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Lọc theo môn:</label>
                <select onChange={(e) => setSubjectFilter(e.target.value as SubjectKey | 'all')} value={subjectFilter} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-3 text-sm">
                    <option value="all">Tất cả môn</option>
                    {SUBJECT_KEYS.map(key => <option key={key} value={key}>{SUBJECTS[key].label}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Lọc theo độ khó:</label>
                <select onChange={(e) => setDifficultyFilter(e.target.value as DifficultyKey | 'all')} value={difficultyFilter} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-3 text-sm">
                    <option value="all">Tất cả độ khó</option>
                    {DIFFICULTY_KEYS.map(key => <option key={key} value={key}>{DIFFICULTY_LEVELS[key].label}</option>)}
                </select>
            </div>
             <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Sắp xếp theo:</label>
                <select onChange={(e) => setSortBy(e.target.value as any)} value={sortBy} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-3 text-sm">
                    <option value="updatedAt">Mới nhất</option>
                    <option value="createdAt">Cũ nhất</option>
                    <option value="difficulty">Độ khó (Cao-Thấp)</option>
                </select>
            </div>
        </div>
        <div className="w-full md:w-auto flex-shrink-0">
             <button onClick={onNewNote} className="w-full px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Ghi Chú Mới
            </button>
        </div>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 animate-fade-in">
          {filteredNotes.map(note => (
            <NoteItem key={note.id} note={note} onDelete={onDeleteNote} onEdit={onEditNote} onCopy={onCopyNote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-slate-800 rounded-lg">
          <h3 className="text-xl font-semibold text-slate-300">Không có ghi chú nào!</h3>
          <p className="text-slate-500 mt-2">Nhấn "Ghi Chú Mới" để bắt đầu hành trình chinh phục kiến thức của bạn.</p>
        </div>
      )}
    </div>
  );
};

export default NoteList;