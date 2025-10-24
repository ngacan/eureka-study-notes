import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Note, ProgressAnalysis, SUBJECT_KEYS } from '../types';
import { analyzeMistakes, analyzeProgress } from '../services/geminiService';
import { SUBJECTS } from '../constants';

interface DashboardProps {
    notes: Note[];
    onExport: (progressAnalysis: ProgressAnalysis, mistakeAnalysis: string) => void;
    isExporting: boolean;
}

type TimeFrame = '7' | '30' | 'all';

const Dashboard: React.FC<DashboardProps> = ({ notes, onExport, isExporting }) => {
  const [mistakeAnalysis, setMistakeAnalysis] = useState('');
  const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30');
  
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const filteredNotes = useMemo(() => {
    if (timeFrame === 'all') {
      return notes;
    }
    const days = parseInt(timeFrame);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return notes.filter(note => new Date(note.createdAt) >= cutoffDate);
  }, [notes, timeFrame]);

  const handleAnalyze = async () => {
    if (filteredNotes.length === 0) {
        alert("Không có ghi chú nào trong khoảng thời gian đã chọn để phân tích.");
        return;
    }

    setIsLoading(true);
    setHasAnalyzed(false);
    setMistakeAnalysis('');
    setProgressAnalysis(null);
    const [mistakes, progress] = await Promise.all([
        analyzeMistakes(filteredNotes),
        analyzeProgress(filteredNotes)
    ]);

    if (isMounted.current) {
        setMistakeAnalysis(mistakes);
        setProgressAnalysis(progress);
        setHasAnalyzed(true);
        setIsLoading(false);
    }
  };
  
  const difficultyColors: Record<string, string> = {
    easy: '#4ade80', medium: '#facc15', hard: '#fb923c', critical: '#f87171'
  }
  
  const subjectColors = SUBJECT_KEYS.reduce((acc, key) => {
    const colorPalette = ['#38bdf8', '#4ade80', '#facc15', '#a78bfa', '#f472b6', '#2dd4bf', '#9ca3af'];
    const index = SUBJECT_KEYS.indexOf(key) % colorPalette.length;
    acc[key] = colorPalette[index];
    return acc;
  }, {} as Record<string, string>);
  
  const TimeFrameButton: React.FC<{ value: TimeFrame; label: string }> = ({ value, label }) => (
    <button
        onClick={() => setTimeFrame(value)}
        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 ${
            timeFrame === value
                ? 'bg-sky-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600/70 text-slate-300'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div id="dashboard-content" className="space-y-8 animate-fade-in">
      <div className="p-6 bg-slate-800 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold text-sky-400">Tổng Hợp và Hướng Dẫn Học Tập</h2>
        <p className="text-slate-400 mt-2">Nhận phân tích chuyên sâu và theo dõi tiến độ của bạn theo thời gian bằng AI.</p>
        
        <div className="mt-6 space-y-3">
            <div className="text-sm text-slate-400">Chọn khoảng thời gian phân tích:</div>
            <div className="flex justify-center items-center gap-3">
                <TimeFrameButton value="7" label="7 ngày qua" />
                <TimeFrameButton value="30" label="30 ngày qua" />
                <TimeFrameButton value="all" label="Toàn bộ" />
            </div>
        </div>

        <div className="mt-4 flex justify-center items-center gap-4">
            <button 
              onClick={handleAnalyze} 
              disabled={isLoading || notes.length === 0}
              className="px-6 py-2 bg-sky-600 text-white rounded-md font-semibold transition-all duration-200 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isLoading ? 'AI đang phân tích...' : (hasAnalyzed ? 'Phân tích lại' : 'Bắt đầu Phân tích')}
            </button>
            {hasAnalyzed && (
                <button
                    onClick={() => progressAnalysis && onExport(progressAnalysis, mistakeAnalysis)}
                    disabled={isExporting || isLoading || !progressAnalysis}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md font-semibold transition-all duration-200 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                    {isExporting ? 'Đang xuất...' : 'Xuất Báo Cáo PDF'}
                </button>
            )}
        </div>
         {notes.length === 0 && <p className="text-sm text-yellow-400 mt-3">Hãy thêm ít nhất một ghi chú để có thể bắt đầu phân tích.</p>}
         {notes.length > 0 && filteredNotes.length === 0 && (
             <p className="text-sm text-yellow-400 mt-3">Không có ghi chú nào được tạo trong khoảng thời gian đã chọn.</p>
         )}
      </div>
      
      {isLoading && (
        <div className="flex flex-col justify-center items-center py-20 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-400"></div>
            <p className="ml-4 text-slate-300 mt-4">AI đang xử lý {filteredNotes.length} ghi chú...</p>
            <p className="text-slate-500 text-sm">Quá trình này có thể mất một chút thời gian.</p>
        </div>
      )}

      {hasAnalyzed && !isLoading && progressAnalysis && (
        <>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <div className="xl:col-span-3 bg-slate-800 p-6 rounded-lg shadow-xl space-y-4">
               <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2 mb-4">Phân tích & Gợi ý của AI</h3>
               <p className="text-slate-300 text-sm italic">{progressAnalysis.evaluation}</p>
               <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mistakeAnalysis.replace(/\n/g, '<br />') }}></div>
            </div>
            <div className="xl:col-span-2 bg-slate-800 p-6 rounded-lg shadow-xl">
              <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2 mb-4">Tiến độ theo Độ khó</h3>
              {progressAnalysis.chartDataByDifficulty.length > 0 ? (
                  <div className="w-full h-80">
                      <ResponsiveContainer>
                          <BarChart data={progressAnalysis.chartDataByDifficulty} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                              <Legend wrapperStyle={{fontSize: "12px"}}/>
                              <Bar dataKey="easy" stackId="a" fill={difficultyColors.easy} name="Dễ" />
                              <Bar dataKey="medium" stackId="a" fill={difficultyColors.medium} name="Trung bình" />
                              <Bar dataKey="hard" stackId="a" fill={difficultyColors.hard} name="Khó" />
                              <Bar dataKey="critical" stackId="a" fill={difficultyColors.critical} name="Rất khó" />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              ) : <p className="text-slate-400 text-center py-10">Không có dữ liệu tiến độ.</p>}
            </div>
        </div>

         <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2 mb-4">Phân bổ Ghi chú theo Môn học</h3>
            {progressAnalysis.chartDataBySubject.length > 0 ? (
                <div className="w-full h-80">
                    <ResponsiveContainer>
                        <BarChart data={progressAnalysis.chartDataBySubject} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            {SUBJECT_KEYS.map(key => (
                                <Bar key={key} dataKey={key} stackId="a" fill={subjectColors[key]} name={SUBJECTS[key].label} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : <p className="text-slate-400 text-center py-10">Không có dữ liệu môn học.</p>}
        </div>
        </>
      )}
      
      {!hasAnalyzed && !isLoading && notes.length > 0 && (
         <div className="text-center py-16 px-6 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
          <h3 className="text-xl font-semibold text-slate-300">Sẵn sàng để phân tích</h3>
          <p className="text-slate-500 mt-2">Chọn một khoảng thời gian và nhấn nút "Bắt đầu Phân tích" ở trên để AI đánh giá các ghi chú của bạn.</p>
        </div>
      )}

    </div>
  );
};

export default Dashboard;