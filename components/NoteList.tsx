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
  onExport: (notes: Note[], includeImages: boolean) => void;
}

const NoteList: React.FC<NoteListProps> = ({ notes, onDeleteNote, onEditNote, onCopyNote, onNewNote, onExport }) => {
  const [subjectFilter, setSubjectFilter] = useState<SubjectKey | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyKey | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'difficulty'>('updatedAt');
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [includeImages, setIncludeImages] = useState(true);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => subjectFilter === 'all' || note.subject === subjectFilter)
      .filter(note => difficultyFilter === 'all' || note.difficulty === difficultyFilter)
      .sort((a, b) => {
        if (sortBy === 'difficulty') {
          const difficultyOrder: Record<string, number> = { 'critical': 4, 'hard': 3, 'medium': 2, 'easy': 1 };
          return (difficultyOrder[b.difficulty] ?? 0) - (difficultyOrder[a.difficulty] ?? 0);
        }
        if (sortBy === 'createdAt') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // For 'updatedAt' (default)
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, subjectFilter, difficultyFilter, sortBy]);

  const handleSelectNote = (id: string) => {
    setSelectedNoteIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };
  
  const handleExportSelected = () => {
    const selectedNotes = notes.filter(note => selectedNoteIds.has(note.id));
    onExport(selectedNotes, includeImages);
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <option value="updatedAt">Ngày sửa</option>
                    <option value="createdAt">Ngày tạo</option>
                    <option value="difficulty">Độ khó</option>
                </select>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-700">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="include-images"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="include-images" className="ml-2 text-sm text-slate-300">
                    Đính kèm hình ảnh khi xuất
                </label>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 w-full sm:w-auto">
                <button onClick={handleExportSelected} disabled={selectedNoteIds.size === 0} className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm">
                    Xuất ({selectedNoteIds.size}) mục đã chọn
                </button>
                <button onClick={() => onExport(filteredNotes, includeImages)} disabled={filteredNotes.length === 0} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm">
                    Xuất PDF (Theo bộ lọc)
                </button>
                <button onClick={onNewNote} className="w-full sm:w-auto px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Ghi Chú Mới
                </button>
            </div>
        </div>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 animate-fade-in">
          {filteredNotes.map(note => (
            <NoteItem key={note.id} note={note} onDelete={onDeleteNote} onEdit={onEditNote} onCopy={onCopyNote} isSelected={selectedNoteIds.has(note.id)} onSelect={handleSelectNote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-slate-800 rounded-lg">
          <h3 className="text-xl font-semibold text-slate-300">Không tìm thấy ghi chú nào!</h3>
          <p className="text-slate-500 mt-2">Hãy thử thay đổi bộ lọc hoặc nhấn "Ghi Chú Mới" để bắt đầu.</p>
        </div>
      )}
    </div>
  );
};

export default NoteList;