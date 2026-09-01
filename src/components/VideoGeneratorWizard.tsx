import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  BookOpen, 
  Clock, 
  Palette, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Lightbulb, 
  Loader2,
  FileText,
  Check,
  RefreshCw,
  Zap,
  Edit3,
  ListOrdered
} from 'lucide-react';
import { SubjectCategory, GradeLevel, VisualStyle, GenerationRequest, VideoProject } from '../types.ts';

interface VideoGeneratorWizardProps {
  onCancel: () => void;
  onGenerationComplete: (project: VideoProject) => void;
  initialTemplate?: {
    title: string;
    subject: SubjectCategory;
    grade: GradeLevel;
    material: string;
    style: VisualStyle;
  } | null;
}

export const VideoGeneratorWizard: React.FC<VideoGeneratorWizardProps> = ({
  onCancel,
  onGenerationComplete,
  initialTemplate,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [generationLog, setGenerationLog] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>(initialTemplate?.title || '');
  const [subject, setSubject] = useState<SubjectCategory>(initialTemplate?.subject || 'Fikih');
  const [grade, setGrade] = useState<GradeLevel>(initialTemplate?.grade || 'MI');
  const [learningMaterial, setLearningMaterial] = useState<string>(initialTemplate?.material || '');
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(1);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(initialTemplate?.style || 'Kartun 2D');
  const [language, setLanguage] = useState<string>('Indonesia');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [includeQuiz, setIncludeQuiz] = useState<boolean>(true);

  // Step 2 AI Material Generation State
  const [materialMode, setMaterialMode] = useState<'ai' | 'manual'>('ai');
  const [aiMaterialTopic, setAiMaterialTopic] = useState<string>('');
  const [aiMaterialSubtopics, setAiMaterialSubtopics] = useState<string>('');
  const [aiMaterialTone, setAiMaterialTone] = useState<'ceria_ramah' | 'sistematis' | 'cerita' | 'poin_kunci'>('ceria_ramah');
  const [isGeneratingMaterial, setIsGeneratingMaterial] = useState<boolean>(false);
  const [generatedKeyPoints, setGeneratedKeyPoints] = useState<string[]>([]);
  const [materialGeneratedSuccess, setMaterialGeneratedSuccess] = useState<boolean>(false);

  const SUBJECT_GROUPS: { group: string; subjects: SubjectCategory[] }[] = [
    {
      group: 'Kemenag & Madrasah Ibtidaiyah (MI)',
      subjects: [
        'Fikih',
        'Akidah Akhlak',
        "Al-Qur'an Hadis",
        'SKI',
        'Bahasa Arab',
      ],
    },
    {
      group: 'Sains, Matematika & IPAS',
      subjects: [
        'IPAS',
        'IPA',
        'Matematika',
        'Fisika',
        'Biologi',
        'Kimia',
      ],
    },
    {
      group: 'Bahasa, Sosial & Teknologi',
      subjects: [
        'Bahasa Indonesia',
        'Bahasa Inggris',
        'Pancasila & PPKn',
        'Informatika',
        'Sejarah',
        'Geografi',
        'Ekonomi',
        'Seni & Budaya',
        'Lainnya',
      ],
    },
  ];

  const MI_CLASSES: { id: GradeLevel; phase: string; label: string; sublabel: string }[] = [
    { id: 'Kelas 1 MI', phase: 'Fase A', label: 'Kelas 1 MI', sublabel: 'Fase A (Tingkat Awal)' },
    { id: 'Kelas 2 MI', phase: 'Fase A', label: 'Kelas 2 MI', sublabel: 'Fase A (Tingkat Awal)' },
    { id: 'Kelas 3 MI', phase: 'Fase B', label: 'Kelas 3 MI', sublabel: 'Fase B (Tingkat Menengah)' },
    { id: 'Kelas 4 MI', phase: 'Fase B', label: 'Kelas 4 MI', sublabel: 'Fase B (Tingkat Menengah)' },
    { id: 'Kelas 5 MI', phase: 'Fase C', label: 'Kelas 5 MI', sublabel: 'Fase C (Tingkat Lanjutan)' },
    { id: 'Kelas 6 MI', phase: 'Fase C', label: 'Kelas 6 MI', sublabel: 'Fase C (Tingkat Lanjutan)' },
  ];

  const OTHER_GRADES: { id: GradeLevel; label: string; desc: string }[] = [
    { id: 'MI', label: 'MI (Semua Kelas)', desc: 'Kurikulum Kemenag MI umum, penguatan nilai Islam ramah anak' },
    { id: 'SD', label: 'SD (Sekolah Dasar)', desc: 'Kelas 1-6 SD umum • Bahasa sederhana & analogi konkret' },
    { id: 'SMP', label: 'SMP / MTs', desc: 'Kelas 7-9 • Penjelasan terstruktur & istilah sains' },
    { id: 'SMA', label: 'SMA / MA / SMK', desc: 'Kelas 10-12 • Konsep mendalam, analitis & kritis' },
    { id: 'Kuliah', label: 'Kuliah / Umum', desc: 'Akademis, komprehensif & materi profesional' },
  ];

  const VISUAL_STYLES: { id: VisualStyle; title: string; desc: string; icon: string; bg: string }[] = [
    {
      id: 'Kartun 2D',
      title: 'Kartun 2D Ramah Anak',
      desc: 'Karakter ceria, warna hangat, sangat ideal untuk jenjang MI & SD',
      icon: '🎨',
      bg: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    },
    {
      id: 'Animasi 3D',
      title: 'Animasi 3D Modern',
      desc: 'Visual realistis dan berdimensi tinggi untuk sains, fisika, & teknologi',
      icon: '🚀',
      bg: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
    },
    {
      id: 'Infografis',
      title: 'Infografis & Diagram',
      desc: 'Bagan data, urutan langkah tata cara, dan poin-poin struktural rapi',
      icon: '📊',
      bg: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    },
    {
      id: 'Presentasi',
      title: 'Slide Presentasi Edukatif',
      desc: 'Desain minimalis elegan, papan tulis bersih, fokus pada teks kunci',
      icon: '📋',
      bg: 'from-sky-500/20 to-cyan-500/20 border-sky-500/30',
    },
    {
      id: 'Cinematic',
      title: 'Cinematic Dokumenter',
      desc: 'Nuansa dokumenter sejarah & narasi bernilai moral mendalam',
      icon: '🎬',
      bg: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30',
    },
  ];

  const DURATION_OPTIONS紧 = [
    { minutes: 1, label: '1 Menit (Microlearning)', desc: 'Ideal untuk Reels/Shorts & apersepsi kilat (~7 scene)' },
    { minutes: 3, label: '3 Menit (Standar Video)', desc: 'Penjelasan lengkap materi pokok & 1 contoh studi kasus' },
    { minutes: 5, label: '5 Menit (Mendalam)', desc: 'Eksplorasi konsep menyeluruh dengan simulasi detail' },
    { minutes: 10, label: '10 Menit (Modul Lengkap)', desc: 'Bab pembelajaran utuh beserta evaluasi komprehensif' },
  ];

  // Quick Inspiration Helpers
  const fillSampleTopic = (sampleKey: 'khitan-mi-4' | 'wudhu-mi-1' | 'akidah-mi-2' | 'quran-mi-3' | 'shalat-mi-4' | 'asmaul-mi-5' | 'halal-mi-6' | 'tata-surya' | 'pecahan') => {
    if (sampleKey === 'khitan-mi-4') {
      setTitle('Ketentuan Khitan dalam Fikih Islam');
      setSubject('Fikih');
      setGrade('Kelas 4 MI');
      setAiMaterialTopic('Ketentuan Khitan dalam Syariat Islam');
      setAiMaterialSubtopics('Pengertian khitan, hukum wajib bagi laki-laki, usia pelaksanaan 7-10 tahun, manfaat thaharah & kesehatan');
      setLearningMaterial(
        'Khitan adalah syariat Islam fitrah yang telah dicontohkan sejak zaman Nabi Ibrahim AS. Secara syariat, khitan bagi laki-laki adalah memotong sebagian kulit kulup (qulfah) agar terbebas dari najis air kencing. Hukum khitan menurut mazhab Syafi\'i adalah wajib bagi laki-laki muslim. Waktu yang dianjurkan adalah usia 7 hingga 10 tahun (usia Kelas 4 MI) dan menjadi wajib saat baligh. Manfaat khitan adalah menyempurnakan kesucian thaharah shalat serta mencegah berbagai penyakit infeksi saluran kemih.'
      );
      setVisualStyle('Kartun 2D');
    } else if (sampleKey === 'wudhu-mi-1') {
      setTitle('Tata Cara Berwudhu yang Benar & Tertib');
      setSubject('Fikih');
      setGrade('Kelas 1 MI');
      setAiMaterialTopic('Tata Cara Berwudhu untuk Anak');
      setAiMaterialSubtopics('Arti bersuci, urutan membasuh muka, tangan, kepala, kaki, dan doa singkat');
      setLearningMaterial(
        'Halo adik-adik Kelas 1 MI! Sebelum kita shalat, kita harus berwudhu terlebih dahulu agar badan kita bersih dan suci. Rukun wudhu ada 6: niat, membasuh wajah yang ceria, membasuh kedua tangan sampai siku, mengusap sebagian kepala, membasuh kedua kaki sampai mata kaki, dan tertib secara berurutan. Dengan berwudhu yang tertib, shalat kita menjadi sah dan disayangi Allah SWT!'
      );
      setVisualStyle('Kartun 2D');
    } else if (sampleKey === 'akidah-mi-2') {
      setTitle('Adab Berbakti kepada Orang Tua dan Guru');
      setSubject('Akidah Akhlak');
      setGrade('Kelas 2 MI');
      setAiMaterialTopic('Adab Menghormati Orang Tua dan Guru');
      setAiMaterialSubtopics('Contoh sikap santun, mendengarkan nasihat, mendoakan orang tua, adab di kelas');
      setLearningMaterial(
        'Anak yang saleh dan salehah di Kelas 2 MI selalu menghormati orang tua dan bapak-ibu guru. Ayah dan ibu telah merawat kita dengan penuh kasih sayang, sedangkan guru mengajari kita ilmu yang bermanfaat. Kita harus selalu bertutur kata sopan, mengucapkan salam, mencium tangan, serta rajin mendoakan kebaikan bagi mereka.'
      );
      setVisualStyle('Kartun 2D');
    } else if (sampleKey === 'quran-mi-3') {
      setTitle('Memahami Kandungan Surat Al-Ikhlas');
      setSubject("Al-Qur'an Hadis");
      setGrade('Kelas 3 MI');
      setAiMaterialTopic('Kandungan dan Makna Surat Al-Ikhlas');
      setAiMaterialSubtopics('Arti keesaan Allah, As-Samad tempat bergantung, keutamaan membaca Al-Ikhlas');
      setLearningMaterial(
        'Surat Al-Ikhlas adalah surat ke-112 dalam Al-Qur\'an yang menegaskan tentang keesaan Allah SWT. Allah itu Ahad (Maha Esa) dan As-Samad (Maha Dibutuhkan oleh seluruh makhluk). Allah tidak beranak dan tidak pula diperanakkan, serta tidak ada sesuatu pun yang setara dengan-Nya. Membaca Surat Al-Ikhlas dengan ikhlas mendatangkan pahala sebanding sepertiga Al-Qur\'an.'
      );
      setVisualStyle('Kartun 2D');
    } else if (sampleKey === 'shalat-mi-4') {
      setTitle('Tata Cara & Rukun Shalat Fardhu 5 Waktu');
      setSubject('Fikih');
      setGrade('Kelas 4 MI');
      setAiMaterialTopic('Rukun dan Syarat Sah Shalat Fardhu');
      setAiMaterialSubtopics('13 Rukun shalat, syarat wajib, syarat sah, dan tuma\'ninah');
      setLearningMaterial(
        'Shalat fardhu adalah tiang agama dan kewajiban utama setiap muslim. Shalat memiliki 13 rukun yang wajib dikerjakan dengan tertib dan tuma\'ninah, mulai dari niat ikhlas, takbiratul ihram, membaca Surat Al-Fatihah, ruku\', i\'tidal, sujud, duduk di antara dua sujud, hingga salam. Shalat yang dikerjakan dengan khusyuk akan mencegah perbuatan keji dan munkar.'
      );
      setVisualStyle('Kartun 2D');
    } else if (sampleKey === 'asmaul-mi-5') {
      setTitle('Mengenal & Meneladani Asmaul Husna: Ar-Rahman & Ar-Rahim');
      setSubject('Akidah Akhlak');
      setGrade('Kelas 5 MI');
      setAiMaterialTopic('Mengenal dan Mengamalkan Asmaul Husna');
      setAiMaterialSubtopics('Arti Ar-Rahman dan Ar-Rahim, bukti kasih sayang Allah, meneladani sifat pengasih dalam pergaulan');
      setLearningMaterial(
        'Asmaul Husna adalah nama-nama Allah SWT yang maha indah dan agung. Ar-Rahman berarti Maha Pengasih kepada seluruh makhluk di alam semesta, sedangkan Ar-Rahim berarti Maha Penyayang kepada orang-orang beriman. Siswa Kelas 5 MI dapat meneladani Asmaul Husna dengan bersikap penyayang terhadap sesama, membantu teman yang kesulitan, dan menyayangi binatang serta tumbuhan.'
      );
      setVisualStyle('Kartun 2D');
    } else if (sampleKey === 'halal-mi-6') {
      setTitle('Ketentuan Makanan dan Minuman Halal & Haram');
      setSubject('Fikih');
      setGrade('Kelas 6 MI');
      setAiMaterialTopic('Makanan Halal dan Haram dalam Fikih');
      setAiMaterialSubtopics('Kriteria halal thayyib, jenis makanan haram, manfaat kesehatan & kesucian doa');
      setLearningMaterial(
        'Islam mewajibkan setiap muslim mengonsumsi makanan yang halal (diizinkan syariat) dan thayyib (baik, bergizi, dan higienis). Makanan halal menjaga kejernihan akal, kesehatan jasmani, serta diterimanya doa. Sebaliknya, makanan haram seperti bangkai, darah, daging babi, dan hasil curian dapat mendatangkan mudharat dan murka Allah SWT.'
      );
      setVisualStyle('Infografis');
    } else if (sampleKey === 'tata-surya') {
      setTitle('Sistem Tata Surya & Karakteristik 8 Planet');
      setSubject('IPAS');
      setGrade('Kelas 4 MI');
      setAiMaterialTopic('Sistem Tata Surya dan Planet');
      setAiMaterialSubtopics('Matahari sebagai bintang pusat, orbit planet, perbedaan planet dalam dan luar');
      setLearningMaterial(
        'Tata surya kita terdiri dari Matahari sebagai pusat gravitasi dan 8 planet yang mengitarinya: Merkurius, Venus, Bumi, Mars, Yupiter, Saturnus, Uranus, dan Neptunus. Bumi kita adalah satu-satunya planet yang diketahui memiliki kehidupan karena memiliki atmosfer pelindung dan air melimpah.'
      );
      setVisualStyle('Kartun 2D');
    } else if (sampleKey === 'pecahan') {
      setTitle('Mengenal Pecahan Biasa, Senilai & Campuran');
      setSubject('Matematika');
      setGrade('Kelas 3 MI');
      setAiMaterialTopic('Konsep Pecahan Matematika Ceria');
      setAiMaterialSubtopics('Pembilang dan penyebut, pecahan senilai, visual potongan kue');
      setLearningMaterial(
        'Pecahan adalah bilangan yang menyatakan bagian dari satu kesatuan utuh. Bilangan di atas disebut pembilang dan bilangan di bawah disebut penyebut. Misalnya, jika sebuah kue dipotong menjadi 4 bagian sama besar dan kita mengambil 1 potong, maka bagian tersebut bernilai 1/4.'
      );
      setVisualStyle('Infografis');
    }
  };

  // AI Learning Material Generator Handler
  const handleGenerateMaterial地下 = async (presetTopic?: string) => {
    const topicToUse = presetTopic || aiMaterialTopic || title;
    if (!topicToUse.trim()) {
      setErrorMessage('Masukkan topik materi yang ingin di-generate oleh AI terlebih dahulu.');
      return;
    }

    setIsGeneratingMaterial(true);
    setErrorMessage(null);
    setMaterialGeneratedSuccess(false);

    try {
      const res拼 = await fetch('/api/ai/generate-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          subject,
          grade,
          subtopics: aiMaterialSubtopics,
          tone: aiMaterialTone,
        }),
      });

      if (!res拼.ok) {
        throw new Error('Gagal menghasilkan teks materi.');
      }

      const data = await res拼.json();
      if (data.material) {
        setLearningMaterial(data.material);
        if (!title.trim() || title === 'Video Baru') {
          setTitle(data.title || topicToUse);
        }
        if (Array.isArray(data.keyPoints)) {
          setGeneratedKeyPoints(data.keyPoints);
        }
        setMaterialGeneratedSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membuat materi dengan AI.');
    } finally {
      setIsGeneratingMaterial(false);
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !learningMaterial.trim()) {
      setErrorMessage('Mohon isi Judul Video dan Materi Pembelajaran terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep(1);
    setGenerationLog('Menghubungkan ke Gemini 3.7 Flash Engine...');

    const payload: GenerationRequest = {
      title,
      subject,
      grade,
      learningMaterial,
      targetDurationMinutes,
      visualStyle,
      language,
      voiceGender,
      includeQuiz,
    };

    // Step progression timer simulation for pedagogical transparency
    const stepTimer1 = setTimeout(() => {
      setGenerationStep(2);
      setGenerationLog('Menyusun 7-Scene AI Storyboard (Intro, Konsep, Penjelasan, Contoh, Kesimpulan, Kuis, Outro)...');
    }, 900);

    const stepTimer2 = setTimeout(() => {
      setGenerationStep(3);
      setGenerationLog('Merumuskan naskah narasi suara Bahasa Indonesia & teks subtitle berirama...');
    }, 2200);

    const stepTimer3 = setTimeout(() => {
      setGenerationStep(4);
      setGenerationLog('Menyiapkan prompt visual grafis & komposisi animasi kamera...');
    }, 3600);

    try {
      const response = await fetch('/api/ai/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menghasilkan storyboard.');
      }

      const generatedProject: VideoProject = await response.json();
      setGenerationStep(5);
      setGenerationLog('Video pembelajaran berhasil dibuat! Membuka Timeline Studio...');

      setTimeout(() => {
        setIsGenerating(false);
        onGenerationComplete(generatedProject);
      }, 700);
    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses video.');
    }
  };

  if (isGenerating) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-indigo-500/30 bg-slate-950/90 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-md">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600/20 text-indigo-400 mb-6">
          <div className="absolute inset-0 rounded-3xl border border-indigo-500/40 animate-ping opacity-30" />
          <Wand2 className="h-10 w-10 animate-bounce text-indigo-300" />
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          AI Sedang Meracik Video Pembelajaran...
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          EduVideo AI sedang menganalisis materi "{title}" untuk jenjang {grade} ({subject}).
        </p>

        {/* Progress Stages */}
        <div className="mt-8 space-y-3 text-left">
          {[
            { step: 1, label: 'Menganalisis Materi & Menentukan Tujuan Pedagogis' },
            { step: 2, label: 'Menyusun 7 Scene Storyboard Lengkap' },
            { step: 3, label: 'Menulis Narasi Suara Pengajar & Subtitle Otomatis' },
            { step: 4, label: 'Menyiapkan Visual Animasi, Transisi & Musik Latar' },
            { step: 5, label: 'Membuat Soal Kuis Interaktif & Finalisasi Proyek' },
          ].map((item) => (
            <div
              key={item.step}
              className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${
                generationStep > item.step
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : generationStep === item.step
                  ? 'border-indigo-500/40 bg-indigo-950/30 text-indigo-200 ring-1 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}
            >
              {generationStep > item.step ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : generationStep === item.step ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400 shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-slate-700 text-[10px] flex items-center justify-center font-bold">
                  {item.step}
                </div>
              )}
              <span className="text-xs font-semibold">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-indigo-400">
          <Sparkles className="h-4 w-4" />
          <span>{generationLog}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Generator Video Pembelajaran AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Dukungan lengkap mata pelajaran MI & Sekolah Umum dengan generator naskah otomatis Gemini AI.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-slate-900 p-2 border border-slate-800">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setCurrentStep(s)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                currentStep === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : currentStep > s
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > s ? <Check className="h-4 w-4 stroke-[3]" /> : s}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">
            Tutup
          </button>
        </div>
      )}

      {/* STEP 1: Basic Information & Subject */}
      {currentStep === 1 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              Langkah 1: Informasi Dasar & Jenjang Kelas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih jenjang Madrasah Ibtidaiyah (MI) atau umum, mata pelajaran keagamaan / reguler, serta judul video.
            </p>
          </div>

          {/* Inspiration Quick Select */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Inspirasi Cepat Sesuai Kelas MI (Klik untuk Memuat):
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Kelas 1 - 6 MI Siap Pakai
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillSampleTopic('khitan-mi-4')}
                className="rounded-xl bg-emerald-950/70 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>🕌</span>
                <div className="truncate">
                  <span className="font-bold text-emerald-300">Kelas 4 MI:</span> Ketentuan Khitan
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('wudhu-mi-1')}
                className="rounded-xl bg-emerald-950/70 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>🕌</span>
                <div className="truncate">
                  <span className="font-bold text-emerald-300">Kelas 1 MI:</span> Wudhu Ceria
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('akidah-mi-2')}
                className="rounded-xl bg-emerald-950/70 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>🌟</span>
                <div className="truncate">
                  <span className="font-bold text-emerald-300">Kelas 2 MI:</span> Adab Orang Tua & Guru
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('quran-mi-3')}
                className="rounded-xl bg-emerald-950/70 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>📖</span>
                <div className="truncate">
                  <span className="font-bold text-emerald-300">Kelas 3 MI:</span> Surat Al-Ikhlas
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('shalat-mi-4')}
                className="rounded-xl bg-emerald-950/70 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>🕌</span>
                <div className="truncate">
                  <span className="font-bold text-emerald-300">Kelas 4 MI:</span> Rukun Shalat Fardhu
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('asmaul-mi-5')}
                className="rounded-xl bg-emerald-950/70 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>🌟</span>
                <div className="truncate">
                  <span className="font-bold text-emerald-300">Kelas 5 MI:</span> Asmaul Husna
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('halal-mi-6')}
                className="rounded-xl bg-emerald-950/70 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>⚖️</span>
                <div className="truncate">
                  <span className="font-bold text-emerald-300">Kelas 6 MI:</span> Makanan Halal & Haram
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('tata-surya')}
                className="rounded-xl bg-slate-900 hover:bg-indigo-600 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white border border-slate-800 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>🌍</span>
                <div className="truncate">
                  <span className="font-bold text-indigo-300">Kelas 4 MI:</span> IPAS Tata Surya
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillSampleTopic('pecahan')}
                className="rounded-xl bg-slate-900 hover:bg-indigo-600 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white border border-slate-800 transition-all flex items-center gap-2 text-left shadow-sm"
              >
                <span>➗</span>
                <div className="truncate">
                  <span className="font-bold text-indigo-300">Kelas 3 MI:</span> Matematika Pecahan
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200">
              Judul Video Pembelajaran <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Tata Cara Berwudhu yang Benar dan Tertib"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!aiMaterialTopic) setAiMaterialTopic(e.target.value);
              }}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Subject & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Mata Pelajaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectCategory)}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-xs text-slate-100 border border-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                {SUBJECT_GROUPS.map((grp) => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Bahasa Pengantar</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-xs text-slate-100 border border-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Indonesia">Bahasa Indonesia (Standar Guru & Santun)</option>
              </select>
            </div>

          </div>

          {/* Target Jenjang Siswa (MI Kelas 1-6 Spesifik + Jenjang Lainnya) */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <span>Pilihan Jenjang Madrasah Ibtidaiyah (Kelas 1 - 6 MI)</span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Kemenag & Kurikulum Merdeka
                  </span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Dipilih: <strong className="text-indigo-300 font-bold">{grade}</strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Pilih kelas spesifik agar AI dapat menyesuaikan tingkat kosakata, gaya bahasa, kedalaman materi, dan kuis secara otomatis.
              </p>

              {/* 6 Classes Grid for MI (2 Kolom Bersih) */}
              <div className="grid grid-cols-2 gap-3">
                {MI_CLASSES.map((c) => {
                  const isSelected = grade === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setGrade(c.id)}
                      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left relative group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/50 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/50'
                          : 'border-slate-800 bg-slate-950/80 hover:border-emerald-500/40 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              c.phase === 'Fase A'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : c.phase === 'Fase B'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {c.phase}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white">{c.label}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">{c.sublabel}</p>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                            <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-slate-700 group-hover:border-slate-500 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jenjang Lainnya (Dropdown / Alternatif) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5">
              <label className="text-[11px] font-semibold text-slate-400 mb-2 block">
                Atau pilih jenjang umum lainnya:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {OTHER_GRADES.map((og) => {
                  const isSelected = grade === og.id;
                  return (
                    <button
                      key={og.id}
                      type="button"
                      onClick={() => setGrade(og.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/40'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{og.label}</span>
                      {isSelected && <Check className="h-3 w-3 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Adaptation Summary Banner */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/60 p-4 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  Penyesuaian AI Otomatis untuk Jenjang <span className="text-amber-300">{grade}</span>:
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {grade === 'Kelas 1 MI' || grade === 'Kelas 2 MI'
                    ? 'AI menggunakan gaya bahasa sangat ramah & ceria (Fase A), kalimat pendek, analogi visual benda nyata, serta penanaman adab dasar Islam yang menyenangkan.'
                    : grade === 'Kelas 3 MI' || grade === 'Kelas 4 MI'
                    ? 'AI menyusun narasi komunikatif (Fase B), penjelasan rukun/syarat yang runtut dan terstruktur, kisah teladan nabi, serta kuis pilihan ganda terarah.'
                    : grade === 'Kelas 5 MI' || grade === 'Kelas 6 MI'
                    ? 'AI menyajikan konsep komprehensif (Fase C), menyertakan dalil ringkas & hikmah mendalam, serta evaluasi pemahaman penalaran yang matang.'
                    : `AI akan mengoptimalkan materi sesuai kurikulum dan target pembelajaran ${grade}.`}
                </p>
              </div>
            </div>

          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  setErrorMessage('Harap masukkan judul video terlebih dahulu.');
                  return;
                }
                setErrorMessage(null);
                if (!aiMaterialTopic) setAiMaterialTopic(title);
                setCurrentStep(2);
              }}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
            >
              Lanjut ke Materi & Teks
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: Learning Material Text (With AI Generation & Manual Options) */}
      {currentStep === 2 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="border-b border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  Langkah 2: Teks & Materi Pembelajaran
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan bantuan AI untuk menyusun naskah materi otomatis atau ketik / tempel secara manual.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMaterialMode('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    materialMode === 'ai'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Generate AI
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialMode('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    materialMode === 'manual'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Ketik Manual
                </button>
              </div>
            </div>
          </div>

          {/* AI GENERATOR TAB PANEL */}
          {materialMode === 'ai' && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  AI Kurikulum Materi Generator ({subject} • {grade})
                </div>
                <span className="text-[11px] text-indigo-300 font-medium">Powered by Gemini 3.7</span>
              </div>

              {/* Quick Topic Chips for the selected subject */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  Pilih Cepat Contoh Topik Kurikulum:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {subject === 'Fikih' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Tata Cara Shalat Fardhu');
                          setAiMaterialSubtopics('Rukun shalat, bacaan shalat, tuma\'ninah');
                          handleGenerateMaterial地下('Tata Cara Shalat Fardhu');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        🕌 Shalat Fardhu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Tata Cara Bersuci dari Hadats (Wudhu & Tayammum)');
                          setAiMaterialSubtopics('Syarat, rukun, sunnah, doa');
                          handleGenerateMaterial地下('Tata Cara Bersuci dari Hadats (Wudhu & Tayammum)');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        💧 Bersuci & Tayammum
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Adab dan Syarat Puasa Ramadhan');
                          setAiMaterialSubtopics('Niat puasa, hal membatalkan, hikmah puasa');
                          handleGenerateMaterial地下('Adab dan Syarat Puasa Ramadhan');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        🌙 Puasa Ramadhan
                      </button>
                    </>
                  )}

                  {subject === 'Akidah Akhlak' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Mengenal 10 Malaikat Allah dan Tugasnya');
                          setAiMaterialSubtopics('Nama malaikat, tugas mencatat amal, malaikat Jibril');
                          handleGenerateMaterial地下('Mengenal 10 Malaikat Allah dan Tugasnya');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        👼 10 Malaikat Allah
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Meneladani Sifat Jujur dan Amanah');
                          setAiMaterialSubtopics('Contoh kejujuran Rasulullah, amanah terhadap teman');
                          handleGenerateMaterial地下('Meneladani Sifat Jujur dan Amanah');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        🌟 Sifat Jujur & Amanah
                      </button>
                    </>
                  )}

                  {subject === "Al-Qur'an Hadis" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Memahami Kandungan Surat Al-Fatihah');
                          setAiMaterialSubtopics('Ummul Qur\'an, 7 ayat utama, doa petunjuk jalan lurus');
                          handleGenerateMaterial地下('Memahami Kandungan Surat Al-Fatihah');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        📖 Surat Al-Fatihah
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Hadis tentang Menuntut Ilmu dan Keutamaannya');
                          setAiMaterialSubtopics('Kewajiban menuntut ilmu bagi setiap muslim, adab belajar');
                          handleGenerateMaterial地下('Hadis tentang Menuntut Ilmu dan Keutamaannya');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        📚 Hadis Menuntut Ilmu
                      </button>
                    </>
                  )}

                  {subject === 'SKI' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Kisah Peristiwa Hijrah Nabi Muhammad SAW ke Madinah');
                          setAiMaterialSubtopics('Sebab hijrah, persaudaraan Muhajirin dan Anshar, Piagam Madinah');
                          handleGenerateMaterial地下('Kisah Peristiwa Hijrah Nabi Muhammad SAW ke Madinah');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        📜 Peristiwa Hijrah ke Madinah
                      </button>
                    </>
                  )}

                  {subject === 'Bahasa Arab' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Kosakata Peralatan Sekolah (Al-Adawatul Madrosiyyah)');
                          setAiMaterialSubtopics('Buku, pulpen, tas, papan tulis, hiwar tanya jawab');
                          handleGenerateMaterial地下('Kosakata Peralatan Sekolah (Al-Adawatul Madrosiyyah)');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        🎒 Alat Sekolah (Bahasa Arab)
                      </button>
                    </>
                  )}

                  {(subject === 'IPAS' || subject === 'IPA') && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Bagian Tubuh Tumbuhan dan Fungsinya');
                          setAiMaterialSubtopics('Akar, batang, daun, bunga, buah');
                          handleGenerateMaterial地下('Bagian Tubuh Tumbuhan dan Fungsinya');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        🌱 Bagian Tumbuhan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Siklus Air dan Terjadinya Hujan');
                          setAiMaterialSubtopics('Evaporasi, kondensasi, presipitasi');
                          handleGenerateMaterial地下('Siklus Air dan Terjadinya Hujan');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        🌧️ Siklus Air
                      </button>
                    </>
                  )}

                  {subject === 'Matematika' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Operasi Hitung Perkalian dan Pembagian');
                          setAiMaterialSubtopics('Trik perkalian mudah, pembagian bersusun, contoh soal');
                          handleGenerateMaterial地下('Operasi Hitung Perkalian dan Pembagian');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        ✖️ Perkalian & Pembagian
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiMaterialTopic('Mengenal Bangun Datar dan Sifat-sifatnya');
                          setAiMaterialSubtopics('Persegi, persegi panjang, segitiga, lingkaran');
                          handleGenerateMaterial地下('Mengenal Bangun Datar dan Sifat-sifatnya');
                        }}
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-slate-800"
                      >
                        📐 Bangun Datar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Input Topik & Subtopik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-200">
                    Topik / Konsep Pokok
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rukun dan Tata Cara Berwudhu"
                    value={aiMaterialTopic || title}
                    onChange={(e) => setAiMaterialTopic(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-200">
                    Subtopik / Fokus Materi (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rukun wudhu, doa setelah wudhu, hal pembatal"
                    value={aiMaterialSubtopics}
                    onChange={(e) => setAiMaterialSubtopics(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tone Selection & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-300 shrink-0">
                    Gaya Penyampaian:
                  </label>
                  <select
                    value={aiMaterialTone}
                    onChange={(e) => setAiMaterialTone(e.target.value as any)}
                    className="rounded-xl bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ceria_ramah">🌟 Ceria & Ramah Anak (MI / SD)</option>
                    <option value="sistematis">📐 Sistematis & Runtut</option>
                    <option value="cerita">📖 Cerita & Analogi Konkret</option>
                    <option value="poin_kunci">📌 Poin-Poin Konsep Inti</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingMaterial}
                  onClick={() => handleGenerateMaterial地下()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white hover:from-indigo-500 hover:to-emerald-500 shadow-md transition-all disabled:opacity-50"
                >
                  {isGeneratingMaterial ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Menyusun Materi AI...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                      <span>Buat Materi Otomatis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success Notification & Generated Keypoints */}
              {materialGeneratedSuccess && (
                <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Materi pembelajaran berhasil dibuat oleh AI!</span>
                      <p className="text-[11px] text-emerald-200/80 mt-0.5">
                        Teks di bawah siap digunakan dan dapat Anda edit atau kembangkan lebih lanjut.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateMaterial地下()}
                    className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Textarea for Learning Material (Editable for both AI & Manual) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <span>Naskah / Teks Materi Pembelajaran</span>
                <span className="text-rose-400">*</span>
                {materialMode === 'manual' && (
                  <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">
                    Mode Manual
                  </span>
                )}
              </label>
              <span className="text-[11px] text-slate-400">
                {learningMaterial.length} karakter (minimal 20 karakter)
              </span>
            </div>
            <textarea
              rows={7}
              placeholder="Tuliskan materi pembelajaran di sini, atau klik tombol 'Generate AI' di atas untuk dibuatkan naskah edukasi otomatis lengkap..."
              value={learningMaterial}
              onChange={(e) => setLearningMaterial(e.target.value)}
              className="w-full rounded-2xl bg-slate-950 p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors leading-relaxed"
            />
          </div>

          {/* Keypoints preview if available */}
          {generatedKeyPoints.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <ListOrdered className="h-4 w-4 text-indigo-400" />
                Poin Kunci yang Teridentifikasi:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {generatedKeyPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <span className="h-4 w-4 rounded-full bg-indigo-600/30 text-indigo-300 text-[9px] flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200">
              Target Durasi Video
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DURATION_OPTIONS紧.map((dur) => {
                const isSelected = targetDurationMinutes === dur.minutes;
                return (
                  <div
                    key={dur.minutes}
                    onClick={() => setTargetDurationMinutes(dur.minutes)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        {dur.label}
                      </span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{dur.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>

            <button
              type="button"
              onClick={() => {
                if (learningMaterial.trim().length < 20) {
                  setErrorMessage('Mohon masukkan atau generate materi pembelajaran minimal 20 karakter.');
                  return;
                }
                setErrorMessage(null);
                setCurrentStep(3);
              }}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30"
            >
              Lanjut ke Gaya & Audio
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: Visual Style, Voice & Generation CTA */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-400" />
              Langkah 3: Gaya Visual, Suara AI & Kuis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih karakter estetika visual dan pengisi suara AI untuk video pembelajaran Anda.
            </p>
          </div>

          {/* Visual Style Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200">
              Pilih Gaya Visual Video
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {VISUAL_STYLES.map((st) => {
                const isSelected = visualStyle === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setVisualStyle(st.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? `border-indigo-500 bg-gradient-to-br ${st.bg} ring-2 ring-indigo-500`
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-2xl mb-2">{st.icon}</div>
                      <h4 className="text-xs font-bold text-white">{st.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Terpilih
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Narration & Quiz Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Voice Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                Karakter Suara AI Narator
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceGender('female')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                    voiceGender === 'female'
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-lg">👩‍🏫</span>
                  <span className="text-xs font-bold">Ustadzah / Guru Wanita</span>
                  <span className="text-[10px] text-slate-400">Ramah & Artikulatif</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVoiceGender('male')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                    voiceGender === 'male'
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-lg">👨‍🏫</span>
                  <span className="text-xs font-bold">Ustadz / Guru Pria</span>
                  <span className="text-[10px] text-slate-400">Wibawa & Jelas</span>
                </button>
              </div>
            </div>

            {/* Interactive Quiz Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                Fitur Evaluasi Pembelajaran
              </label>
              <div
                onClick={() => setIncludeQuiz(!includeQuiz)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-center justify-between ${
                  includeQuiz
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>💡 Sertakan Kuis Interaktif</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    AI otomatis menyusun 1 soal pilihan ganda di Scene 6 beserta kunci & pembahasan.
                  </p>
                </div>
                <div
                  className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
                    includeQuiz ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      includeQuiz ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Final Summary Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Ringkasan Konfigurasi:</span>
              <div className="text-white font-bold mt-0.5">
                {title} • <span className="text-indigo-300">{subject}</span> • <span className="text-emerald-300">{grade}</span> • {targetDurationMinutes} Menit ({visualStyle})
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 font-semibold text-[11px]">
                7 Scene Otomatis
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 font-semibold text-[11px]">
                Full Audio & Subtitle
              </span>
            </div>
          </div>

          {/* Navigation & Final Generate CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/40 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Hasilkan Video Sekarang
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
