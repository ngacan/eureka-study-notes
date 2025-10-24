import React, { useState, useEffect } from 'react';
import { Note, View, ProgressAnalysis } from './types';
import Header from './components/Header';
import NoteList from './components/NoteList';
import NoteForm from './components/NoteForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ConfirmationModal from './components/ConfirmationModal';
import { SUBJECTS, DIFFICULTY_LEVELS } from './constants';
import {
  initializeFirebase,
  onAuthStateChangedListener,
  onNotesSnapshot,
  addNote,
  updateNote,
  deleteNote as deleteNoteFromDb,
} from './services/firebaseService';
import { isFirebaseConfigured } from './firebaseConfig';
import FirebaseConfigWarning from './components/FirebaseConfigWarning';

declare global {
  interface Window {
    pdfMake: any;
    html2canvas: any;
  }
}

const REMINDER_KEY = 'studybuddy_reminder';

// FIX: A completely rewritten, high-performance image handler.
// This function now resizes and compresses images before embedding them into the PDF.
// A timeout has been added to prevent hanging on corrupted/problematic images.
const getImageDataUrl = (url: string, timeout = 7000): Promise<string | null> => {
    return new Promise((resolve) => {
        if (!url || !url.startsWith('data:image')) {
            console.warn(`Skipping invalid URL for PDF export: ${url.substring(0, 100)}...`);
            resolve(null);
            return;
        }

        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            console.error(`Image processing timed out for: ${url.substring(0, 100)}...`);
            resolve(null);
        }, timeout);

        const MAX_WIDTH = 800;
        const img = new Image();

        img.onload = () => {
            if (timedOut) return;
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                const scale = MAX_WIDTH / img.width;
                const newWidth = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
                const newHeight = img.width > MAX_WIDTH ? img.height * scale : img.height;

                canvas.width = newWidth;
                canvas.height = newHeight;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(resizedDataUrl);
                } else {
                    resolve(url); // Fallback to original
                }
            } catch (error) {
                 console.error("Error resizing image:", error);
                 resolve(null);
            }
        };

        img.onerror = () => {
            if (timedOut) return;
            clearTimeout(timer);
            console.error(`Failed to load image for resizing: ${url.substring(0, 100)}...`);
            resolve(null);
        };
        
        img.src = url;
    });
};


