import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft,
  Play, 
  Pause, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  BookOpen, 
  RotateCcw, 
  Share2, 
  Download, 
  Layers,
  Volume2,
  FileText,
  Sparkles
} from 'lucide-react';
import { VideoProject, Scene } from '../types.ts';
import { LiveVideoPlayer } from './editor/LiveVideoPlayer.tsx';
import { speakNarrationBrowser } from '../utils/audioSynth.ts';

interface InteractivePlayerModalProps {
  project: VideoProject;
  onClose: () => void;
  onOpenExportModal: (project: VideoProject) => void;
}

export const InteractivePlayerModal: React.FC<InteractivePlayerModalProps> = ({
  project,
  onClose,
  onOpenExportModal,
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [userScore, setUserScore] = useState<number>(0);
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'explanation' | 'quiz'>('explanation');
  const [playingSceneNarrationId, setPlayingSceneNarrationId] = useState<string | null>(null);

  const quizScenes = project.scenes.filter((s) => s.sceneType === 'quiz' && s.quizQuestion);

  const handleSelectQuizAnswer = (sceneId: string, optionIndex: number, correctIndex: number) => {
    if (answeredQuizzes[sceneId] !== undefined) return;

    setAnsweredQuizzes((prev) => ({
      ...prev,
      [sceneId]: optionIndex,
    }));

    if (optionIndex === correctIndex) {
      setUserScore((prev) => prev + 100);
    }
  };

  const handlePlaySceneNarration = (scene: Scene) => {
    if (playingSceneNarrationId === scene.id) {
      window.speechSynthesis?.cancel();
      setPlayingSceneNarrationId(null);
      return;
    }

    setPlayingSceneNarrationId(scene.id);
    speakNarrationBrowser(scene.narration, {
      gender: project.voiceConfig?.gender || 'female',
      speed: project.voiceConfig?.speed || 1.0,
      onEnd: () => setPlayingSceneNarrationId(null),
      onError: () => setPlayingSceneNarrationId(null),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-2 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
        
        {/* Header Bar with Back Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              title="Kembali ke Dashboard / Editor"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white border border-slate-800 transition-all shadow-sm group"
            >
              <ArrowLeft className="h-4 w-4 text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali</span>
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-400 font-bold border border-indigo-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-md">
                  {project.title}
                </h2>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                  {project.subject} • {project.grade}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mode Pembelajaran Interaktif Siswa & Penjelasan Materi Lengkap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenExportModal(project)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all border border-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh MP4</span>
            </button>

            <button
              onClick={onClose}
              title="Tutup Preview"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors border border-transparent hover:border-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage */}
        <div>
          <LiveVideoPlayer
            project={project}
            activeSceneIndex={activeSceneIndex}
            onSceneChange={(idx) => setActiveSceneIndex(idx)}
          />
        </div>

        {/* Navigation Tabs between Material Explanation & Quiz */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'explanation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>📖 Penjelasan & Naskah Materi ({project.scenes.length} Bagian)</span>
          </button>

          {quizScenes.length > 0 && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>❓ Kuis Pemahaman ({quizScenes.length} Soal)</span>
              {userScore > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                  {userScore} Poin
                </span>
              )}
            </button>
          )}
        </div>

        {/* TAB 1: Material Explanation & Scene Breakdown */}
        {activeTab === 'explanation' && (
          <div className="space-y-4">
            
            {/* Full Learning Material Card */}
            {project.learningMaterial && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <FileText className="h-4 w-4" />
                  <span>Teks Sumber Materi Pembelajaran Guru:</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {project.learningMaterial}
                </p>
              </div>
            )}

            {/* Scene-by-Scene Explanation Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Runtutan Penjelasan Materi Per Scene:</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.scenes.map((sc, idx) => {
                  const isCurrent = idx === activeSceneIndex;
                  return (
                    <div
                      key={sc.id}
                      className={`rounded-2xl border p-4 space-y-2.5 transition-all ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                            isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
                            {sc.overlayTitle || sc.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePlaySceneNarration(sc)}
                            title="Dengarkan Suara Guru"
                            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                              playingSceneNarrationId === sc.id
                                ? 'bg-indigo-600 text-white animate-pulse'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setActiveSceneIndex(idx)}
                            className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-800 text-indigo-300 hover:bg-slate-700"
                          >
                            Lompat ke Scene
                          </button>
                        </div>
                      </div>

                      {sc.overlaySubtitle && (
                        <p className="text-[11px] text-indigo-300 font-medium">
                          {sc.overlaySubtitle}
                        </p>
                      )}

                      {/* Narration explanation */}
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        {sc.narration}
                      </p>

                      {/* Bullet points if any */}
                      {sc.bulletPoints && sc.bulletPoints.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {sc.bulletPoints.map((bp, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                              <span>{bp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Interactive Classroom Evaluation & Quiz Hub */}
        {activeTab === 'quiz' && quizScenes.length > 0 && (
          <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-950/20 via-slate-900/60 to-indigo-950/20 p-5 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-300 font-bold text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>Kuis Pemahaman Siswa:</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-pink-500/20 px-3 py-1 text-xs font-bold text-pink-300 border border-pink-500/30">
                <Award className="h-3.5 w-3.5" />
                Skor Anda: {userScore} Poin
              </div>
            </div>

            <div className="space-y-4">
              {quizScenes.map((sc, qIdx) => {
                const quiz = sc.quizQuestion!;
                const userChoice = answeredQuizzes[sc.id];
                const isAnswered = userChoice !== undefined;
                const isCorrect = userChoice === quiz.correctIndex;

                return (
                  <div
                    key={sc.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Soal #{qIdx + 1} (Scene {sc.order})</span>
                      {isAnswered && (
                        <span
                          className={`flex items-center gap-1 font-bold ${
                            isCorrect ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Benar (+100)
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" /> Kurang Tepat
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {quiz.question}
                    </h4>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quiz.options.map((opt, optIdx) => {
                        const isChosen = userChoice === optIdx;
                        let btnStyle = 'border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500';

                        if (isAnswered) {
                          if (optIdx === quiz.correctIndex) {
                            btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold';
                          } else if (isChosen && !isCorrect) {
                            btnStyle = 'border-rose-500 bg-rose-950/40 text-rose-200';
                          } else {
                            btnStyle = 'border-slate-900 bg-slate-950/50 text-slate-500 opacity-60';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() =>
                              handleSelectQuizAnswer(sc.id, optIdx, quiz.correctIndex)
                            }
                            className={`rounded-xl border p-3 text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>
                              <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                            </span>
                            {isAnswered && optIdx === quiz.correctIndex && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {isAnswered && (
                      <div className="rounded-xl bg-slate-900/90 p-3 border border-emerald-500/30 text-xs text-slate-300">
                        <p className="font-bold text-emerald-400 mb-1">
                          💡 Pembahasan Guru:
                        </p>
                        <p>{quiz.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm group"
          >
            <ArrowLeft className="h-4 w-4 text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Dashboard / Editor</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenExportModal(project)}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor & Unduh Video</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
