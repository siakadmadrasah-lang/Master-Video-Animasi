import React from 'react';
import { X, Check, User, GraduationCap, School } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface AuthModalProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onSelectUser,
  onClose,
}) => {
  const PRESET_ACCOUNTS: UserProfile[] = [
    {
      id: 'usr-1',
      name: 'Bu Siti Rahmawati, S.Pd',
      email: 'siti.rahmawati@sekolah.sch.id',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      role: 'guru',
      institution: 'SD Negeri Harapan Bangsa',
      defaultSubject: 'IPA',
      defaultGrade: 'SD',
    },
    {
      id: 'usr-2',
      name: 'Pak Dimas Aryo, M.Pd',
      email: 'dimas.aryo@smpnegeri.sch.id',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'guru',
      institution: 'SMP Negeri 1 Surabaya',
      defaultSubject: 'Fisika',
      defaultGrade: 'SMP',
    },
    {
      id: 'usr-3',
      name: 'Dr. Hendra Wijaya, S.Kom, M.T',
      email: 'hendra.wijaya@eduvideo.ac.id',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'guru',
      institution: 'SMA Bintang Nusantara',
      defaultSubject: 'Informatika',
      defaultGrade: 'SMA',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Ganti Akun Edukator</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Pilih profil pengajar untuk menyesuaikan gaya materi, mata pelajaran bawaan, dan identitas video:
        </p>

        <div className="space-y-2.5">
          {PRESET_ACCOUNTS.map((acc) => {
            const isCurrent = acc.id === currentUser.id;
            return (
              <div
                key={acc.id}
                onClick={() => {
                  onSelectUser(acc);
                  onClose();
                }}
                className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={acc.avatarUrl}
                    alt={acc.name}
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-800"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{acc.name}</h4>
                    <p className="text-[10px] text-slate-400">{acc.institution}</p>
                    <span className="text-[10px] text-indigo-400 font-semibold">
                      Spesialisasi: {acc.defaultSubject} ({acc.defaultGrade})
                    </span>
                  </div>
                </div>

                {isCurrent && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
