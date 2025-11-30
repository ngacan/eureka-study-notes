import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import NoteList from "./components/NoteList";
import NoteForm from "./components/NoteForm";
import Dashboard from "./components/Dashboard";
import { Note, View } from "./types";

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<View>("notes");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes: try firebase service (subscribe or get), fallback to localStorage
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    const init = async () => {
      try {
        const svc = await import("./services/firebaseService").catch(() => null);
        if (svc && typeof svc.subscribeToNotes === "function") {
          unsub = svc.subscribeToNotes((items: Note[]) => {
            if (!mounted) return;
            setNotes(items || []);
            setIsLoading(false);
          });
        } else if (svc && typeof svc.getNotes === "function") {
          const items = await svc.getNotes();
          if (!mounted) return;
          setNotes(items || []);
          setIsLoading(false);
        } else {
          // fallback localStorage
          const raw = localStorage.getItem("eureka_notes");
          setNotes(raw ? JSON.parse(raw) : []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Load notes error:", err);
        const raw = localStorage.getItem("eureka_notes");
        setNotes(raw ? JSON.parse(raw) : []);
        setIsLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // persist fallback
  useEffect(() => {
    try {
      localStorage.setItem("eureka_notes", JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const handleExport = async (selectedNotes?: (Note & { selectedErrorIndexes?: number[] })[]) => {
    const toExport = selectedNotes && selectedNotes.length ? selectedNotes : notes;
    try {
      const mod = await import("./utils/exportNotesToPdf");
      await mod.exportNotesToPdf(toExport as any[]);
    } catch (err) {
      console.error("Export failed", err);
      alert("Không thể xuất PDF. Xem console.");
    }
  };

  const handleAnalyze = async (filteredNotes: Note[]) => {
    try {
      const svc = await import("./services/geminiService");
      const res = await svc.analyzeProgress(filteredNotes);
      // simple display; replace with modal if needed
      alert("Phân tích: " + (res?.evaluation ?? JSON.stringify(res)));
    } catch (err) {
      console.error("Analyze failed", err);
      alert("Phân tích thất bại. Xem console.");
    }
  };

  // basic CRUD handlers (attempt to call firebase service if available)
  const saveNote = async (note: Note) => {
    // debug: in ra note nhận từ NoteForm
    console.log("saveNote called (input):", note);

    // chuẩn hoá/đảm bảo các trường cốt lõi luôn có
    const normalized: Note = {
      id: note.id ?? `note_${Date.now()}`,

      title: (note.title ?? "").toString(),
      content: (note.content ?? note.text ?? "").toString(),
      subject: note.subject ?? "other",
      difficulty: note.difficulty ?? "easy",
      createdAt: note.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      ...note,
    };

    try {
      const svc = await import("./services/firebaseService").catch(() => null);
      if (svc && typeof svc.saveNote === "function") {
        // gọi service, ưu tiên dùng object trả về nếu service trả về object hoàn chỉnh
        const saved = await svc.saveNote(normalized);
        console.log("saveNote -> service returned:", saved);
        const toUpsert = (saved && saved.id) ? saved : normalized;

        setNotes(prev => {
          const idx = prev.findIndex(p => p.id === toUpsert.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = toUpsert;
            return copy;
          }
          return [toUpsert, ...prev];
        });
      } else {
        // fallback: cập nhật local state
        setNotes(prev => {
          const idx = prev.findIndex(p => p.id === normalized.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = normalized;
            return copy;
          }
          return [normalized, ...prev];
        });
      }
    } catch (err) {
      console.error("Save note error", err);
    }
  };

  const requestDelete = (id: string) => setNoteToDelete(id);

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      const svc = await import("./services/firebaseService").catch(() => null);
      if (svc && typeof svc.deleteNote === "function") {
        await svc.deleteNote(noteToDelete);
      } else {
        setNotes(prev => prev.filter(n => n.id !== noteToDelete));
      }
    } catch (err) {
      console.error("Delete error", err);
    } finally {
      setNoteToDelete(null);
    }
  };

  const openNewNote = () => {
    setEditingNote(null);
    setView("new_note");
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setView("edit_note");
  };

  const MainContent: React.FC = () => {
    if (isLoading) return <div>Đang tải...</div>;

    switch (view) {
      case "dashboard":
        return <Dashboard notes={notes} onAnalyze={handleAnalyze} />;
      case "new_note":
        return (
          <div>
            <NoteForm onSave={async (n) => { await saveNote(n); setView("notes"); }} onCancel={() => setView("notes")} />
            <NoteList notes={notes} onEdit={openEdit} onDelete={requestDelete} onExport={handleExport} />
          </div>
        );
      case "edit_note":
        return (
          <div>
            <NoteForm note={editingNote ?? undefined} onSave={async (n) => { await saveNote(n); setView("notes"); }} onCancel={() => setView("notes")} />
            <NoteList notes={notes} onEdit={openEdit} onDelete={requestDelete} onExport={handleExport} />
          </div>
        );
      case "notes":
      default:
        return (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ghi Chú Của Tôi</h2>
              <div>
                <button onClick={openNewNote} className="px-3 py-1 bg-sky-500 rounded">Tạo mới</button>
              </div>
            </div>
            <NoteList notes={notes} onEdit={openEdit} onDelete={requestDelete} onExport={handleExport} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header currentView={view} setView={setView} user={currentUser} onSignOut={() => setCurrentUser(null)} />
      <main className="container mx-auto p-4">
        <MainContent />
      </main>

      {/* simple confirm modal placeholder */}
      {noteToDelete && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-black/70 p-4 rounded">
            <div className="text-white mb-3">Xác nhận xóa ghi chú?</div>
            <div className="flex gap-2">
              <button onClick={confirmDelete} className="px-3 py-1 bg-red-600 rounded">Xóa</button>
              <button onClick={() => setNoteToDelete(null)} className="px-3 py-1 bg-slate-600 rounded">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;