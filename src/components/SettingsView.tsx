import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Sparkles, 
  Volume2, 
  Subtitles, 
  ShieldCheck, 
  Save, 
  Check, 
  GraduationCap, 
  Cpu,
  HelpCircle,
  Video,
  LogOut
} from 'lucide-react';
import { UserProfile, SubjectCategory, GradeLevel } from '../types.ts';

interface SettingsViewProps {
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  hasApiKey: boolean;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateUser,
  hasApiKey,
  onLogout,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [institution, setInstitution] = useState(currentUser.institution);
  const [defaultSubject, setDefaultSubject] = useState<SubjectCategory>(currentUser.defaultSubject);
  const [defaultGrade, setDefaultGrade] = useState<GradeLevel>(currentUser.defaultGrade);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name,
      institution,
      defaultSubject,
      defaultGrade,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-indigo-400" />
          Pengaturan Edukator & Konfigurasi AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Sesuaikan identitas pengajar, preferensi bawaan materi, dan status mesin kecerdasan buatan.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Profil Pengajar / Instansi</h2>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 text-xs font-bold transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar Akun</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-indigo-500/40"
            />
            <div>
              <p className="text-sm font-bold text-white">{currentUser.name}</p>
              <p className="text-xs text-slate-400 capitalize">{currentUser.role} • {currentUser.institution}</p>
              <span className="inline-block mt-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                Akun Guru Aktif
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Nama Lengkap Pengajar</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Asal Sekolah / Kampus</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Mata Pelajaran Utama</label>
              <select
                value={defaultSubject}
                onChange={(e) => setDefaultSubject(e.target.value as SubjectCategory)}
                className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="IPA">IPA</option>
                <option value="Fisika">Fisika</option>
                <option value="Biologi">Biologi</option>
                <option value="Matematika">Matematika</option>
                <option value="Informatika">Informatika</option>
                <option value="Sejarah">Sejarah</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Jenjang Utama</label>
              <select
                value={defaultGrade}
                onChange={(e) => setDefaultGrade(e.target.value as GradeLevel)}
                className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="SD">SD (Kelas 1-6)</option>
                <option value="SMP">SMP (Kelas 7-9)</option>
                <option value="SMA">SMA (Kelas 10-12)</option>
                <option value="Kuliah">Kuliah / Umum</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Engine Status Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Status Mesin AI & Model Gemini</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-3.5 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="font-bold text-white">Gemini 3.7 Flash</p>
                  <p className="text-[11px] text-slate-400">Storyboard Generator & Pedagogical Parser</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                Server-Side Active
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-3.5 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Volume2 className="h-4 w-4 text-sky-400" />
                <div>
                  <p className="font-bold text-white">Gemini 3.1 Flash TTS & Browser Audio Engine</p>
                  <p className="text-[11px] text-slate-400">Speech Synthesis Suara Pengajar Indonesia</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                Siap Digunakan
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Pengaturan Disimpan!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
