import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Note, ProgressAnalysis, SUBJECT_KEYS } from '../types';
import { analyzeMistakes, analyzeProgress } from '../services/geminiService';
import { SUBJECTS } from '../constants';

interface DashboardProps {
    notes: Note[];
    onExport: (message: string) => void;
    isExporting: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ notes, onExport, isExporting }) => {
  const [mistakeAnalysis, setMistakeAnalysis] = useState('');
  const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAnalyze = async () => {
    if (notes.length === 0) return;
    setIsLoading(true);
    setHasAnalyzed(false);
    setMistakeAnalysis('');
    setProgressAnalysis(null);
    
    // Use Promise.allSettled to handle potential errors in one API call without stopping the other
    const [mistakesResult, progressResult] = await Promise.allSettled([
        analyzeMistakes(notes),
        analyzeProgress(notes)
    ]);

    if (isMounted.current) {
        const newMistakeAnalysis = mistakesResult.status === 'fulfilled' ? mistakesResult.value : "Không thể tải phân tích lỗi sai. Vui lòng thử lại.";
        const newProgressAnalysis = progressResult.status === 'fulfilled' ? progressResult.value : null;

        setMistakeAnalysis(newMistakeAnalysis);
        setProgressAnalysis(newProgressAnalysis);
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

  // Render markdown with simple replacements
  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-sky-300 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-sky-400 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-sky-400 mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br />');

    // Wrap list items in a <ul>
    return `<ul>${html.replace(/<br \/>/g, '\n').split('\n').map(line => line.startsWith('<li') ? line : line.replace(/<br \/>/g, '')).join('').replace(/<\/li><ul>/g, '</li></ul><ul>').replace(/<\/li><br \/>/g, '</li>')}</ul>`.replace(/<ul><br \/>/g, '<ul>').replace(/<br \/><ul>/g, '<ul>');
  };

  return (
    <div id="dashboard-content" className="space-y-8 animate-fade-in">
      <div className="p-6 bg-slate-800 rounded-lg shadow-xl text-center border border-slate-700">
        <h2 className="text-2xl font-bold text-sky-400">Tổng Hợp và Hướng Dẫn Học Tập</h2>
        <p className="text-slate-400 mt-2">Nhận phân tích chuyên sâu và theo dõi tiến độ của bạn theo thời gian bằng AI.</p>
        <div className="mt-4 flex justify-center items-center gap-4">
            <button 
              onClick={handleAnalyze} 
              disabled={isLoading || notes.length === 0}
              className="px-6 py-2 bg-sky-600 text-white rounded-md font-semibold transition-all duration-200 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>AI đang phân tích...</span>
                </>
              ) : (hasAnalyzed ? 'Phân tích lại' : 'Bắt đầu Phân tích')}
            </button>
        </div>
         {notes.length === 0 && <p className="text-sm text-yellow-400 mt-3">Hãy thêm ít nhất một ghi chú để có thể bắt đầu phân tích.</p>}
      </div>
      
      {isLoading && (
        <div className="flex flex-col justify-center items-center py-20 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-400"></div>
            <p className="ml-4 text-slate-300 mt-4">AI đang xử lý dữ liệu của bạn...</p>
            <p className="text-slate-500 text-sm">Quá trình này có thể mất một chút thời gian.</p>
        </div>
      )}

      {hasAnalyzed && !isLoading && (
        <>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <div className="xl:col-span-3 bg-slate-800 p-6 rounded-lg shadow-xl space-y-4 border border-slate-700">
               <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2 mb-4">Phân tích & Gợi ý của AI</h3>
               {progressAnalysis && <p className="text-slate-300 text-sm italic">{progressAnalysis.evaluation}</p>}
               <div className="prose prose-invert prose-sm max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: renderMarkdown(mistakeAnalysis) }}></div>
            </div>
            <div className="xl:col-span-2 bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
              <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2 mb-4">Tiến độ theo Độ khó</h3>
              {progressAnalysis && progressAnalysis.chartDataByDifficulty.length > 0 ? (
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
              ) : <p className="text-slate-400 text-center py-10">Không có dữ liệu tiến độ để hiển thị.</p>}
            </div>
        </div>

         <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2 mb-4">Phân bổ Ghi chú theo Môn học</h3>
            {progressAnalysis && progressAnalysis.chartDataBySubject.length > 0 ? (
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
            ) : <p className="text-slate-400 text-center py-10">Không có dữ liệu môn học để hiển thị.</p>}
        </div>
        </>
      )}
      
      {!hasAnalyzed && !isLoading && notes.length > 0 && (
         <div className="text-center py-16 px-6 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
          <h3 className="text-xl font-semibold text-slate-300">Sẵn sàng để phân tích</h3>
          <p className="text-slate-500 mt-2">Nhấn nút "Bắt đầu Phân tích" ở trên để AI đánh giá các ghi chú của bạn.</p>
        </div>
      )}

    </div>
  );
};

export default Dashboard;