import React, { useState } from 'react';
import { 
  Library, 
  Search, 
  Filter, 
  Play, 
  Edit3, 
  Download, 
  Trash2, 
  Clock, 
  Sparkles, 
  Layers, 
  BookOpen, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { VideoProject, SubjectCategory, GradeLevel } from '../types.ts';

interface VideoLibraryViewProps {
  projects: VideoProject[];
  onCreateNew: () => void;
  onOpenEditor: (project: VideoProject) => void;
  onOpenPlayer: (project: VideoProject) => void;
  onDeleteProject: (id: string) => void;
  onOpenExportModal: (project: VideoProject) => void;
}

export const VideoLibraryView: React.FC<VideoLibraryViewProps> = ({
  projects,
  onCreateNew,
  onOpenEditor,
  onOpenPlayer,
  onDeleteProject,
  onOpenExportModal,
}) => {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'duration' | 'title'>('newest');

  const filtered = projects
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.subject.toLowerCase().includes(search.toLowerCase()) ||
        p.topic.toLowerCase().includes(search.toLowerCase());
      const matchSubject = subjectFilter === 'all' || p.subject === subjectFilter;
      const matchGrade =
        gradeFilter === 'all' ||
        p.grade === gradeFilter ||
        (gradeFilter === 'MI' && (p.grade === 'MI' || p.grade.includes('MI')));
      return matchSearch && matchSubject && matchGrade;
    })
    .sort((a, b) => {
      if (sortBy === 'duration') {
        return (b.totalDurationSeconds || 0) - (a.totalDurationSeconds || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Library className="h-7 w-7 text-indigo-400" />
            Galeri & Koleksi Video Pembelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Arsip lengkap seluruh video materi yang telah disusun oleh AI dan siap dibagikan ke siswa.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Buat Video Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul atau materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Semua Mapel</option>
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
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
          >
            <option value="newest">Terbaru</option>
            <option value="duration">Durasi Terpanjang</option>
            <option value="title">Judul A-Z</option>
          </select>

        </div>

      </div>

      {/* Grid of Videos */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-200">Tidak ada video yang ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau kata kunci Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenEditor(project)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/60 hover:bg-slate-900 transition-all shadow-lg cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-bold text-white">
                  <Clock className="h-3 w-3 text-sky-400" />
                  {Math.floor((project.totalDurationSeconds || 60) / 60)}:
                  {String((project.totalDurationSeconds || 60) % 60).padStart(2, '0')}
                </div>

                {/* Subject Pill */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-bold text-white">
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
                  title="Klik untuk Putar Video"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all">
                    <Play className="h-5 w-5 ml-0.5 fill-white" />
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {project.learningMaterial}
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPlayer(project);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Putar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditor(project);
                      }}
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
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                      title="Download MP4"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                      title="Hapus"
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
