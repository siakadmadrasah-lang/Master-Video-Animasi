import React, { useState } from 'react';
import { 
  Plus, 
  Video, 
  Clock, 
  Sparkles, 
  Play, 
  Edit3, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Layers, 
  HelpCircle,
  Film,
  ExternalLink,
  CheckCircle,
  Copy,
  FolderOpen
} from 'lucide-react';
import { VideoProject, SubjectCategory, GradeLevel } from '../types.ts';

interface DashboardViewProps {
  projects: VideoProject[];
  onCreateNew: () => void;
  onOpenEditor: (project: VideoProject) => void;
  onOpenPlayer: (project: VideoProject) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: VideoProject) => void;
  onOpenExportModal: (project: VideoProject) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onCreateNew,
  onOpenEditor,
  onOpenPlayer,
  onDeleteProject,
  onDuplicateProject,
  onOpenExportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Calculate stats
  const totalVideos = projects.length;
  const totalSeconds = projects.reduce((acc, p) => acc + (p.totalDurationSeconds || 60), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalScenes = projects.reduce((acc, p) => acc + p.scenes.length, 0);
  const totalQuizzes = projects.reduce(
    (acc, p) => acc + p.scenes.filter((s) => s.sceneType === 'quiz').length,
    0
  );

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || p.subject === selectedSubject;
    const matchesGrade =
      selectedGrade === 'all' ||
      p.grade === selectedGrade ||
      (selectedGrade === 'MI' && (p.grade === 'MI' || p.grade.includes('MI')));
    return matchesSearch && matchesSubject && matchesGrade;
  });

  return (
    <div className="space-y-8">
      
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Total Video</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Film className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {totalVideos}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Siap tayang & diedit</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Durasi Pembelajaran</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {totalMinutes} <span className="text-sm font-semibold text-slate-400">Menit</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{totalSeconds} detik total konten</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Total Scene</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {totalScenes}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Rata-rata 7 scene / video</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Kuis Interaktif</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {totalQuizzes}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Evaluasi pemahaman siswa</p>
        </div>

      </div>

      {/* Action Header & Search Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Daftar Video Pembelajaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Kelola, edit storyboard, pratinjau player, dan unduh video dalam resolusi tinggi.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Buat Video Baru
        </button>
      </div>

      {/* Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul, topik, atau mata pelajaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Semua Mata Pelajaran</option>
              <optgroup label="Madrasah Ibtidaiyah (MI)">
                <option value="Fikih">Fikih</option>
                <option value="Akidah Akhlak">Akidah Akhlak</option>
                <option value="Al-Qur'an Hadis">Al-Qur'an Hadis</option>
                <option value="SKI">SKI</option>
                <option value="Bahasa Arab">Bahasa Arab</option>
              </optgroup>
              <optgroup label="Umum / Sains / Sosial">
                <option value="IPAS">IPAS</option>
                <option value="IPA">IPA</option>
                <option value="Matematika">Matematika</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="Pancasila & PPKn">Pancasila & PPKn</option>
                <option value="Informatika">Informatika</option>
                <option value="Fisika">Fisika</option>
                <option value="Biologi">Biologi</option>
                <option value="Kimia">Kimia</option>
                <option value="Sejarah">Sejarah</option>
                <option value="Geografi">Geografi</option>
                <option value="Ekonomi">Ekonomi</option>
                <option value="Seni & Budaya">Seni & Budaya</option>
              </optgroup>
            </select>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Semua Jenjang</option>
              <optgroup label="Madrasah Ibtidaiyah (MI)">
                <option value="MI">Semua Kelas MI</option>
                <option value="Kelas 1 MI">Kelas 1 MI</option>
                <option value="Kelas 2 MI">Kelas 2 MI</option>
                <option value="Kelas 3 MI">Kelas 3 MI</option>
                <option value="Kelas 4 MI">Kelas 4 MI</option>
                <option value="Kelas 5 MI">Kelas 5 MI</option>
                <option value="Kelas 6 MI">Kelas 6 MI</option>
              </optgroup>
              <optgroup label="Jenjang Lainnya">
                <option value="SD">SD (Sekolah Dasar)</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / MA / SMK</option>
                <option value="Kuliah">Kuliah / Umum</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Quick Grade Filter Grid / Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">Filter Cepat:</span>
          {[
            { id: 'all', label: 'Semua' },
            { id: 'Kelas 1 MI', label: 'Kelas 1 MI' },
            { id: 'Kelas 2 MI', label: 'Kelas 2 MI' },
            { id: 'Kelas 3 MI', label: 'Kelas 3 MI' },
            { id: 'Kelas 4 MI', label: 'Kelas 4 MI' },
            { id: 'Kelas 5 MI', label: 'Kelas 5 MI' },
            { id: 'Kelas 6 MI', label: 'Kelas 6 MI' },
            { id: 'SD', label: 'SD' },
            { id: 'SMP', label: 'SMP' },
            { id: 'SMA', label: 'SMA' },
          ].map((item) => {
            const isActive = selectedGrade === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGrade(item.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            Belum Ada Video yang Cocok
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Coba ubah kata kunci pencarian atau buat video pembelajaran baru dengan AI sekarang.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Video Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenEditor(project)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/60 hover:bg-slate-900 transition-all duration-200 shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                  <Clock className="h-3 w-3 text-sky-400" />
                  {Math.floor((project.totalDurationSeconds || 60) / 60)}:
                  {String((project.totalDurationSeconds || 60) % 60).padStart(2, '0')}
                </div>

                {/* Subject & Grade Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {project.subject}
                  </span>
                  <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                    {project.grade}
                  </span>
                </div>

                {/* Hover Play Overlay */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPlayer(project);
                  }}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
                  title="Klik untuk Pratinjau Video"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all">
                    <Play className="h-5 w-5 ml-0.5 fill-white" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>{project.scenes.length} Scenes Terstruktur</span>
                    <span className="font-medium text-indigo-400">{project.visualStyle}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                    {project.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {project.learningMaterial}
                  </p>
                </div>

                {/* Action Buttons Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPlayer(project);
                      }}
                      title="Pratinjau Video Player"
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Preview
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditor(project);
                      }}
                      title="Buka Timeline Studio Editor"
                      className="flex items-center gap-1 rounded-lg bg-indigo-600/20 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExportModal(project);
                      }}
                      title="Render & Download Video MP4"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateProject(project);
                      }}
                      title="Duplikat Proyek"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      title="Hapus Video"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
