import React, { useState, useEffect } from 'react';
import { Note, SubjectKey, DifficultyKey, SUBJECT_KEYS, DIFFICULTY_KEYS } from '../types';
import { SUBJECTS, DIFFICULTY_LEVELS } from '../constants';

interface NoteFormProps {
  // FIX: Update onSave prop to not expect userId, as it's handled in the parent component.
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, id?: string) => void;
  onCancel: () => void;
  existingNote?: Note | null;
}

const DRAFT_KEY = 'studybuddy_draft_note';

const NoteForm: React.FC<NoteFormProps> = ({ onSave, onCancel, existingNote }) => {
  // FIX: Update return type to exclude userId, matching the component's responsibility. This fixes the original error.
  const getInitialFormData = (): Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'> => ({
    subject: 'math',
    lesson: '',
    source: '',
    mistake: '',
    correction: '',
    futureNote: '',
    referenceLink: '',
    imageUrls: [],
    difficulty: 'medium',
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (existingNote) {
      // FIX: Destructure existingNote to exclude properties not managed by the form state for type safety.
      const { id, createdAt, updatedAt, userId, ...rest } = existingNote;
      setFormData({
        ...rest,
        imageUrls: existingNote.imageUrls || [],
      });
      localStorage.removeItem(DRAFT_KEY);
    } else {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
      }
    }
  }, [existingNote]);

  useEffect(() => {
    if (!existingNote) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, existingNote]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // FIX: The reported error message points to an issue with type inference when iterating over files.
      // Using a for...of loop is a more robust way to handle the FileList iterable and should resolve this.
      for (const file of e.target.files) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), reader.result as string] }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({...prev, imageUrls: prev.imageUrls?.filter((_, i) => i !== index)}));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!formData.lesson.trim()) newErrors.lesson = 'Vui lòng nhập bài học hoặc chủ đề.';
    if (!formData.mistake.trim()) newErrors.mistake = 'Vui lòng mô tả lỗi sai.';
    if (!formData.correction.trim()) newErrors.correction = 'Vui lòng nhập cách sửa đúng.';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave(formData, existingNote?.id);
      if (!existingNote) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-800 rounded-lg shadow-xl animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-sky-400 border-b border-slate-600 pb-2">
          {existingNote ? 'Chỉnh Sửa Ghi Chú' : 'Tạo Ghi Chú Mới'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">Môn học</label>
            <select name="subject" id="subject" value={formData.subject} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
              {SUBJECT_KEYS.map(key => (
                <option key={key} value={key}>{SUBJECTS[key].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300 mb-1">Độ khó / Loại</label>
            <select name="difficulty" id="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
              {DIFFICULTY_KEYS.map(key => (
                <option key={key} value={key}>{DIFFICULTY_LEVELS[key].label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="lesson" className="block text-sm font-medium text-slate-300 mb-1">Bài học / Chủ đề</label>
                <input type="text" name="lesson" id="lesson" value={formData.lesson} onChange={handleChange} className={`w-full bg-slate-700 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.lesson ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} placeholder="ví dụ: Các thì trong Tiếng Anh" />
                {errors.lesson && <p className="mt-1 text-xs text-red-400">{errors.lesson}</p>}
            </div>
            <div>
                <label htmlFor="source" className="block text-sm font-medium text-slate-300 mb-1">Nơi bị sai</label>
                <input type="text" name="source" id="source" value={formData.source} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="ví dụ: Bài kiểm tra 15 phút, Đề A..." />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="mistake" className="block text-sm font-medium text-slate-300 mb-1">Lỗi sai đã mắc phải</label>
            <textarea name="mistake" id="mistake" rows={4} value={formData.mistake} onChange={handleChange} className={`w-full bg-slate-700 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.mistake ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} placeholder="Mô tả lỗi sai..."></textarea>
            {errors.mistake && <p className="mt-1 text-xs text-red-400">{errors.mistake}</p>}
          </div>
          <div>
            <label htmlFor="correction" className="block text-sm font-medium text-slate-300 mb-1">Cách làm đúng</label>
            <textarea name="correction" id="correction" rows={4} value={formData.correction} onChange={handleChange} className={`w-full bg-slate-700 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.correction ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} placeholder="Giải thích cách làm đúng..."></textarea>
            {errors.correction && <p className="mt-1 text-xs text-red-400">{errors.correction}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="futureNote" className="block text-sm font-medium text-slate-300 mb-1">Lưu ý cho lần sau</label>
          <textarea name="futureNote" id="futureNote" rows={3} value={formData.futureNote} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Lời nhắc cho chính bạn trong tương lai..."></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="referenceLink" className="block text-sm font-medium text-slate-300 mb-1">Link tham khảo (Tùy chọn)</label>
              <input type="url" name="referenceLink" id="referenceLink" value={formData.referenceLink} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="https://example.com" />
            </div>
            <div>
              <label htmlFor="imageUpload" className="block text-sm font-medium text-slate-300 mb-1">Tải lên hình ảnh (Tùy chọn)</label>
              <input type="file" name="imageUpload" id="imageUpload" accept="image/*" multiple onChange={handleImageUpload} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"/>
            </div>
        </div>

        {formData.imageUrls && formData.imageUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-4">
            {formData.imageUrls.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt={`Preview ${index}`} className="h-24 w-24 rounded-md object-cover border border-slate-600" />
                <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-600">
          <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition-colors">Hủy</button>
          <button type="submit" className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-semibold transition-colors">Lưu Ghi Chú</button>
        </div>
      </form>
    </div>
  );
};

export default NoteForm;