const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<View>('notes');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const waitForLibrary = (libName: 'pdfMake' | 'html2canvas', timeout = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
            if ((window as any)[libName]) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Thư viện ${libName} không tải được sau ${timeout/1000} giây. Vui lòng kiểm tra kết nối mạng và thử lại.`));
            } else {
                setTimeout(check, 200);
            }
        };
        check();
    });
  };

  if (!isFirebaseConfigured) {
    return <FirebaseConfigWarning />;
  }

  useEffect(() => {
    const isInitialized = initializeFirebase();
    setFirebaseInitialized(isInitialized);

    if (isInitialized) {
      const unsubscribe = onAuthStateChangedListener((user) => {
        setCurrentUser(user);
        setIsLoading(false);
      });
      return unsubscribe;
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeFromNotes: () => void;
    if (currentUser) {
       unsubscribeFromNotes = onNotesSnapshot(currentUser.uid, (fetchedNotes) => {
         const sortedNotes = [...fetchedNotes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
         const notesWithDisplayId = sortedNotes.map((note, index) => ({
           ...note,
           displayId: index + 1,
         }));
         setNotes(notesWithDisplayId);
       });
    } else {
       setNotes([]);
    }
    return () => {
        if (unsubscribeFromNotes) {
            unsubscribeFromNotes();
        }
    }
  }, [currentUser]);


  useEffect(() => {
    const lastReminder = localStorage.getItem(REMINDER_KEY);
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    if (lastReminder) {
      if (now.getTime() - new Date(lastReminder).getTime() > oneWeek) {
        alert("Nhắc nhở hàng tuần: Đã đến lúc xem lại ghi chú và theo dõi tiến độ học tập của bạn!");
        localStorage.setItem(REMINDER_KEY, now.toISOString());
      }
    } else {
        localStorage.setItem(REMINDER_KEY, now.toISOString());
    }
  }, []);

  const handleSaveNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, id?: string) => {
    if (!currentUser) return;
    if (id) {
      const noteToUpdate = notes.find(n => n.id === id);
      if (noteToUpdate) {
        const updatedData = { ...noteToUpdate, ...noteData, updatedAt: new Date().toISOString() };
        await updateNote(id, updatedData);
      }
    } else {
      const now = new Date().toISOString();
      const newNote: Omit<Note, 'id'> = {
        ...noteData,
        userId: currentUser.uid,
        createdAt: now,
        updatedAt: now,
      };
      await addNote(newNote);
    }
    setView('notes');
    setEditingNote(null);
  };

  const handleSetEditing = (note: Note) => {
    setEditingNote(note);
    setView('edit_note');
  };
  
  const handleCopyNote = (note: Note) => {
    const { id, createdAt, updatedAt, userId, displayId, ...noteToCopy } = note;
    setEditingNote({ ...noteToCopy, imageUrls: note.imageUrls || [] } as Note); // Ensure imageUrls is an array
    setView('new_note');
  }

  const handleDeleteNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setNoteToDelete(note);
    }
  };

  const executeDelete = async () => {
    if (!noteToDelete) return;

    const originalNotes = [...notes];
    const newNotes = originalNotes.filter(note => note.id !== noteToDelete.id);
    
    const sortedNewNotes = newNotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const notesWithDisplayId = sortedNewNotes.map((note, index) => ({
         ...note,
         displayId: index + 1,
    }));
    setNotes(notesWithDisplayId);
    setNoteToDelete(null); 

    try {
      await deleteNoteFromDb(noteToDelete.id);
    } catch (error) {
      console.error("Lỗi khi xóa ghi chú:", error);
      alert("Không thể xóa ghi chú. Vui lòng thử lại sau.");
      setNotes(originalNotes);
    }
  };

  const handlePdfError = (e: unknown) => {
      console.error("Lỗi khi xuất PDF:", e);
      let errorMessage = "Đã có lỗi xảy ra khi xuất file PDF.";
      if (e instanceof Error) {
          errorMessage += `\n\nChi tiết: ${e.message}`;
          // FIX: Provide a more helpful error message if the specific `advanceWidth` error occurs.
          if (e.message.toLowerCase().includes('width')) {
              errorMessage += "\n\nGợi ý: Lỗi này thường do sự cố font chữ. Vui lòng thử tải lại trang và xuất lại.";
          }
      }
      alert(errorMessage);
  }

  const handleExportDashboardPDF = (analysisResult: ProgressAnalysis, mistakeAnalysis: string) => {
      if (!analysisResult) {
          alert("Chưa có dữ liệu phân tích để xuất.");
          return;
      }
      
      setIsExporting(true);
      setExportProgress("Đang chuẩn bị xuất báo cáo...");

      const generate = async () => {
          try {
              await waitForLibrary('pdfMake');

              const { evaluation, chartDataByDifficulty, chartDataBySubject } = analysisResult;
              
              setExportProgress("Đang tạo báo cáo Dashboard...");
              await new Promise(resolve => setTimeout(resolve, 50));

              const content: any[] = [
                  { text: 'Báo Cáo Tổng Hợp & Hướng Dẫn Học Tập', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
                  { text: 'Phân Tích & Gợi Ý Của AI', style: 'subheader' },
                  { text: evaluation, style: 'bodyText', italics: true },
                  { text: mistakeAnalysis.split('\n').map(s => s.trim()).filter(s => s).join('\n\n'), style: 'bodyText' },
              ];

              if (chartDataByDifficulty && chartDataByDifficulty.length > 0) {
                  content.push({ text: 'Tiến Độ Theo Độ Khó', style: 'subheader', margin: [0, 10, 0, 5] });
                  const difficultyBody = [
                      ['Tháng', 'Dễ', 'TB', 'Khó', 'R.Khó'].map(h => ({ text: h, style: 'tableHeader' }))
                  ];
                  chartDataByDifficulty.forEach((row: any) => {
                      difficultyBody.push([row.name, row.easy || 0, row.medium || 0, row.hard || 0, row.critical || 0]);
                  });
                  content.push({
                      table: {
                          headerRows: 1,
                          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                          body: difficultyBody,
                      },
                      layout: 'lightHorizontalLines'
                  });
              }
              
              if (chartDataBySubject && chartDataBySubject.length > 0) {
                  const subjectAbbreviations = { math: 'Toán', science: 'K.Học', history: 'L.Sử', literature: 'Văn', code: 'Code', english: 'T.Anh', other: 'Khác' };
                  content.push({ text: 'Phân Bổ Theo Môn Học', style: 'subheader', margin: [0, 10, 0, 5] });
                  const subjectHeaders = ['Tháng', ...Object.keys(SUBJECTS).map(key => subjectAbbreviations[key as keyof typeof subjectAbbreviations])];
                  const subjectKeys = ['name', ...Object.keys(SUBJECTS)];

                  const subjectBody = [subjectHeaders.map(h => ({ text: h, style: 'tableHeader' }))];
                  chartDataBySubject.forEach((row: any) => {
                      const tableRow = subjectKeys.map(key => row[key] || 0);
                      subjectBody.push(tableRow);
                  });

                  content.push({
                      table: {
                          headerRows: 1,
                          widths: ['auto', ...Array(Object.keys(SUBJECTS).length).fill('*')],
                          body: subjectBody,
                      },
                      layout: 'lightHorizontalLines'
                  });
              }

              const docDefinition = {
                  pageSize: { width: 190, height: 368.5 },
                  pageMargins: [3, 5, 3, 15], // Increased bottom margin for footer
                  background: function(currentPage: number, pageSize: {width: number, height: number}) {
                    return {
                      canvas: [
                        {
                          type: 'rect',
                          x: 0, y: 0, w: pageSize.width, h: pageSize.height,
                          color: '#111827'
                        }
                      ]
                    };
                  },
                  content: content,
                  defaultStyle: { font: 'Roboto', fontSize: 8, color: '#D1D5DB' },
                  styles: {
                      header: { fontSize: 11, bold: true, color: '#38bdf8' },
                      subheader: { fontSize: 9, bold: true, color: '#9CA3AF', margin: [0, 8, 0, 4] },
                      tableHeader: { bold: true, fontSize: 7, color: '#F3F4F6' },
                      bodyText: { margin: [0, 0, 0, 5], lineHeight: 1.2 },
                  },
                   footer: (currentPage: number, pageCount: number) => ({
                      text: `Eureka | ${new Date().toLocaleString('vi-VN')} | Trang ${currentPage.toString()}/${pageCount}`,
                      alignment: 'center',
                      fontSize: 6,
                      color: '#6B7281',
                      margin: [0, 5, 0, 0]
                  })
              };

              window.pdfMake.createPdf(docDefinition).download(`Eureka-Dashboard-${new Date().toLocaleDateString('vi-VN')}.pdf`);

          } catch (e) {
              handlePdfError(e);
          } finally {
              setIsExporting(false);
              setExportProgress(null);
          }
      };
      
      generate();
  };
  
  const handleExportNotesPDF = (notesToExport: Note[], includeImages: boolean) => {
    if (notesToExport.length === 0) {
        alert("Không có ghi chú nào để xuất.");
        return;
    }
    
    if (notesToExport.length > 20) {
        if (!confirm(`Bạn đang xuất ${notesToExport.length} ghi chú. Nếu có nhiều hình ảnh, quá trình này có thể làm chậm trình duyệt. Bạn có muốn tiếp tục không?`)) {
            return;
        }
    }
    
    setIsExporting(true);
    
    const generate = async () => {
        setExportProgress('Bắt đầu quá trình xuất...');
        try {
            await waitForLibrary('pdfMake');

            const content = [];
            content.push({ text: 'Tổng Hợp Ghi Chú Học Tập Eureka', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] });

            for (const [index, note] of notesToExport.entries()) {
                await new Promise(resolve => setTimeout(resolve, 10)); // Yield to main thread to update UI
                setExportProgress(`Đang xử lý ghi chú ${index + 1}/${notesToExport.length}: "${note.lesson}"`);
                
                const noteContent = [];
                noteContent.push({ text: `${note.displayId || ''}. ${note.lesson}`, style: 'subheader' });
                
                noteContent.push({
                    columns: [
                        {
                            stack: [
                                { text: [{ text: 'Môn: ', style: 'metadataLabel' }, SUBJECTS[note.subject]?.label || note.subject] },
                                { text: [{ text: 'Nơi bị sai: ', style: 'metadataLabel' }, note.source || 'Không có'] },
                                { text: [
                                    { text: 'Tạo: ', style: 'metadataLabel' },
                                    { text: new Date(note.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }), style: 'metadataDate' }
                                ]},
                            ]
                        },
                        {
                            stack: [
                                { text: [{ text: 'Độ khó: ', style: 'metadataLabel' }, DIFFICULTY_LEVELS[note.difficulty]?.label || note.difficulty] },
                                { text: ' ' }, // Spacer to align dates
                                { text: [
                                    { text: 'Sửa: ', style: 'metadataLabel' },
                                    { text: new Date(note.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }), style: 'metadataDate' }
                                ]},
                            ]
                        }
                    ],
                    style: 'metadataLine',
                    margin: [0, 4, 0, 8],
                    columnGap: 10,
                });

                const createSection = (title: string, text: string, style: string) => {
                    if (!text) return [];
                    return [ { text: title, style: `${style}Title` }, { text: text, style: 'bodyText' } ];
                };

                noteContent.push(...createSection('Lỗi sai:', note.mistake, 'mistake'));
                noteContent.push(...createSection('Cách sửa:', note.correction, 'correction'));
                noteContent.push(...createSection('Lưu ý:', note.futureNote, 'futureNote'));

                if (note.referenceLink) {
                     noteContent.push({ text: 'Link tham khảo:', style: 'futureNoteTitle' });
                     noteContent.push({ text: note.referenceLink, link: note.referenceLink, style: 'link' });
                }

                if (includeImages && note.imageUrls && note.imageUrls.length > 0) {
                    setExportProgress(`Đang xử lý ${note.imageUrls.length} hình ảnh cho ghi chú ${index + 1}...`);
                    noteContent.push({ text: 'Hình ảnh:', style: 'imageTitle' });
                    const imagePromises = note.imageUrls.map(url => getImageDataUrl(url));
                    const imageDataUrls = await Promise.all(imagePromises);
                    const validImages = imageDataUrls.filter((url): url is string => url !== null);
                    
                    if(validImages.length > 0) {
                         noteContent.push({
                             columns: validImages.map(dataUrl => ({
                                 image: dataUrl,
                                 width: 50,
                                 margin: [0, 0, 5, 0]
                             }))
                         });
                    }
                }
                
                content.push({ stack: noteContent, margin: [0, 0, 0, 15], unbreakable: false });
            }
            
            setExportProgress('Đang tạo file PDF. Vui lòng đợi...');
            await new Promise(resolve => setTimeout(resolve, 10));

            const docDefinition = {
                pageSize: { width: 190, height: 368.5 },
                pageMargins: [3, 5, 3, 15], // Increased bottom margin for footer
                background: function(currentPage: number, pageSize: {width: number, height: number}) {
                    return {
                      canvas: [
                        {
                          type: 'rect',
                          x: 0, y: 0, w: pageSize.width, h: pageSize.height,
                          color: '#111827'
                        }
                      ]
                    };
                },
                content: content,
                defaultStyle: { font: 'Roboto', fontSize: 8, color: '#D1D5DB' },
                styles: {
                    header: { fontSize: 11, bold: true, color: '#38bdf8' },
                    subheader: { fontSize: 9, bold: true, color: '#9CA3AF', margin: [0, 0, 0, 4] },
                    metadataLine: { fontSize: 7, color: '#9CA3AF' },
                    metadataLabel: { bold: true, color: '#E5E7EB' },
                    metadataDate: { fontSize: 6, italics: true, color: '#9CA3AF' },
                    mistakeTitle: { fontSize: 9, bold: true, color: '#f87171', margin: [0, 4, 0, 2] },
                    correctionTitle: { fontSize: 9, bold: true, color: '#4ade80', margin: [0, 4, 0, 2] },
                    futureNoteTitle: { fontSize: 9, bold: true, color: '#38bdf8', margin: [0, 4, 0, 2] },
                    imageTitle: { fontSize: 8, bold: true, color: '#9CA3AF', margin: [0, 8, 0, 2]},
                    bodyText: { margin: [0, 0, 0, 5], lineHeight: 1.2 },
                    link: { color: '#38bdf8', decoration: 'underline' }
                },
                footer: (currentPage: number, pageCount: number) => ({
                    text: `Eureka | ${new Date().toLocaleString('vi-VN')} | Trang ${currentPage.toString()}/${pageCount}`,
                    alignment: 'center', fontSize: 6, color: '#6B7281', margin: [0, 5, 0, 0]
                })
            };

            window.pdfMake.createPdf(docDefinition).download(`Ghi-chu-Eureka-${new Date().toLocaleDateString('vi-VN')}.pdf`);

        } catch (e) {
            handlePdfError(e);
        } finally {
            setIsExporting(false);
            setExportProgress(null);
        }
    };

    generate();
  };


  const MainContent: React.FC = () => {
    switch (view) {
      case 'new_note':
        return <NoteForm onSave={handleSaveNote} onCancel={() => setView('notes')} />;
      case 'edit_note':
        return <NoteForm onSave={handleSaveNote} onCancel={() => setView('notes')} existingNote={editingNote} />;
      case 'dashboard':
        return <Dashboard notes={notes} onExport={handleExportDashboardPDF} isExporting={isExporting} />;
      case 'notes':
      default:
        return <NoteList notes={notes} onDeleteNote={handleDeleteNote} onEditNote={handleSetEditing} onCopyNote={handleCopyNote} onNewNote={() => setView('new_note')} onExport={handleExportNotesPDF} />;
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-400"></div>
            <p className="ml-4 text-slate-300 text-lg">Đang tải ứng dụng...</p>
        </div>
    );
  }

  if (!currentUser && firebaseInitialized) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header currentView={view} setView={setView} user={currentUser} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <MainContent />
      </main>

      {isExporting && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[100]">
            <div className="text-center p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
              <p className="mt-4 text-slate-300 text-lg font-semibold">Đang xuất file PDF...</p>
              <p className="mt-2 text-slate-400 text-sm max-w-xs">{exportProgress || 'Bắt đầu...'}</p>
            </div>
          </div>
      )}

      {noteToDelete && (
        <ConfirmationModal
          title="Xác nhận xóa"
          message={`Bạn có chắc chắn muốn xóa vĩnh viễn ghi chú "${noteToDelete.lesson}" không? Hành động này không thể hoàn tác.`}
          onConfirm={executeDelete}
          onCancel={() => setNoteToDelete(null)}
        />
      )}
    </div>
  );
};

export default App;