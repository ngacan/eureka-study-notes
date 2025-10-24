import React from 'react';
import { Note } from '../types';
import { SUBJECTS, DIFFICULTY_LEVELS } from '../constants';

interface NoteItemProps {
  note: Note;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
  onCopy: (note: Note) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit, onCopy, isSelected, onSelect }) => {
  const { icon: Icon, color: iconColor } = SUBJECTS[note.subject];
  const { color: difficultyColor, borderColor: difficultyBorder } = DIFFICULTY_LEVELS[note.difficulty];
  const hasBeenEdited = note.updatedAt !== note.createdAt;

  return (
    <div className={`bg-slate-800 rounded-lg shadow-lg overflow-hidden border-l-4 ${difficultyBorder} transition-transform hover:scale-[1.02] hover:shadow-sky-500/20 flex flex-col relative`}>
      <div className="absolute top-3 right-3 z-10">
        <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onSelect(note.id)}
            className="h-5 w-5 rounded bg-slate-700 border-slate-500 text-sky-500 focus:ring-sky-500 cursor-pointer"
        />
      </div>
      
      {note.displayId && (
         <div className="absolute top-3 left-3 flex items-center justify-center h-6 w-6 bg-sky-600/50 text-sky-200 text-xs font-bold rounded-full border border-sky-500/50">
           {note.displayId}
         </div>
      )}

      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 pr-8 pl-8">
            <div className={`p-2 bg-slate-700/50 rounded-full ${iconColor}`}>
                <Icon />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">{note.lesson}</h3>
              <p className="text-sm text-slate-400">{SUBJECTS[note.subject].label}</p>
              {note.source && <p className="text-xs text-slate-500 italic mt-1">Nơi bị sai: {note.source}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${difficultyColor}`}>
              {DIFFICULTY_LEVELS[note.difficulty].label}
            </span>
             <p className="text-xs text-slate-500 mt-1" title={`Tạo: ${new Date(note.createdAt).toLocaleString()}`}>
                Sửa: {new Date(note.updatedAt).toLocaleDateString()}
             </p>
          </div>
        </div>

        <div className="space-y-4 text-slate-300">
          <DetailSection title="Lỗi sai" content={note.mistake} color="text-red-400" />
          <DetailSection title="Cách sửa" content={note.correction} color="text-green-400" />
          <DetailSection title="Lưu ý cho lần sau" content={note.futureNote} color="text-sky-400" />
          
          {note.referenceLink && (
            <div>
              <h4 className="font-semibold text-slate-400 text-sm">Tham khảo:</h4>
              <a href={note.referenceLink} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline break-all text-sm">{note.referenceLink}</a>
            </div>
          )}
          
          {note.imageUrls && note.imageUrls.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-400 text-sm mb-2">Hình ảnh đính kèm:</h4>
              <div className="flex flex-wrap gap-2">
                {note.imageUrls.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Visual aid ${index + 1}`} className="h-24 w-24 object-cover rounded-md border border-slate-700 hover:border-sky-500 transition-all" />
                    </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
        
      <div className="mt-4 p-3 border-t border-slate-700/50 flex justify-end items-center gap-4 bg-slate-800/50">
          <button onClick={() => onCopy(note)} className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors">SAO CHÉP</button>
          <button onClick={() => onEdit(note)} className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">SỬA</button>
          <button onClick={() => onDelete(note.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">XÓA</button>
      </div>
    </div>
  );
};

interface DetailSectionProps {
    title: string;
    content: string;
    color: string;
}

const DetailSection: React.FC<DetailSectionProps> = ({title, content, color}) => (
    <div>
        <h4 className={`font-semibold text-sm ${color}`}>{title}</h4>
        <p className="text-sm bg-slate-900/50 p-2 rounded-md whitespace-pre-wrap">{content}</p>
    </div>
);

export default NoteItem;