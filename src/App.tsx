import React, { useState, useEffect, useCallback } from 'react';
import { Note, View } from './types';
import Header from './components/Header';
import NoteList from './components/NoteList';
import NoteForm from './components/NoteForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import FirebaseConfigWarning from './components/FirebaseConfigWarning';
import ConfirmationModal from './components/ConfirmationModal';
import { isFirebaseConfigured } from './firebaseConfig';
import {
  initializeFirebase,
  onAuthStateChangedListener,
  signOutUser,
  onNotesSnapshot,
  addNote as addNoteToFirebase,
  updateNote as updateNoteInFirebase,
  deleteNote as deleteNoteFromFirebase
} from './services/firebaseService';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<View>('notes');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Initialize Firebase and set up auth listener on mount
  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn("Firebase is not configured. App will run in local-only mode.");
      setIsLoading(false);
      return;
    }

    const firebaseReady = initializeFirebase();
    setIsFirebaseInitialized(firebaseReady);

    if (firebaseReady) {
      const unsubscribe = onAuthStateChangedListener((user) => {
        setCurrentUser(user);
        if (!user) {
          // User is signed out, no need to load local notes here
          // as the Login component will be shown.
          setIsLoading(false);
        }
        // Note fetching for logged-in user is handled in the next useEffect
      });
      return () => unsubscribe();
    } else {
      console.error("Firebase initialization failed.");
      setIsLoading(false);
    }
  }, []);

  // One-time migration of local notes to Firebase
  const migrateLocalNotes = useCallback(async (userId: string) => {
    try {
      const localNotesRaw = localStorage.getItem('eureka_notes');
      if (localNotesRaw) {
        const localNotes: Note[] = JSON.parse(localNotesRaw);
        if (localNotes.length > 0) {
          const hasMigrated = localStorage.getItem('eureka_migrated_to_firebase');
          if (hasMigrated) return;

          console.log(`Migrating ${localNotes.length} local notes to Firebase...`);
          await Promise.all(localNotes.map(note => {
            const { id, displayId, ...noteData } = note; // Exclude local-only fields
            return addNoteToFirebase({ ...noteData, userId });
          }));
          localStorage.setItem('eureka_migrated_to_firebase', 'true');
          console.log("Migration complete.");
        }
      }
    } catch (error) {
      console.error("Failed to migrate local notes:", error);
      alert("Đã có lỗi xảy ra khi di chuyển ghi chú cục bộ của bạn lên đám mây. Vui lòng tải lại trang và thử lại.");
    }
  }, []);

  // Effect to fetch notes from Firestore when user logs in
  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | undefined;

    if (isFirebaseInitialized && currentUser) {
      setIsLoading(true);
      migrateLocalNotes(currentUser.uid).then(() => {
        unsubscribeFromFirestore = onNotesSnapshot(currentUser.uid, (serverNotes) => {
          const notesWithDisplayIds = serverNotes.map((note, index) => ({
            ...note,
            displayId: serverNotes.length - index,
          }));
          setNotes(notesWithDisplayIds);
          setIsLoading(false);
        });
      });
    } else {
      // If there's no user, we don't need to do anything here.
      // The app will show the Login screen.
      setNotes([]);
    }

    return () => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, [currentUser, isFirebaseInitialized, migrateLocalNotes]);


  const handleSaveNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, id?: string) => {
    if (!currentUser) {
        alert("Bạn phải đăng nhập để lưu ghi chú.");
        return;
    }
    
    const now = new Date().toISOString();
    if (id) {
        await updateNoteInFirebase(id, { ...noteData, updatedAt: now });
    } else {
        const newNote = { ...noteData, userId: currentUser.uid, createdAt: now, updatedAt: now };
        await addNoteToFirebase(newNote);
    }

    setView('notes');
    setEditingNote(null);
  };

  const handleDeleteRequest = (id: string) => {
    setNoteToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete || !currentUser) return;
    await deleteNoteFromFirebase(noteToDelete);
    setNoteToDelete(null);
  };

  const handleSetEditing = (note: Note) => {
    setEditingNote(note);
    setView('edit_note');
  };
  
  const handleCopyNote = (note: Note) => {
    const { id, createdAt, updatedAt, userId, displayId, ...noteToCopy } = note;
    const newDraft = { ...noteToCopy, imageUrls: note.imageUrls || [] };
    setEditingNote(newDraft as Note);
    setView('new_note');
  }

  const handleExport = async (selectedNotes?: Note[]) => {
    const toExport = selectedNotes && selectedNotes.length ? selectedNotes : notes;
    try {
      const mod = await import("./utils/exportNotesToPdf");
      await mod.exportNotesToPdf(toExport);
    } catch (err) {
      console.error("Export failed", err);
      alert("Không thể xuất PDF. Xem console.");
    }
  };

  const handleAnalyze = async (filteredNotes: Note[]) => {
    try {
      // gọi service analyzeProgress (server or client as implemented)
      const { analyzeProgress } = await import("./services/geminiService");
      const result = await analyzeProgress(filteredNotes);
      // Hiện kết quả tạm: alert hoặc bạn có thể render modal để hiển thị chi tiết
      alert("Kết quả phân tích: " + (result?.evaluation ? result.evaluation : JSON.stringify(result)));
    } catch (err) {
      console.error("Analyze error", err);
      alert("Phân tích lỗi. Xem console.");
    }
  };

  const handleSignOut = async () => {
    try {
        await signOutUser();
        // The onAuthStateChanged listener will handle state updates
    } catch (error) {
        console.error("Error signing out: ", error);
        alert("Không thể đăng xuất. Vui lòng thử lại.");
    }
  }

  const MainContent: React.FC = () => {
    switch (view) {
      case "dashboard":
        return <Dashboard notes={notes} onAnalyze={handleAnalyze} />; 
      case "notes":
      default:
        return (
          // ...existing notes UI...
          // đảm bảo NoteList được import và dùng ở đây, truyền handleExport
          <div>
            {/* ... possibly Note Form or header ... */}
            <NoteList notes={notes} onEdit={handleSetEditing} onDelete={handleDeleteRequest} onCopy={handleCopyNote} onExport={handleExport} />
          </div>
        );
    }
  };
  
  if (!isFirebaseConfigured) {
    return <FirebaseConfigWarning />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-400"></div>
        <p className="ml-4 text-slate-300 text-lg">{currentUser ? "Đang đồng bộ hóa..." : "Đang tải ứng dụng..."}</p>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header currentView={view} setView={setView} user={currentUser} onSignOut={handleSignOut} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <MainContent />
      </main>
      {noteToDelete && (
        <ConfirmationModal
          title="Xác nhận Xóa Ghi Chú"
          message="Bạn có chắc chắn muốn xóa ghi chú này không? Hành động này không thể hoàn tác."
          onConfirm={handleConfirmDelete}
          onCancel={() => setNoteToDelete(null)}
        />
      )}
    </div>
  );
};

export default App;