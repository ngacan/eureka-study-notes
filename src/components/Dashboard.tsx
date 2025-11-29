import React, { useMemo, useState } from "react";
import { Note } from "../types";

type Props = {
  notes: Note[];
  onAnalyze: (notes: Note[]) => Promise<void> | void;
};

const Dashboard: React.FC<Props> = ({ notes, onAnalyze }) => {
  const [timeRange, setTimeRange] = useState<"7d" | "1m" | "custom">("7d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [subject, setSubject] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [errorText, setErrorText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const subjects = useMemo(() => Array.from(new Set(notes.map(n => n.subject).filter(Boolean))), [notes]);
  const difficulties = useMemo(() => Array.from(new Set(notes.map(n => n.difficulty).filter(Boolean))), [notes]);

  const filtered = useMemo(() => {
    const now = new Date();
    let fromDate = new Date(0);
    if (timeRange === "7d") {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "1m") {
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "custom" && customFrom) {
      fromDate = new Date(customFrom);
    }

    let toDate = new Date(8640000000000000);
    if (timeRange === "custom" && customTo) toDate = new Date(customTo);

    return notes.filter(n => {
      const dt = new Date((n.updatedAt ?? n.createdAt ?? Date.now()) as any);
      if (dt < fromDate || dt > toDate) return false;
      if (subject !== "all" && n.subject !== subject) return false;
      if (difficulty !== "all" && n.difficulty !== difficulty) return false;
      if (errorText && !((n.content ?? n.title ?? "") + " " + (n.title ?? "")).toLowerCase().includes(errorText.toLowerCase())) return false;
      return true;
    });
  }, [notes, timeRange, customFrom, customTo, subject, difficulty, errorText]);

  const doAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyze(filtered);
    } catch (err) {
      console.error("Analyze error", err);
      alert("Lỗi khi phân tích. Xem console.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tổng hợp & Hướng dẫn</h2>

      <div className="bg-slate-800 rounded p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="text-xs text-slate-400">Khoảng thời gian</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setTimeRange("7d")} className={`px-3 py-1 rounded ${timeRange === "7d" ? "bg-sky-500" : "bg-slate-700/50"}`}>7 ngày</button>
              <button onClick={() => setTimeRange("1m")} className={`px-3 py-1 rounded ${timeRange === "1m" ? "bg-sky-500" : "bg-slate-700/50"}`}>1 tháng</button>
              <button onClick={() => setTimeRange("custom")} className={`px-3 py-1 rounded ${timeRange === "custom" ? "bg-sky-500" : "bg-slate-700/50"}`}>Tuỳ chỉnh</button>
            </div>
            {timeRange === "custom" && (
              <div className="flex gap-2 mt-2">
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-2 py-1 rounded bg-slate-700 text-sm" />
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-2 py-1 rounded bg-slate-700 text-sm" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400">Môn</label>
            <select className="ml-2 bg-slate-700 px-2 py-1 rounded text-sm" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="all">Tất cả</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Độ khó</label>
            <select className="ml-2 bg-slate-700 px-2 py-1 rounded text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="all">Tất cả</option>
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-slate-400">Tìm theo lỗi / từ khoá</label>
            <input value={errorText} onChange={(e) => setErrorText(e.target.value)} placeholder="Ví dụ: hiểu sai khái niệm X" className="w-full bg-slate-700 px-2 py-1 rounded text-sm mt-1" />
          </div>

          <div className="flex items-end">
            <button onClick={doAnalyze} disabled={isAnalyzing} className="px-4 py-2 bg-sky-500 rounded">
              {isAnalyzing ? "Đang phân tích..." : `Phân tích (${filtered.length})`}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm text-slate-400 mb-2">Ghi chú lọc được ({filtered.length})</h3>
        <div className="bg-slate-800 rounded p-3">
          {filtered.length === 0 ? <p className="text-slate-400">Không có ghi chú phù hợp.</p> : (
            <ul className="space-y-2">
              {filtered.map(n => (
                <li key={n.id} className="p-2 bg-slate-900 rounded">
                  <div className="font-medium">{n.title ?? "(Không tiêu đề)"}</div>
                  <div className="text-xs text-slate-400">{n.subject ?? "—"} • {n.difficulty ?? "—"} • {new Date((n.updatedAt ?? n.createdAt ?? Date.now()) as any).toLocaleDateString("vi-VN")}</div>
                  <div className="mt-1 text-sm text-slate-300">{(n.content ?? "").slice(0, 250)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;