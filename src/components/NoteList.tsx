import React, { useMemo, useState } from "react";
import { Note } from "../types";

type ExportNote = Note & { selectedErrorIndexes?: number[] };

type Props = {
  notes: Note[];
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onCopy?: (note: Note) => void;
  onExport?: (exportNotes: ExportNote[]) => Promise<void> | void;
};

const NoteList: React.FC<Props> = ({ notes, onEdit, onDelete, onCopy, onExport }) => {
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [selectedErrorsMap, setSelectedErrorsMap] = useState<Record<string, Set<number>>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const toggleNote = (id: string) => {
    setSelectedNoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleError = (noteId: string, idx: number) => {
    setSelectedErrorsMap(prev => {
      const copy = { ...prev };
      const setFor = new Set(copy[noteId] ?? []);
      if (setFor.has(idx)) setFor.delete(idx);
      else setFor.add(idx);
      copy[noteId] = setFor;
      return copy;
    });
  };

  const allSelected = useMemo(() => notes.length > 0 && notes.every(n => selectedNoteIds.has(n.id)), [notes, selectedNoteIds]);

  const toggleSelectAll = () => {
    if (allSelected) setSelectedNoteIds(new Set());
    else setSelectedNoteIds(new Set(notes.map(n => n.id)));
  };

  const buildExportPayload = (useSelected: boolean) => {
    const target = useSelected ? notes.filter(n => selectedNoteIds.has(n.id)) : notes;
    return target.map(n => {
      const errs = Array.isArray((n as any).errors) ? (n as any).errors : Array.isArray((n as any).mistakes) ? (n as any).mistakes : [];
      const selectedSet = selectedErrorsMap[n.id];
      const selectedIdxs = selectedSet && selectedSet.size > 0 ? Array.from(selectedSet) : undefined;
      // if selectedIdxs defined but empty, we treat as none
      return {
        ...n,
        selectedErrorIndexes: selectedIdxs,
      } as ExportNote;
    });
  };

  const doExport = async (useSelected: boolean) => {
    setIsExporting(true);
    try {
      const payload = buildExportPayload(useSelected);
      if (onExport) {
        await onExport(payload);
      } else {
        const mod = await import("../utils/exportNotesToPdf");
        await mod.exportNotesToPdf(payload);
      }
    } catch (err) {
      console.error("Export error", err);
      alert("Lỗi khi xuất PDF. Kiểm tra console.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={toggleSelectAll} className="px-3 py-1 bg-slate-700 rounded text-sm">
            {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
          <button onClick={() => doExport(true)} disabled={selectedNoteIds.size === 0 || isExporting} className="px-3 py-1 bg-sky-500 rounded text-sm">
            Xuất đã chọn
          </button>
          <button onClick={() => doExport(false)} disabled={notes.length === 0 || isExporting} className="px-3 py-1 bg-green-600 rounded text-sm">
            Xuất tất cả
          </button>
        </div>
        <div className="text-sm text-slate-400">{notes.length} ghi chú</div>
      </div>

      <div className="bg-slate-800 rounded p-3">
        {notes.length === 0 ? (
          <p className="text-slate-400">Chưa có ghi chú nào.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map(n => {
              const errs = Array.isArray((n as any).errors) ? (n as any).errors : Array.isArray((n as any).mistakes) ? (n as any).mistakes : [];
              const selectedSet = selectedErrorsMap[n.id] ?? new Set<number>();
              return (
                <li key={n.id} className="bg-slate-900 p-2 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selectedNoteIds.has(n.id)} onChange={() => toggleNote(n.id)} />
                      <div>
                        <div className="font-medium text-white">{(n.title ?? "(Không tiêu đề)")}</div>
                        <div className="text-xs text-slate-400">{n.subject ?? "—"} • {n.difficulty ?? "—"}</div>
                        <div className="text-xs text-slate-500 mt-1">{((n.content ?? n.text ?? "") as string).slice(0, 120)}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-slate-400">{new Date((n.updatedAt ?? n.createdAt ?? Date.now()) as any).toLocaleDateString("vi-VN")}</div>
                      <div className="flex gap-2">
                        {onEdit && <button onClick={() => onEdit(n)} className="text-slate-300 hover:text-white text-xs">Sửa</button>}
                        {onCopy && <button onClick={() => onCopy(n)} className="text-slate-300 hover:text-white text-xs">Sao chép</button>}
                        {onDelete && <button onClick={() => onDelete(n.id)} className="text-red-400 text-xs">Xóa</button>}
                        {errs.length > 0 && (
                          <button onClick={() => toggleExpand(n.id)} className="text-sky-400 text-xs">
                            {expandedIds.has(n.id) ? "Ẩn lỗi" : `Xem lỗi (${errs.length})`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedIds.has(n.id) && errs.length > 0 && (
                    <div className="mt-2 ml-6 bg-slate-800 p-2 rounded">
                      <div className="text-xs text-slate-300 mb-1">Chọn lỗi để xuất:</div>
                      <ul className="space-y-1">
                        {errs.map((e: any, idx: number) => {
                          const text = typeof e === "string" ? e : (e?.text ?? JSON.stringify(e));
                          return (
                            <li key={idx} className="flex items-start gap-2">
                              <input type="checkbox" checked={selectedSet.has(idx)} onChange={() => toggleError(n.id, idx)} />
                              <div className="text-xs text-slate-300">{text}</div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NoteList;