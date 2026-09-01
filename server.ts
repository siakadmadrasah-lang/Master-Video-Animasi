import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_SAMPLE_PROJECTS, SAMPLE_AUDIO_TRACKS } from './src/data/sampleProjects.ts';
import { VideoProject, Scene, GenerationRequest } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory project store initialized with high quality educational sample projects
let projectsDatabase: VideoProject[] = [...INITIAL_SAMPLE_PROJECTS];

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Robust JSON parser that strips markdown code fence wrappers
function extractJsonFromText(rawText: string): any {
  if (!rawText) return null;
  let text = rawText.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/i, '').replace(/```\s*$/, '');
  }
  try {
    return JSON.parse(text.trim());
  } catch (parseErr) {
    // If there is surrounding text, try regex extraction
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (_) {}
    }
    throw parseErr;
  }
}

// Resilient Gemini Generator with exponential backoff & multi-model fallback (handles 503 UNAVAILABLE / 429 RATE_LIMIT)
async function generateGeminiContentWithRetry(options: {
  contents: string | any[];
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  candidateModels?: string[];
  maxRetriesPerModel?: number;
}): Promise<any> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const client = getGeminiClient();
  // Modern valid Gemini models according to @google/genai guidelines:
  // gemini-3.7-flash (default text), gemini-3.1-flash-lite (fast/resilient), gemini-flash-latest, gemini-3.1-pro-preview
  const models = options.candidateModels && options.candidateModels.length > 0
    ? options.candidateModels
    : ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];

  const maxRetries = options.maxRetriesPerModel ?? 3;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const config: any = {};
        if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (typeof options.temperature === 'number') config.temperature = options.temperature;

        const response = await client.models.generateContent({
          model,
          contents: options.contents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        if (response && response.text) {
          if (options.responseMimeType === 'application/json') {
            return extractJsonFromText(response.text);
          }
          return response.text;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('fetch failed');

        if (isTransient && attempt < maxRetries) {
          const delayMs = attempt * 800 + Math.floor(Math.random() * 400);
          console.warn(`[Gemini API] ${model} transient busy (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        console.warn(`[Gemini API] ${model} unavailable (attempt ${attempt}):`, errMsg.slice(0, 150));
        // Break inner loop to try next candidate model
        break;
      }
    }
  }

  return null;
}

// Curated topic-specific educational imagery mapped to concepts
const TOPIC_SPECIFIC_VISUALS: { keywords: string[]; urls: string[] }[] = [
  {
    keywords: ['fotosintesis', 'klorofil', 'daun', 'tumbuhan hijau', 'matahari dan tumbuhan'],
    urls: [
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80', // Close up leaf veins with sunlight
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80', // Green vibrant leaf sunlight
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80', // Forest lush greenery
      'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80', // Plant growing in lab
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200&auto=format&fit=crop&q=80', // Biological leaf cell macro
    ],
  },
  {
    keywords: ['khitan', 'sirkumsisi', 'sunat', 'fikih khitan', 'thaharah'],
    urls: [
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&auto=format&fit=crop&q=80', // Islamic architecture dome & lights
      'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=1200&auto=format&fit=crop&q=80', // Quran with warm light
      'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80', // Mosque courtyard
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80', // Islamic calligraphy and book
      'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&auto=format&fit=crop&q=80', // Holy book and warm prayer lights
    ],
  },
  {
    keywords: ['wudhu', 'berwudhu', 'bersuci', 'thoharoh', 'air suci'],
    urls: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['shalat', 'sholat', 'ibadah', 'masjid', 'sujud'],
    urls: [
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['tata surya', 'planet', 'astronomi', 'angkasa', 'bintang', 'galaksi', 'bumi'],
    urls: [
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80', // Planets & deep space
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80', // Galaxy stars
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', // Earth from space
      'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1200&auto=format&fit=crop&q=80', // Night sky observatory
    ],
  },
  {
    keywords: ['gravitasi', 'newton', 'gaya', 'magnet', 'hukum fisika'],
    urls: [
      'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1200&auto=format&fit=crop&q=80', // Physics light spectrum
      'https://images.unsplash.com/photo-1517976487507-5b07432f93d6?w=1200&auto=format&fit=crop&q=80', // Physics pendulum motion
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['matematika', 'pecahan', 'aljabar', 'geometri', 'pythagoras', 'sudut', 'luas'],
    urls: [
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80', // Math formulas & geometric shapes
      'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80', // Math chalkboard
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1200&auto=format&fit=crop&q=80', // Geometry compass & ruler
    ],
  },
  {
    keywords: ['sel', 'dna', 'biologi', 'mikroskop', 'bakteri', 'virus', 'ekosistem', 'rantai makanan'],
    urls: [
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200&auto=format&fit=crop&q=80', // Microscopic cells
      'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&auto=format&fit=crop&q=80', // DNA molecular structure
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80', // Laboratory flasks
    ],
  },
  {
    keywords: ['kimia', 'molekul', 'reaksi kimia', 'larutan', 'asam basa', 'tabel periodik'],
    urls: [
      'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=1200&auto=format&fit=crop&q=80', // Colorful chemical reaction
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80', // Chemistry tubes
    ],
  },
  {
    keywords: ['komputer', 'coding', 'algoritma', 'ai', 'robotik', 'informatika', 'internet'],
    urls: [
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80', // AI visual matrix
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80', // Code matrix
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80', // Artificial intelligence neural
    ],
  },
  {
    keywords: ['sejarah', 'kemerdekaan', 'pahlawan', 'candi', 'kerajaan', 'proklamasi'],
    urls: [
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80', // Historic monument Borobudur
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80', // Antique manuscript & map
    ],
  },
];

// Fallback thematic Unsplash images for education topics & visual styles
const THEMATIC_VISUALS: Record<string, string[]> = {
  "Al-Qur'an Hadis": [
    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  ],
  "Akidah Akhlak": [
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
  ],
  Fikih: [
    'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  ],
  SKI: [
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80',
  ],
  "Bahasa Arab": [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80',
  ],
  IPAS: [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
  ],
  "Pancasila & PPKn": [
    'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
  ],
  IPA: [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
  ],
  Fisika: [
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517976487507-5b07432f93d6?w=1200&auto=format&fit=crop&q=80',
  ],
  Matematika: [
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1200&auto=format&fit=crop&q=80',
  ],
  Biologi: [
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
  ],
  Kimia: [
    'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
  ],
  Informatika: [
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
  ],
  Sejarah: [
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
  ],
  Default: [
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
  ],
};

function getThematicImage(topicOrSubject: string, index: number, specificTopic?: string): string {
  const combined = `${topicOrSubject} ${specificTopic || ''}`.toLowerCase();
  
  // 1. Search for specific topic keyword matches first
  for (const item of TOPIC_SPECIFIC_VISUALS) {
    if (item.keywords.some((kw) => combined.includes(kw))) {
      return item.urls[index % item.urls.length];
    }
  }

  // 2. Fallback to subject list
  const list = THEMATIC_VISUALS[topicOrSubject] || THEMATIC_VISUALS.Default;
  return list[index % list.length];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 10mb limit for base64 audio/images
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ==========================================
  // REST API ROUTES
  // ==========================================

  // Health check & AI Config status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      totalProjects: projectsDatabase.length,
      timestamp: new Date().toISOString(),
    });
  });

  // Projects CRUD
  app.get('/api/projects', (req: Request, res: Response) => {
    res.json(projectsDatabase);
  });

  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const project = projectsDatabase.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyek video tidak ditemukan.' });
    }
    res.json(project);
  });

  app.post('/api/projects', (req: Request, res: Response) => {
    const newProject: VideoProject = {
      ...req.body,
      id: req.body.id || `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: req.body.status || 'ready',
    };
    projectsDatabase.unshift(newProject);
    res.status(201).json(newProject);
  });

  app.put('/api/projects/:id', (req: Request, res: Response) => {
    const index = projectsDatabase.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Proyek video tidak ditemukan.' });
    }
    projectsDatabase[index] = {
      ...projectsDatabase[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    res.json(projectsDatabase[index]);
  });

  app.delete('/api/projects/:id', (req: Request, res: Response) => {
    const initialLen = projectsDatabase.length;
    projectsDatabase = projectsDatabase.filter((p) => p.id !== req.params.id);
    if (projectsDatabase.length === initialLen) {
      return res.status(404).json({ error: 'Proyek video tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Proyek video berhasil dihapus.' });
  });

  // Duplicate Project Endpoint
  app.post('/api/projects/:id/duplicate', (req: Request, res: Response) => {
    const original = projectsDatabase.find((p) => p.id === req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Proyek video asal tidak ditemukan.' });
    }
    const duplicated: VideoProject = {
      ...JSON.parse(JSON.stringify(original)),
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${original.title} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projectsDatabase.unshift(duplicated);
    res.status(201).json(duplicated);
  });

  // Project Render Endpoint
  app.post('/api/projects/:id/render', (req: Request, res: Response) => {
    const project = projectsDatabase.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyek video tidak ditemukan.' });
    }
    const { resolution = '1080p', fps = 30 } = req.body || {};
    project.status = 'ready';
    project.updatedAt = new Date().toISOString();
    res.json({
      success: true,
      jobId: `job-${Date.now()}`,
      status: 'ready',
      message: `Video "${project.title}" berhasil diperbarui status rendernya.`,
      project,
    });
  });

  // AI Learning Material Generator Endpoint (Otomatis Generate Materi Ajar)
  app.post('/api/ai/generate-material', async (req: Request, res: Response) => {
    try {
      const {
        topic,
        subject = 'IPA',
        grade = 'MI',
        subtopics = '',
        tone = 'ceria_ramah',
      } = req.body;

      if (!topic || topic.trim() === '') {
        return res.status(400).json({ error: 'Topik materi pembelajaran wajib diisi.' });
      }

      let generatedMaterial: any = null;

      if (process.env.GEMINI_API_KEY) {
        try {
          const prompt = `Anda adalah Pakar Pengembang Kurikulum dan Bahan Ajar Edukasi Interaktif di Indonesia (Kurikulum Merdeka Kemendikbudristek & Kurikulum Madrasah Kemenag RI untuk MI Kelas 1-6, SD, SMP, SMA).

TUGAS UTAMA: Susunlah materi pembelajaran yang kaya, akurat, terstruktur, mendidik, dan secara KHUSUS membahas topik: "${topic}" untuk mata pelajaran "${subject}" jenjang "${grade}".

ATURAN KETAT (ANTI-DRIFT):
1. Konten teks WAJIB 100% spesifik, akurat, dan mendalam membahas topik "${topic}".
2. DILARANG KERAS mengganti, mencampur, atau mengalihkan ke topik lain (contoh: jika topik adalah "Khitan / Sirkumsisi di Kelas 4 MI", materinya HARUS tentang pengertian khitan, hukum khitan dalam Islam bagi laki-laki/perempuan, usia pelaksanaan anak-anak, hikmah kesehatan & thaharah kesucian shalat; JANGAN PERNAH menjelaskan tentang rukun wudhu atau materi yang tidak diminta).
3. Jika topik adalah Fikih Khitan Kelas 4 MI: jelaskan bahwa khitan secara bahasa memotong, syariat memotong kulup (qulfah) penutup ujung kemaluan laki-laki, hukumnya wajib bagi laki-laki menurut mazhab Syafi'i dan sunnah fitrah para nabi sejak Nabi Ibrahim AS, dianjurkan saat usia anak-anak (7-10 tahun) sebelum baligh, manfaat menjaga kebersihan dari najis air kencing agar shalat sah, serta hikmah kesehatan medis.

Panduan Penyesuaian Jenjang & Kelas:
- Kelas 1 MI & Kelas 2 MI (Fase A): Gunakan kosakata sederhana, ceria, ramah anak, pengenalan konsep konkret, kalimat pendek.
- Kelas 3 MI & Kelas 4 MI (Fase B): Narasi komunikatif, mengenalkan urutan langkah, definisi jelas, dalil/keteladanan, contoh nyata di madrasah & keluarga.
- Kelas 5 MI & Kelas 6 MI (Fase C): Penjelasan komprehensif, mengaitkan dalil ringkas, hikmah spiritual mendalam, dan penalaran logis aplikatif.
- SD / SMP / SMA / Kuliah: Standar kurikulum nasional yang relevan.

Informasi Input:
- Topik / Materi Pokok: ${topic}
- Mata Pelajaran: ${subject}
- Target Jenjang / Kelas: ${grade}
- Fokus Pembahasan Tambahan: ${subtopics || `Konsep dasar dan definisi ${topic}, hukum syariat/aturan, tahapan pelaksanaan, manfaat nyata & hikmah, kesimpulan.`}
- Nada & Pendekatan: ${tone}

Format Output WAJIB berupa JSON Object valid:
{
  "title": "${topic}",
  "material": "Tuliskan narasi materi pembelajaran yang lengkap (sekitar 160 - 320 kata), disesuaikan dengan jenjang ${grade}, dan 100% fokus membahas ${topic}.",
  "keyPoints": [
    "Poin konsep penting 1 tentang ${topic}",
    "Poin konsep penting 2 tentang ${topic}",
    "Poin konsep penting 3 tentang ${topic}",
    "Poin konsep penting 4 tentang ${topic}"
  ],
  "suggestedDuration": 3
}`;

          generatedMaterial = await generateGeminiContentWithRetry({
            contents: prompt,
            responseMimeType: 'application/json',
            temperature: 0.7,
            candidateModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'],
          });
        } catch (aiErr) {
          console.warn('Gemini generate-material fallback activated:', aiErr);
        }
      }

      // Fallback generator if AI API key not present or temporary model unavailability
      if (!generatedMaterial || !generatedMaterial.material) {
        generatedMaterial = generateFallbackLearningMaterial({
          topic,
          subject,
          grade,
          subtopics,
        });
      }

      res.json(generatedMaterial);
    } catch (err: any) {
      console.error('Error in /api/ai/generate-material:', err);
      res.status(500).json({ error: 'Gagal membuat materi: ' + (err.message || 'Server error') });
    }
  });

  // AI Storyboard Generator Endpoint
  app.post('/api/ai/storyboard', async (req: Request, res: Response) => {
    try {
      const {
        title,
        subject,
        grade,
        learningMaterial,
        targetDurationMinutes = 1,
        visualStyle = 'Kartun 2D',
        language = 'Indonesia',
        voiceGender = 'female',
        includeQuiz = true,
      }: GenerationRequest = req.body;

      if (!title || !learningMaterial) {
        return res.status(400).json({ error: 'Judul dan Materi Pembelajaran wajib diisi.' });
      }

      const totalTargetSeconds = targetDurationMinutes * 60;
      const sceneCount = 7; // Exactly 7 structural scenes (Intro, Concept, Explanation, Example, Summary, Quiz, Outro)
      const avgDurationPerScene = Math.max(8, Math.round(totalTargetSeconds / sceneCount));

      // Build Gemini Prompt
      const systemInstruction = `Anda adalah Sutradara & Produser Video Edukasi AI Profesional terbaik di Indonesia ("EduVideo AI").
Tugas Anda adalah merancang Storyboard dan Script Video Pembelajaran yang SANGAT MENDALAM, TERSTRUKTUR, DAN MENJELASKAN MATERI PEMBELAJARAN SECARA UTUH untuk jenjang kelas: "${grade}".

⚠️ PERINGATAN PENTING & WAJIB:
- Di dalam video, siswa HARUS MENDENGARKAN DAN MELIHAT PENJELASAN MATERI SECARA JELAS DAN NYATA.
- DILARANG KERAS membuat narasi basa-basi/template umum kosong (seperti "Mari kita simak penjelasannya...").
- Narasi (narration) dan poin-poin layar (bulletPoints) pada Scene 2 (Konsep), Scene 3 (Penjelasan Mendalam), Scene 4 (Contoh), dan Scene 5 (Rangkuman) WAJIB MENJELASKAN SECARA RINCI isi materi pembelajaran: definisi, rukun/unsur, langkah-langkah, fungsi, dalil/aturan, dan contoh nyata dari teks yang diberikan.

Pedoman Penyesuaian Pedagogis Berdasarkan Jenjang / Kelas:
- Kelas 1 MI & Kelas 2 MI (Fase A): Kalimat pendek, ceria, hangat, sapaan akrab "Adik-adik pintar". Penjelasan materi konkret dan sederhana.
- Kelas 3 MI & Kelas 4 MI (Fase B): Narasi komunikatif, mengenalkan urutan langkah, rukun, tata cara, dan contoh di lingkungan madrasah.
- Kelas 5 MI & Kelas 6 MI (Fase C): Penjelasan runtut dan berbobot, memasukkan hikmah mendalam, dalil/fakta ilmiah, dan penalaran logis.
- SD / SMP / SMA: Sesuaikan kosa kata dan penalaran ilmiah dengan kurikulum masing-masing.

Format Output WAJIB berupa JSON Object murni dengan skema:
{
  "title": string,
  "topic": string,
  "scenes": [
    {
      "order": 1,
      "sceneType": "intro" | "learning_concept" | "explanation" | "example" | "summary" | "quiz" | "outro",
      "title": string, // Judul scene e.g. "1. Pengenalan & Apersepsi"
      "overlayTitle": string, // Judul besar di layar video (3-6 kata)
      "overlaySubtitle": string, // Subtitle/keterangan visual di layar
      "narration": string, // Narasi suara pengajar yang MENJELASKAN MATERI SECARA GAMBLANG dalam Bahasa Indonesia yang alami, ramah, artikulatif, dan sesuai durasi (sekitar ${avgDurationPerScene} detik)
      "duration": number, // Durasi detik (antara 8 sampai 25 detik)
      "visualPrompt": string, // Deskripsi detail visual/animasi untuk gaya "${visualStyle}"
      "visualType": "image" | "gradient" | "diagram" | "code" | "quiz_card",
      "animationType": "zoom-in" | "pan-left" | "pan-right" | "float",
      "transitionType": "fade" | "slide-left" | "zoom" | "dissolve",
      "keywords": [string], // 2-4 kata kunci penting dari materi
      "bulletPoints": [string], // 2-4 poin konkret materi yang ditampilkan di layar video (BUKAN kalimat kosong, tapi fakta materi!)
      "quizQuestion": { // WAJIB ADA jika sceneType === "quiz"
        "question": string,
        "options": [string, string, string, string],
        "correctIndex": number (0-3),
        "explanation": string
      }
    }
  ]
}

Ketentuan 7 Scene Wajib:
1. "intro": Pengenalan menarik, apersepsi membangkitkan rasa ingin tahu siswa jenjang ${grade} terhadap topik materi.
2. "learning_concept": Definisi & konsep dasar yang menjelaskan apa itu materi ini dan mengapa penting dipelajari.
3. "explanation": Penjelasan inti materi secara mendalam, runtut, rinci (rukun/langkah/proses/unsur materi) sesuai teks materi pembelajaran.
4. "example": Contoh kasus nyata, praktik penerapan, atau analogi dalam kehidupan sehari-hari siswa.
5. "summary": Rangkuman / kesimpulan poin-poin terpenting materi pembelajaran.
6. "quiz": 1 Soal kuis pilihan ganda interaktif yang menguji pemahaman materi yang baru saja dijelaskan, beserta 4 pilihan (A, B, C, D), kunci jawaban benar (0-3), dan pembahasan guru.
7. "outro": Penutup apresiatif, pesan motivasi belajar, dan ajakan mengamalkan ilmu.`;

      const userPrompt = `Buatkan storyboard video pembelajaran LENGKAP DENGAN PENJELASAN MATERI MENDALAM:
Judul: ${title}
Mata Pelajaran: ${subject}
Jenjang Kelas: ${grade}
Gaya Visual: ${visualStyle}
Target Durasi: ${targetDurationMinutes} Menit (Total ~${totalTargetSeconds} detik)
Bahasa: ${language}

Teks Materi Pembelajaran yang HARUS DIJELASKAN SECARA GAMBLANG dalam narasi dan poin layar:
"""
${learningMaterial}
"""`;

      let generatedData: any = null;

      if (process.env.GEMINI_API_KEY) {
        try {
          generatedData = await generateGeminiContentWithRetry({
            contents: userPrompt,
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.7,
            candidateModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'],
          });
        } catch (aiError) {
          console.warn('Gemini API call fallback to smart educational template engine:', aiError);
        }
      }

      // Fallback smart generator if API key missing or parse failed
      if (!generatedData || !Array.isArray(generatedData.scenes) || generatedData.scenes.length === 0) {
        generatedData = generateFallbackStoryboard({
          title,
          subject,
          grade,
          learningMaterial,
          targetDurationMinutes,
          visualStyle,
        });
      }

      // Enhance scenes with reliable thematic imagery and sound setup
      const scenes: Scene[] = generatedData.scenes.map((s: any, idx: number) => {
        const sceneType = s.sceneType || (idx === 0 ? 'intro' : idx === 6 ? 'outro' : idx === 5 ? 'quiz' : 'explanation');
        return {
          id: `sc-${Date.now()}-${idx + 1}`,
          order: idx + 1,
          sceneType: sceneType,
          title: s.title || `Scene ${idx + 1}`,
          overlayTitle: s.overlayTitle || title,
          overlaySubtitle: s.overlaySubtitle || (s.keywords ? s.keywords.join(' • ') : subject),
          narration: s.narration || `${s.overlayTitle}. ${s.overlaySubtitle}.`,
          duration: s.duration || avgDurationPerScene,
          visualPrompt: s.visualPrompt || `Ilustrasi ${visualStyle} untuk topik ${title}`,
          visualUrl: s.visualUrl || getThematicImage(subject, idx, `${title} ${learningMaterial}`),
          visualType: sceneType === 'quiz' ? 'quiz_card' : (s.visualType || 'image'),
          animationType: s.animationType || (idx % 2 === 0 ? 'zoom-in' : 'pan-right'),
          transitionType: s.transitionType || 'fade',
          keywords: Array.isArray(s.keywords) ? s.keywords : [subject, grade],
          bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : [`Konsep penting ${idx + 1}`],
          quizQuestion: s.quizQuestion || (sceneType === 'quiz' ? {
            question: `Manakah kesimpulan yang paling tepat mengenai ${title}?`,
            options: [
              `A. Pembelajaran tentang ${subject} sangat aplikatif`,
              'B. Konsep ini hanya berlaku di laboratorium',
              'C. Tidak berhubungan dengan kehidupan sehari-hari',
              'D. Tidak membutuhkan pemahaman dasar'
            ],
            correctIndex: 0,
            explanation: `Benar! ${title} memberikan manfaat penting dalam pemahaman sains dan kehidupan sehari-hari.`
          } : undefined),
        };
      });

      const totalDuration = scenes.reduce((acc, sc) => acc + sc.duration, 0);

      const newProject: VideoProject = {
        id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: generatedData.title || title,
        subject: subject || 'IPA',
        grade: grade || 'SMP',
        topic: generatedData.topic || title,
        learningMaterial,
        targetDurationMinutes,
        visualStyle,
        language,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnailUrl: scenes[0]?.visualUrl || getThematicImage(subject, 0, title),
        totalDurationSeconds: totalDuration,
        scenes,
        voiceConfig: {
          provider: 'gemini',
          voiceName: voiceGender === 'female' ? 'Siti (Ramah & Edukatif)' : 'Dimas (Jelas & Wibawa)',
          gender: voiceGender,
          speed: 1.0,
          pitch: voiceGender === 'male' ? 0.74 : 1.12,
          volume: 100,
        },
        audioTrack: SAMPLE_AUDIO_TRACKS[0],
        subtitleConfig: {
          enabled: true,
          fontSize: 'md',
          position: 'bottom',
          highlightCurrentWord: true,
          textColor: '#FFFFFF',
          bgColor: 'rgba(0, 0, 0, 0.75)',
          fontStyle: 'modern',
        },
        footerIdentity: {
          enabled: true,
          logoUrl: '/assets/logo-badge.jpg',
          badgeTitle: 'VIDEO ANIMASI PEMBELAJARAN',
          creatorName: 'DEV JAENAL MASKUN',
          position: 'bottom-right',
          showBadgeIcon: true,
        },
        introOutroConfig: {
          interactiveIntro: true,
          interactiveOutro: true,
          introBadgeAnimation: 'spin-pop',
          outroCelebration: 'confetti',
          showCertificatePrompt: true,
        },
        exportSettings: {
          resolution: '1080p',
          fps: 30,
          format: 'mp4',
          watermark: true,
          watermarkText: `${subject} • ${grade}`,
        },
      };

      // Save to store
      projectsDatabase.unshift(newProject);

      res.json(newProject);
    } catch (err: any) {
      console.error('Error generating storyboard:', err);
      res.status(500).json({ error: 'Gagal membuat storyboard video: ' + (err?.message || 'Server error') });
    }
  });

  // AI Generate Scene Image Endpoint
  app.post('/api/ai/generate-scene-image', async (req: Request, res: Response) => {
    try {
      const { topic, sceneTitle, visualPrompt, visualStyle = 'Kartun 2D', subject = 'IPA' } = req.body;
      if (!topic && !visualPrompt) {
        return res.status(400).json({ error: 'Topik atau prompt visual diperlukan.' });
      }

      // 1. Check if we have exact curated matches
      const matchedUrl = getThematicImage(subject, Math.floor(Math.random() * 5), `${topic} ${visualPrompt || ''}`);
      
      // If Gemini API is configured, create an intelligent educational visual SVG data-URI or refined visual url
      if (process.env.GEMINI_API_KEY) {
        try {
          const svgPrompt = `Buatkan SVG ilustrasi edukatif modern, bersih, warna cerah 16:9 viewBox="0 0 1280 720" untuk topik "${topic}", judul scene "${sceneTitle}", gaya "${visualStyle}". 
Format output WAJIB HANYA kode XML SVG murni tanpa markdown pembungkus: <svg ...>...</svg>`;
          
          const svgText: string | null = await generateGeminiContentWithRetry({
            contents: svgPrompt,
            candidateModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'],
          });

          if (svgText && svgText.includes('<svg')) {
            const startIdx = svgText.indexOf('<svg');
            const endIdx = svgText.lastIndexOf('</svg>') + 6;
            const cleanSvg = svgText.substring(startIdx, endIdx);
            const base64Svg = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
            return res.json({
              imageUrl: base64Svg,
              prompt: visualPrompt,
              isAiGenerated: true,
            });
          }
        } catch (genErr) {
          console.warn('Gemini SVG generation fallback to matched imagery:', genErr);
        }
      }

      return res.json({
        imageUrl: matchedUrl,
        prompt: visualPrompt,
        isAiGenerated: false,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal generate gambar visual: ' + err.message });
    }
  });

  // AI TTS Generation Endpoint
  app.post('/api/ai/tts', async (req: Request, res: Response) => {
    try {
      const { text, voiceName = 'Kore', gender = 'female', speed = 1.0 } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Teks narasi wajib diisi.' });
      }

      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = getGeminiClient();
          const mappedVoice = gender === 'male' ? 'Fenrir' : 'Kore';
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-tts-preview',
            contents: [{ parts: [{ text: `Bacakan narasi pembelajaran Bahasa Indonesia berikut dengan intonasi ramah, santun, dan jelas: "${text}"` }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: mappedVoice },
                },
              },
            },
          });

          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            return res.json({
              audioBase64: base64Audio,
              mimeType: 'audio/pcm;rate=24000',
              provider: 'gemini',
              sampleRate: 24000,
            });
          }
        } catch (ttsErr) {
          console.warn('Gemini TTS preview fallback to browser speech:', ttsErr);
        }
      }

      // Fallback acknowledgement to let frontend speech synthesis play seamlessly
      res.json({
        fallback: true,
        text,
        speed,
        gender,
        provider: 'browser-speech',
        message: 'Menggunakan Web Speech Synthesizer Bahasa Indonesia yang terintegrasi di browser.',
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal menghasilkan suara narasi: ' + error.message });
    }
  });

  // AI Refine / Enhance Narration Endpoint
  const handleNarrationRefinement = async (req: Request, res: Response) => {
    try {
      const { narration, tone = 'ramah', grade = 'SMP', title = '', subject = '' } = req.body;
      if (!narration) {
        return res.status(400).json({ error: 'Teks narasi diperlukan.' });
      }

      let refinedText: string | null = null;
      if (process.env.GEMINI_API_KEY) {
        try {
          refinedText = await generateGeminiContentWithRetry({
            contents: `Kamu adalah asisten naskah guru ${subject}. Sempurnakan teks narasi video pembelajaran berikut untuk jenjang ${grade}, topik "${title}", dengan nada "${tone}" agar lebih memikat, ringkas, dan mudah dipahami dalam Bahasa Indonesia:
"${narration}"

Berikan HANYA teks narasi hasil perbaikan tanpa tanda kutip atau penjelasan tambahan.`,
            candidateModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'],
          });
        } catch (aiErr) {
          console.warn('Gemini refine narration fallback:', aiErr);
        }
      }

      const finalText = refinedText?.trim() || narration;
      res.json({
        refinedNarration: finalText,
        enhancedNarration: finalText,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memperbarui narasi: ' + err.message });
    }
  };

  app.post('/api/ai/refine-narration', handleNarrationRefinement);
  app.post('/api/ai/enhance-narration', handleNarrationRefinement);

  // AI Generate Quiz Questions
  app.post('/api/ai/generate-quiz', async (req: Request, res: Response) => {
    try {
      const { topic, material, count = 3 } = req.body;
      let questions: any = null;

      if (process.env.GEMINI_API_KEY) {
        try {
          questions = await generateGeminiContentWithRetry({
            contents: `Buatkan ${count} soal kuis evaluasi interaktif pilihan ganda Bahasa Indonesia berdasarkan topik "${topic}" dan materi "${material}".
Format output JSON:
[
  {
    "question": string,
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": number (0-3),
    "explanation": string
  }
]`,
            responseMimeType: 'application/json',
            candidateModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'],
          });
        } catch (aiErr) {
          console.warn('Gemini quiz generator fallback:', aiErr);
        }
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        questions = [
          {
            question: `Apa manfaat utama mempelajari ${topic || 'materi ini'}?`,
            options: ['A. Memahami konsep penting & penerapannya secara nyata', 'B. Hanya untuk menghafal tanpa dipahami', 'C. Tidak memiliki relevansi dengan kehidupan', 'D. Sekadar mengisi waktu belajar'],
            correctIndex: 0,
            explanation: `Mempelajari ${topic || 'materi ini'} secara tertib dan sungguh-sungguh memberikan wawasan berharga serta kemudahan dalam mengamalkannya.`,
          },
        ];
      }

      res.json({ questions });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal membuat kuis: ' + err.message });
    }
  });

  // Video Rendering Job Simulation
  app.post('/api/render-video', (req: Request, res: Response) => {
    const { projectId, resolution = '1080p', fps = 30 } = req.body;
    const project = projectsDatabase.find((p) => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyek video tidak ditemukan.' });
    }

    project.status = 'ready';
    project.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      jobId: `job-${Date.now()}`,
      status: 'ready',
      message: `Video "${project.title}" siap di-render pada resolusi ${resolution} ${fps} FPS.`,
      project,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduVideo AI Server running on http://localhost:${PORT}`);
  });
}

// Fallback smart heuristic storyboard builder
function generateFallbackStoryboard(params: {
  title: string;
  subject: string;
  grade: string;
  learningMaterial: string;
  targetDurationMinutes: number;
  visualStyle: string;
}): any {
  const isKhitan =
    params.title.toLowerCase().includes('khitan') ||
    params.learningMaterial.toLowerCase().includes('khitan') ||
    params.title.toLowerCase().includes('sirkumsisi') ||
    params.title.toLowerCase().includes('sunat');

  const isLowerMI = params.grade === 'Kelas 1 MI' || params.grade === 'Kelas 2 MI';
  const isMidMI = params.grade === 'Kelas 3 MI' || params.grade === 'Kelas 4 MI';

  if (isKhitan) {
    return {
      title: params.title || 'Ketentuan Khitan dalam Fikih Islam',
      topic: 'Khitan (Sirkumsisi) dalam Fikih',
      scenes: [
        {
          order: 1,
          sceneType: 'intro',
          title: '1. Pengenalan Khitan dalam Syariat Islam',
          overlayTitle: 'Ketentuan Khitan dalam Fikih Islam',
          overlaySubtitle: `Mata Pelajaran: Fikih • Jenjang ${params.grade}`,
          narration: `Assalamu'alaikum sahabat cerdas ${params.grade}! Selamat datang di pembelajaran Fikih. Hari ini kita akan mempelajari materi penting tentang Khitan, sebuah syariat fitrah yang penuh berkah dan manfaat bagi kesucian ibadah kita.`,
          duration: 9,
          visualPrompt: `Ilustrasi kartun edukatif anak laki-laki muslim ceria dengan pakaian santun kopiah putih berlatar madrasah dengan gaya ${params.visualStyle}`,
          visualType: 'image',
          animationType: 'zoom-in',
          transitionType: 'fade',
          keywords: ['Khitan', 'Fikih Kelas 4', 'Syariat Islam'],
          bulletPoints: ['Pengenalan syariat khitan', 'Tradisi suci para nabi dan rasul'],
        },
        {
          order: 2,
          sceneType: 'learning_concept',
          title: '2. Pengertian & Hukum Khitan',
          overlayTitle: 'Pengertian & Hukum Khitan',
          overlaySubtitle: 'Wajib bagi Laki-Laki & Sunnah Fitrah',
          narration: `Secara bahasa, khitan artinya memotong. Sedangkan menurut syariat Islam, khitan bagi laki-laki adalah memotong kulit penutup ujung kemaluan (qulfah) agar terbebas dari najis air kencing. Hukum khitan menurut mazhab Syafi'i adalah wajib bagi laki-laki muslim.`,
          duration: 12,
          visualPrompt: `Diagram infografis syariat Islam menjelaskan definisi khitan dan hukum wajib menurut mazhab Syafi'i dengan gaya ${params.visualStyle}`,
          visualType: 'diagram',
          animationType: 'pan-right',
          transitionType: 'slide-left',
          keywords: ['Pengertian Khitan', 'Hukum Wajib', 'Mazhab Syafi\'i'],
          bulletPoints: ['Bahasa: memotong sebagian kulit (qulfah)', 'Hukum: Wajib bagi laki-laki muslim'],
        },
        {
          order: 3,
          sceneType: 'explanation',
          title: '3. Usia Pelaksanaan & Dalil Sunnah',
          overlayTitle: 'Usia Pelaksanaan & Dalil Khitan',
          overlaySubtitle: 'Ajaran Fitrah Nabi Ibrahim AS',
          narration: `Khitan merupakan ajaran fitrah yang telah disyariatkan sejak zaman Nabi Ibrahim 'alaihissalam. Waktu pelaksanaan yang dianjurkan (mustahab) adalah saat usia anak-anak antara 7 hingga 10 tahun (usia kelas 4 MI), dan menjadi wajib ketika anak telah mencapai usia baligh.`,
          duration: 13,
          visualPrompt: `Ilustrasi sejarah teladan Nabi Ibrahim AS dan timeline usia pelaksanaan khitan anak madrasah dengan gaya ${params.visualStyle}`,
          visualType: 'image',
          animationType: 'zoom-in',
          transitionType: 'fade',
          keywords: ['Nabi Ibrahim AS', 'Usia Anak-Anak', 'Baligh'],
          bulletPoints: ['Waktu dianjurkan: usia 7-10 tahun', 'Waktu wajib: saat menginjak usia baligh'],
        },
        {
          order: 4,
          sceneType: 'example',
          title: '4. Manfaat Medis & Kesucian Thaharah',
          overlayTitle: 'Manfaat Kesehatan & Kesucian Shalat',
          overlaySubtitle: 'Mencegah Najis & Menjaga Kebersihan',
          narration: `Tahukah kalian? Berkhitan memiliki manfaat medis yang sangat besar. Dengan berkhitan, sisa air kencing tidak akan mengendap di kulit qulfah, sehingga thaharah kita sempurna dan shalat fardhu kita menjadi sah. Secara medis, khitan juga mencegah berbagai infeksi dan penyakit saluran kemih.`,
          duration: 12,
          visualPrompt: `Grafik medis ramah anak tentang kebersihan diri, thaharah, dan pencegahan kotoran najis dengan gaya ${params.visualStyle}`,
          visualType: 'diagram',
          animationType: 'pan-left',
          transitionType: 'dissolve',
          keywords: ['Thaharah', 'Sah Shalat', 'Kesehatan Medis'],
          bulletPoints: ['Menyempurnakan kebersihan thaharah', 'Mencegah penyakit infeksi saluran kemih'],
        },
        {
          order: 5,
          sceneType: 'summary',
          title: '5. Rangkuman & Adab Walimatul Khitan',
          overlayTitle: 'Rangkuman Materi Khitan',
          overlaySubtitle: 'Kesimpulan Penting Pembelajaran Fikih',
          narration: `Mari kita ingat 3 poin penting: Pertama, khitan hukumnya wajib bagi laki-laki. Kedua, dianjurkan dilaksanakan sebelum baligh. Ketiga, keluarga muslim disunnahkan mengadakan walimatul khitan sebagai bentuk rasa syukur dan mendoakan kebaikan anak yang berkhitan.`,
          duration: 10,
          visualPrompt: `Papan rangkuman kesimpulan khitan dan suasana syukuran walimatul khitan bernuansa Islami dengan gaya ${params.visualStyle}`,
          visualType: 'gradient',
          animationType: 'zoom-in',
          transitionType: 'slide-left',
          keywords: ['Rangkuman', 'Walimatul Khitan', 'Syukur'],
          bulletPoints: ['Wajib bagi laki-laki muslim', 'Dilaksanakan sebelum baligh', 'Walimah bentuk syukur & doa'],
        },
        {
          order: 6,
          sceneType: 'quiz',
          title: '6. Kuis Pemahaman Khitan Kelas 4 MI',
          overlayTitle: 'Kuis Evaluasi Fikih Khitan',
          overlaySubtitle: 'Uji Pemahaman Siswa Kelas 4 MI',
          narration: `Saatnya kuis interaktif! Menurut syariat Islam dalam Fikih Kelas 4 MI, apa hukum berkhitan bagi anak laki-laki muslim menurut Mazhab Syafi'i?`,
          duration: 11,
          visualPrompt: `Kartu kuis interaktif pilihan ganda tentang hukum khitan dalam Islam dengan pilihan A, B, C, D bercahaya`,
          visualType: 'quiz_card',
          animationType: 'zoom-in',
          transitionType: 'fade',
          keywords: ['Kuis Khitan', 'Fikih Kelas 4'],
          bulletPoints: ['Pilih jawaban yang paling tepat!'],
          quizQuestion: {
            question: 'Menurut Mazhab Syafi\'i, apa hukum berkhitan bagi laki-laki muslim?',
            options: [
              'A. Wajib hukumnya',
              'B. Makruh dikerjakan',
              'C. Haram dilaksanakan',
              'D. Boleh ditinggalkan begitu saja'
            ],
            correctIndex: 0,
            explanation: 'Tepat sekali! Menurut mazhab Syafi\'i, khitan hukumnya wajib bagi laki-laki muslim untuk menyempurnakan thaharah dan kesucian shalat.'
          }
        },
        {
          order: 7,
          sceneType: 'outro',
          title: '7. Penutup & Motivasi Belajar',
          overlayTitle: 'Jadilah Generasi Suci & Beriman!',
          overlaySubtitle: 'Materi Fikih Madrasah Ibtidaiyah',
          narration: `Alhamdulillah! Kalian telah memahami ketentuan khitan dengan sangat baik. Jadilah anak saleh yang senantiasa menjaga kesucian lahir dan batin. Sampai jumpa di video pembelajaran Fikih selanjutnya!`,
          duration: 8,
          visualPrompt: `Kartun penutup anak-anak madrasah ceria tersenyum membawa buku fikih dengan gaya ${params.visualStyle}`,
          visualType: 'image',
          animationType: 'zoom-in',
          transitionType: 'fade',
          keywords: ['Alhamdulillah', 'Anak Saleh', 'Sukses'],
          bulletPoints: ['Jaga kebersihan lahir batin', 'Semangat mengamalkan syariat!'],
        },
      ],
    };
  }

  // Intelligent multi-strategy fallback generator extracting substantive content from learningMaterial
  const cleanMaterial = params.learningMaterial.trim();
  const rawSentences = cleanMaterial
    .replace(/\r\n/g, '\n')
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[0-9\-\*\•\.\s]+/, '').trim())
    .filter((s) => s.length > 8);

  // Extract explicit bullet items if user provided numbers, bullets, or dashes
  const rawBullets = cleanMaterial
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[0-9]+[\.\)]|^\-|^•|^\*/.test(line))
    .map((line) => line.replace(/^[0-9]+[\.\)\-•\*\s]+/, '').trim())
    .filter((b) => b.length > 5);

  const introGreeting = isLowerMI
    ? `Halo adik-adik ${params.grade} yang ceria dan pintar! Hari ini kita belajar materi ${params.subject} yang sangat istimewa, yaitu "${params.title}". Simak baik-baik penjelasannya ya!`
    : isMidMI
    ? `Assalamu'alaikum sahabat cerdas ${params.grade}! Selamat datang di pembelajaran ${params.subject}. Hari ini kita akan mengkaji materi penting tentang "${params.title}". Mari kita pelajari bersama-sama!`
    : `Halo rekan-rekan pembelajar ${params.grade}! Selamat datang di media video pembelajaran ${params.subject}. Pada topik kali ini, kita mendalami bahasan "${params.title}".`;

  // Scene 2 Concept & Definition
  const sConcept = rawSentences[0] || `${params.title} merupakan konsep fundamental dalam ${params.subject}.`;
  const sConcept2 = rawSentences[1] || `Memahami materi ini membantu kita menguasai kompetensi dasar secara mendalam.`;

  // Scene 3 In-Depth Explanation
  const sExpl1 = rawSentences[2] || rawSentences[0] || `Perhatikan setiap tahapan dan rukun dalam materi ${params.title}.`;
  const sExpl2 = rawSentences[3] || rawSentences[1] || `Seluruh unsur tersebut saling berkaitan membentuk pemahaman yang utuh.`;
  const sExpl3 = rawSentences[4] || '';

  // Scene 4 Example & Application
  const sExample = rawSentences[5] || rawSentences[2] || `Dalam kehidupan sehari-hari, konsep ${params.title} dapat kita jumpai dan terapkan secara langsung.`;
  const sExample2 = rawSentences[6] || `Penerapan yang konsisten membawa manfaat besar bagi diri dan lingkungan kita.`;

  // Scene 5 Summary
  const sSummary = rawSentences[rawSentences.length - 1] || `Sebagai kesimpulan, ingatlah selalu konsep utama dan kaidah dari ${params.title}.`;

  // Extract key terms for keywords
  const extractedKeywords = Array.from(new Set(
    cleanMaterial
      .replace(/[^\w\s\u00C0-\u024F]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4 && !['adalah', 'dengan', 'secara', 'karena', 'seperti', 'dalam', 'untuk', 'kepada', 'tersebut', 'bahwa', 'sangat', 'setiap', 'antara'].includes(w.toLowerCase()))
  )).slice(0, 4);

  const finalKeywords = extractedKeywords.length >= 2 ? extractedKeywords : [params.subject, params.title.split(' ')[0], params.grade];

  // Concrete bullet points for Scene 2 (Concept)
  const scene2Bullets = rawBullets.length >= 2
    ? rawBullets.slice(0, 2)
    : [
        sConcept.length > 70 ? sConcept.slice(0, 67) + '...' : sConcept,
        sConcept2.length > 70 ? sConcept2.slice(0, 67) + '...' : sConcept2,
      ];

  // Concrete bullet points for Scene 3 (Explanation)
  const scene3Bullets = rawBullets.length >= 4
    ? rawBullets.slice(2, 4)
    : rawBullets.length >= 2
    ? rawBullets.slice(0, 2)
    : [
        sExpl1.length > 70 ? sExpl1.slice(0, 67) + '...' : sExpl1,
        sExpl2.length > 70 ? sExpl2.slice(0, 67) + '...' : sExpl2,
      ];

  // Concrete bullet points for Scene 4 (Example)
  const scene4Bullets = [
    `Penerapan konsep ${params.title} secara tepat`,
    sExample.length > 65 ? sExample.slice(0, 62) + '...' : sExample,
  ];

  // Concrete bullet points for Scene 5 (Summary)
  const scene5Bullets = [
    `Intisari pokok materi: ${params.title}`,
    sSummary.length > 65 ? sSummary.slice(0, 62) + '...' : sSummary,
  ];

  return {
    title: params.title,
    topic: params.title,
    scenes: [
      {
        order: 1,
        sceneType: 'intro',
        title: '1. Pengenalan & Apersepsi',
        overlayTitle: params.title,
        overlaySubtitle: `Mata Pelajaran: ${params.subject} • Jenjang ${params.grade}`,
        narration: introGreeting,
        duration: 9,
        visualPrompt: `Visual pembuka menarik bertema ${params.subject} topik ${params.title} untuk ${params.grade} dengan gaya ${params.visualStyle}`,
        visualType: 'image',
        animationType: 'zoom-in',
        transitionType: 'fade',
        keywords: finalKeywords,
        bulletPoints: [`Pengenalan topik ${params.title}`, `Materi pokok ${params.subject} (${params.grade})`],
      },
      {
        order: 2,
        sceneType: 'learning_concept',
        title: '2. Pengertian & Konsep Dasar',
        overlayTitle: 'Pengertian & Konsep Dasar',
        overlaySubtitle: `Definisi Materi ${params.title}`,
        narration: `${sConcept} ${sConcept2}`,
        duration: 12,
        visualPrompt: `Diagram visual konsep pembelajaran ${params.title} ramah siswa ${params.grade} dengan gaya ${params.visualStyle}`,
        visualType: 'diagram',
        animationType: 'pan-right',
        transitionType: 'slide-left',
        keywords: finalKeywords.slice(0, 3),
        bulletPoints: scene2Bullets,
      },
      {
        order: 3,
        sceneType: 'explanation',
        title: '3. Penjelasan Rinci & Tata Cara',
        overlayTitle: 'Penjelasan Rinci Materi',
        overlaySubtitle: `Rukun, Langkah & Unsur Penting`,
        narration: `${sExpl1} ${sExpl2} ${sExpl3}`.trim(),
        duration: 14,
        visualPrompt: `Infografis penjelasan rinci dan bagan terstruktur materi ${params.title} dengan gaya ${params.visualStyle}`,
        visualType: 'diagram',
        animationType: 'pan-left',
        transitionType: 'fade',
        keywords: finalKeywords,
        bulletPoints: scene3Bullets,
      },
      {
        order: 4,
        sceneType: 'example',
        title: '4. Contoh & Aplikasi Nyata',
        overlayTitle: 'Contoh & Aplikasi Nyata',
        overlaySubtitle: 'Penerapan Praktis Sehari-hari',
        narration: `${sExample} ${sExample2}`,
        duration: 11,
        visualPrompt: `Ilustrasi aplikasi dunia nyata topik ${params.title} dengan gaya ${params.visualStyle}`,
        visualType: 'image',
        animationType: 'zoom-in',
        transitionType: 'slide-left',
        keywords: ['Penerapan', 'Contoh Kasus', params.subject],
        bulletPoints: scene4Bullets,
      },
      {
        order: 5,
        sceneType: 'summary',
        title: '5. Rangkuman Poin Penting',
        overlayTitle: 'Rangkuman Poin Penting',
        overlaySubtitle: `Kesimpulan Materi ${params.title}`,
        narration: `Mari kita ingat kesimpulannya: ${sSummary} Pahami selalu poin-poin penting pada rangkuman ini ya!`,
        duration: 11,
        visualPrompt: `Papan rangkuman poin penting topik ${params.title} dengan gaya ${params.visualStyle}`,
        visualType: 'gradient',
        animationType: 'zoom-in',
        transitionType: 'fade',
        keywords: ['Rangkuman', 'Kesimpulan', params.subject],
        bulletPoints: scene5Bullets,
      },
      {
        order: 6,
        sceneType: 'quiz',
        title: '6. Kuis Evaluasi Pemahaman',
        overlayTitle: 'Kuis Evaluasi Pemahaman',
        overlaySubtitle: `Uji Pemahaman Siswa ${params.grade}`,
        narration: isLowerMI
          ? `Saatnya kuis ceria! Menurut adik-adik, manakah hal yang paling benar tentang ${params.title}?`
          : `Saatnya kuis interaktif! Berdasarkan penjelasan materi tadi, manakah pernyataan yang paling tepat mengenai ${params.title}?`,
        duration: 12,
        visualPrompt: `Panel kuis interaktif ramah anak dengan opsi pilihan ganda bercahaya`,
        visualType: 'quiz_card',
        animationType: 'zoom-in',
        transitionType: 'fade',
        keywords: ['Kuis Evaluasi', params.subject, 'Pemahaman'],
        bulletPoints: ['Pilih jawaban yang paling tepat!'],
        quizQuestion: {
          question: `Berdasarkan pembelajaran, manakah hal yang paling tepat mengenai ${params.title}?`,
          options: [
            `A. ${sConcept.length > 50 ? sConcept.slice(0, 48) + '...' : sConcept}`,
            'B. Materi ini tidak memiliki fungsi dalam kehidupan sehari-hari',
            'C. Dilakukan secara sembarangan tanpa aturan yang benar',
            'D. Mengabaikan rukun dan tata cara yang berlaku'
          ],
          correctIndex: 0,
          explanation: `Benar sekali! ${sConcept}`
        }
      },
      {
        order: 7,
        sceneType: 'outro',
        title: '7. Penutup & Motivasi Belajar',
        overlayTitle: 'Terus Semangat Belajar!',
        overlaySubtitle: 'Amalkan Ilmu Kebaikan dalam Keseharian',
        narration: isLowerMI
          ? `Alhamdulillah, luar biasa! Kalian telah menyelesaikan pembelajaran "${params.title}". Teruslah menjadi anak cerdas dan rajin belajar ya. Sampai jumpa!`
          : `Alhamdulillah! Anda telah menuntaskan video pembelajaran "${params.title}". Amalkan ilmu ini dan teruslah berprestasi. Sampai jumpa di video pembelajaran berikutnya!`,
        duration: 9,
        visualPrompt: `Ilustrasi penutup inspiratif siswa madrasah ceria bersemangat dengan gaya ${params.visualStyle}`,
        visualType: 'image',
        animationType: 'zoom-in',
        transitionType: 'fade',
        keywords: ['Alhamdulillah', 'Motivasi', 'Prestasi'],
        bulletPoints: ['Amalkan ilmu dalam kehidupan', 'Salam sukses belajar!'],
      },
    ],
  };
}

// Fallback smart learning material generator with precise multi-topic dispatching
function generateFallbackLearningMaterial(params: {
  topic: string;
  subject: string;
  grade: string;
  subtopics?: string;
}): {
  title: string;
  material: string;
  keyPoints: string[];
  suggestedDuration: number;
} {
  const { topic, subject, grade, subtopics } = params;
  const tLower = topic.toLowerCase();

  // Grade level phase detection
  const isLowerMI = grade === 'Kelas 1 MI' || grade === 'Kelas 2 MI';
  const isMidMI = grade === 'Kelas 3 MI' || grade === 'Kelas 4 MI';
  const isUpperMI = grade === 'Kelas 5 MI' || grade === 'Kelas 6 MI';

  let materialText = '';
  let points: string[] = [];

  // 1. SPECIFIC FIKIH TOPICS
  if (tLower.includes('khitan') || tLower.includes('sirkumsisi') || tLower.includes('sunat')) {
    materialText = `Pembelajaran Fikih ${grade} mengenai "Ketentuan Khitan dalam Syariat Islam". ` +
      `Secara bahasa, khitan berarti memotong. Menurut istilah syariat, khitan bagi laki-laki adalah memotong sebagian kulit kulup (qulfah) yang menutupi ujung kemaluan agar terbebas dari najis air kencing dan kotoran. ` +
      `Hukum khitan menurut mazhab Syafi'i adalah wajib bagi laki-laki muslim dan merupakan sunnah fitrah para nabi sejak Nabi Ibrahim 'alaihissalam. ` +
      `Waktu yang dianjurkan (mustahab) adalah saat usia anak-anak antara 7 hingga 10 tahun (usia Kelas 4 MI), dan menjadi wajib saat menginjak usia baligh. ` +
      `Khitan memiliki hikmah besar: menyempurnakan kesucian thaharah agar shalat sah, menjaga kesehatan alat reproduksi dari infeksi, serta menjadi tanda pengenal seorang muslim yang taat.`;
    points = [
      'Pengertian Khitan secara bahasa & istilah syariat',
      'Hukum khitan wajib bagi laki-laki menurut Mazhab Syafi\'i',
      'Waktu pelaksanaan: dianjurkan usia 7-10 tahun, wajib saat baligh',
      'Hikmah khitan: kesucian thaharah shalat & kesehatan medis'
    ];
  } else if (tLower.includes('wudhu') || tLower.includes('berwudhu')) {
    if (isLowerMI) {
      materialText = `Halo adik-adik ${grade}! Hari ini kita belajar ${subject} tentang "${topic}". ` +
        `Sebelum kita shalat atau memegang Al-Qur'an, kita harus bersuci terlebih dahulu dengan berwudhu. ` +
        `Rukun wudhu ada 6: niat, membasuh muka, membasuh kedua tangan sampai siku, mengusap sebagian kepala, membasuh kedua kaki sampai mata kaki, dan tertib. ` +
        `Dengan berwudhu, tubuh kita bersih, hati kita tenang, dan disayangi oleh Allah SWT!`;
      points = [
        'Mengenal arti bersuci dan wudhu',
        '6 Rukun wudhu yang wajib dikerjakan',
        'Urutan membasuh anggota tubuh secara tertib',
        'Membiasakan hidup bersih dan cinta shalat'
      ];
    } else {
      materialText = `Pembelajaran ${subject} untuk ${grade} mengenai "${topic}". ` +
        `Wudhu adalah syarat sah utama dalam ibadah shalat. Terdapat 6 rukun wudhu yang wajib dipenuhi: niat di dalam hati bersamaan membasuh muka, membasuh kedua tangan hingga siku, mengusap sebagian kepala, membasuh kedua kaki hingga mata kaki, serta tertib berurutan. ` +
        `Disunnahkan membaca bismillah, berkumur, istinsyaq (membersihkan hidung), membasuh telinga, dan membaca doa setelah wudhu. ` +
        `Wudhu yang tertib dan tuma'ninah menjaga kesucian lahir batin seorang muslim.`;
      points = [
        '6 Rukun wajib wudhu & syarat sahnya',
        'Sunnah-sunnah dan adab berwudhu',
        'Hal-hal yang membatalkan wudhu',
        'Hikmah thaharah bagi kesehatan dan keimanan'
      ];
    }
  } else if (tLower.includes('shalat') || tLower.includes('sholat')) {
    materialText = `Pembelajaran ${subject} untuk ${grade} mengenai "${topic}". ` +
      `Shalat adalah tiang agama dan rukun Islam kedua yang wajib didirikan oleh setiap muslim. ` +
      `Shalat fardhu 5 waktu terdiri atas 13 rukun yang harus dikerjakan dengan tertib dan tuma'ninah, mulai dari niat ikhlas, takbiratul ihram, membaca Al-Fatihah, ruku', i'tidal, sujud, duduk di antara dua sujud, tahiyyat akhir, hingga salam. ` +
      `Mendirikan shalat secara khusyuk dan tepat waktu mendatangkan kedamaian jiwa serta mencegah perbuatan keji dan munkar.`;
    points = [
      'Kedudukan shalat sebagai tiang agama',
      'Syarat wajib & syarat sah shalat',
      '13 Rukun shalat dan pentingnya tuma\'ninah',
      'Hikmah shalat mencegah perbuatan keji dan munkar'
    ];
  } else if (tLower.includes('tayamum') || tLower.includes('tayammum')) {
    materialText = `Pembelajaran ${subject} ${grade} mengenai "Tata Cara Tayamum". ` +
      `Tayamum adalah rukhsah (keringanan) bersuci menggunakan debu suci sebagai pengganti wudhu atau mandi wajib ketika tidak ada air atau ada uzur sakit. ` +
      `Rukun tayamum terdiri dari niat, mengusap wajah dengan debu suci, dan mengusap kedua tangan sampai siku, lalu tertib. ` +
      `Tayamum menunjukkan kemudahan syariat Islam agar umat Islam tidak meninggalkan shalat dalam kondisi apapun.`;
    points = [
      'Pengertian tayamum sebagai rukhsah bersuci',
      'Sebab-sebab diperbolehkannya tayamum',
      'Rukun dan tata cara tayamum dengan debu suci',
      'Hal-hal yang membatalkan tayamum'
    ];
  } else if (tLower.includes('zakat') || tLower.includes('infaq') || tLower.includes('sedekah')) {
    materialText = `Pembelajaran ${subject} ${grade} mengenai "${topic}". ` +
      `Zakat adalah rukun Islam yang mengajarkan kepedulian sosial dan membersihkan harta. ` +
      `Zakat terbagi menjadi Zakat Fitrah yang wajib dikeluarkan pada bulan Ramadhan untuk mensucikan diri, dan Zakat Mal (harta) yang dikeluarkan saat telah mencapai nisab dan haul. ` +
      `Zakat disalurkan kepada 8 golongan yang berhak menerimanya (asnaf) seperti fakir, miskin, amil, dan fi sabilillah.`;
    points = [
      'Pengertian Zakat Fitrah dan Zakat Mal',
      'Syarat wajib, nisab, dan waktu pembayaran',
      '8 Golongan mustahik penerima zakat',
      'Hikmah zakat mempererat ukhuwah dan menolong sesama'
    ];
  } else if (tLower.includes('puasa') || tLower.includes('ramadhan')) {
    materialText = `Pembelajaran ${subject} ${grade} mengenai "${topic}". ` +
      `Puasa adalah menahan diri dari makan, minum, dan segala hal yang membatalkan puasa mulai dari terbit fajar shadiq hingga terbenam matahari dengan niat ikhlas karena Allah SWT. ` +
      `Puasa di bulan Ramadhan hukumnya fardhu 'ain bagi muslim yang baligh, berakal, dan mampu. ` +
      `Puasa melatih kejujuran, kesabaran, empati kepada kaum dhuafa, dan meningkatkan derajat ketaqwaan kita.`;
    points = [
      'Syarat wajib dan rukun puasa',
      'Hal-hal yang membatalkan puasa',
      'Amalan sunnah di bulan Ramadhan',
      'Hikmah puasa meraih derajat taqwa'
    ];
  } else if (tLower.includes('haji') || tLower.includes('umrah')) {
    materialText = `Pembelajaran ${subject} ${grade} mengenai "Ketentuan Ibadah Haji dan Umrah". ` +
      `Haji adalah rukun Islam kelima yang wajib dikerjakan sekali seumur hidup bagi muslim yang mampu (istitha'ah). ` +
      `Rukun haji meliputi ihram dari miqat, wukuf di Padang Arafah, tawaf ifadhah mengelilingi Ka'bah, sa'i antara bukit Shafa dan Marwah, tahallul mencukur rambut, serta tertib. ` +
      `Haji mabrur tidak ada balasan baginya kecuali surga.`;
    points = [
      'Syarat istitha\'ah dalam ibadah haji',
      '6 Rukun haji dan perbedaannya dengan umrah',
      'Wajib haji dan larangan ihram',
      'Hikmah persatuan umat Islam sedunia di Tanah Suci'
    ];
  } else if (tLower.includes('makanan') || tLower.includes('halal') || tLower.includes('haram')) {
    materialText = `Pembelajaran ${subject} ${grade} mengenai "Ketentuan Makanan dan Minuman Halal & Haram". ` +
      `Islam memerintahkan umatnya untuk mengonsumsi makanan yang halal dan thayyib (baik, bergizi, dan higienis). ` +
      `Makanan halal adalah makanan yang diizinkan syariat baik dari segi zatnya maupun cara memperolehnya. ` +
      `Sebaliknya, makanan haram seperti bangkai, darah yang mengalir, daging babi, dan sembelihan tanpa menyebut nama Allah harus dijauhi karena merusak jasmani dan rohani.`;
    points = [
      'Kriteria makanan halal dan thayyib',
      'Jenis makanan dan binatang yang diharamkan',
      'Manfaat mengonsumsi makanan halal bagi kesehatan & doa',
      'Bahaya makanan haram dalam syariat'
    ];
  }
  // 2. AKIDAH AKHLAK
  else if (subject === 'Akidah Akhlak') {
    if (isLowerMI) {
      materialText = `Halo sahabat kecil ${grade}! Dalam ${subject} kali ini, kita belajar "${topic}". ` +
        `Anak yang saleh dan salehah selalu bersikap ramah, suka tersenyum, menyayangi teman, serta hormat dan patuh kepada ayah, ibu, dan bapak-ibu guru. ` +
        `Ketika berbuat salah, kita segera meminta maaf dan rajin mengucapkan kalimat thayyibah. ` +
        `Dengan memiliki akhlak yang baik, kita akan dicintai Allah SWT dan disukai oleh semua orang di sekitar kita!`;
      points = [
        `Mengenal nilai-nilai mulia dalam ${topic}`,
        'Menyayangi teman dan menghormati orang tua/guru',
        'Mengucapkan kata-kata santun (tolong, maaf, terima kasih)',
        'Membiasakan kalimat thayyibah setiap hari'
      ];
    } else {
      materialText = `Pembelajaran ${subject} jenjang ${grade} dengan topik "${topic}". ` +
        `Akidah adalah pondasi keimanan yang kokoh di dalam hati, sedangkan akhlak adalah cerminan budi pekerti mulia dalam bersikap kepada sesama. ` +
        `Melalui materi "${topic}", siswa diajak untuk meneladani sifat terpuji, menghormati orang tua dan guru, menyayangi teman, serta menjauhi perilaku tercela. ` +
        `Akhlak mulia menjadikan diri kita disayangi Allah SWT dan disenangi oleh lingkungan sekitar.`;
      points = [
        `Mengenal nilai-nilai terpuji dalam ${topic}`,
        'Contoh sikap santun, jujur, dan berbakti',
        'Cara membentengi diri dari perilaku kurang baik',
        'Hikmah memiliki akhlakul karimah dalam pergaulan'
      ];
    }
  }
  // 3. AL-QUR'AN HADIS
  else if (subject === 'Al-Qur\'an Hadis') {
    if (isLowerMI) {
      materialText = `Selamat belajar Al-Qur'an Hadis untuk ${grade}! Hari ini kita belajar "${topic}". ` +
        `Al-Qur'an adalah kitab suci kita yang indah. Kita belajar melafalkan huruf hijaiyah dan surat-surat pendek dengan suara yang merdu dan jelas. ` +
        `Setiap satu huruf Al-Qur'an yang kita baca mendatangkan sepuluh kebaikan dari Allah SWT. ` +
        `Mari kita rajin mengaji dan menghafal surat pendek dengan gembira!`;
      points = [
        `Mengenal bunyi dan lafal ${topic}`,
        'Membaca ayat pendek dengan tartil dan lancar',
        'Mengetahui pesan kasih sayang dalam surat',
        'Semangat mengaji setiap hari di rumah dan madrasah'
      ];
    } else {
      materialText = `Pembelajaran ${subject} jenjang ${grade} tentang "${topic}". ` +
        `Al-Qur'an dan Hadis adalah pedoman hidup utama bagi setiap muslim. ` +
        `Dalam materi ini, kita belajar membaca ayat dan hadis dengan makharijul huruf serta tajwid yang benar, memahami terjemahan dan kandungan maknanya, serta mengamalkan pesan mulianya. ` +
        `Mencintai Al-Qur'an dan Hadis akan mendatangkan ketenangan hati dan petunjuk kebaikan dunia dan akhirat.`;
      points = [
        'Membaca lafal ayat dan hadis dengan tartil & kaidah tajwid',
        'Memahami arti kosakata (mufradat) dan terjemahan pokok',
        'Menghayati kandungan hikmah yang tersirat',
        'Mengamalkan tuntunan Al-Qur\'an dan Hadis dalam keseharian'
      ];
    }
  }
  // 4. SKI
  else if (subject === 'SKI') {
    materialText = `Pembelajaran Sejarah Kebudayaan Islam (SKI) jenjang ${grade} topik "${topic}". ` +
      `Mempelajari sejarah Islam membawa kita menelusuri perjuangan Nabi Muhammad SAW, para sahabat, dan para ulama dalam menyebarkan risalah Islam yang penuh kedamaian dan rahmatan lil 'alamin. ` +
      `Melalui peristiwa ${topic}, kita dapat memetik keteladanan tentang kesabaran, kegigihan, kejujuran, dan persaudaraan yang kokoh. ` +
      `Sejarah bukan hanya cerita masa lalu, melainkan pelajaran berharga untuk masa depan kita.`;
    points = [
      `Latar belakang dan alur peristiwa sejarah ${topic}`,
      'Tokoh-tokoh teladan dan peran pentingnya',
      'Nilai perjuangan, kesabaran, dan persaudaraan',
      'Pelajaran moral (ibrah) untuk generasi masa kini'
    ];
  }
  // 5. BAHASA ARAB
  else if (subject === 'Bahasa Arab') {
    if (isLowerMI) {
      materialText = `Hayya nata'allam al-Lughah al-'Arabiyyah! Belajar Bahasa Arab menyenangkan untuk ${grade} topik "${topic}". ` +
        `Kita akan mengenal kosakata baru (mufradat) dengan gambar-gambar menarik dan nyanyian ceria. ` +
        `Kita bisa menyapa teman, menyebut nama benda di kelas, anggota keluarga, dan warna dalam Bahasa Arab. ` +
        `Ayo ulangi bersama-sama dengan suara lantang dan penuh semangat!`;
      points = [
        `Mengenal mufradat (kosakata bergambar) ${topic}`,
        'Melafalkan kata dengan intonasi yang tepat',
        'Menyapa dan bercakap singkat bersama teman',
        'Latihan mengingat kosakata lewat lagu & permainan kata'
      ];
    } else {
      materialText = `Pembelajaran Bahasa Arab jenjang ${grade} dengan topik "${topic}". ` +
        `Bahasa Arab adalah bahasa Al-Qur'an dan bahasa ilmu pengetahuan Islam. ` +
        `Dalam bab "${topic}", kita mempelajari mufradat (kosakata baru), pola kalimat sederhana (tarkib), percakapan sehari-hari (hiwar), serta latihan melafalkannya dengan fasih. ` +
        `Belajar Bahasa Arab terasa menyenangkan jika dipraktikkan bersama teman dengan penuh semangat dan rasa percaya diri.`;
      points = [
        `Pengenalan mufradat (kosakata) tema ${topic}`,
        'Struktur pola kalimat (tarkib)',
        'Praktik percakapan interaktif (hiwar)',
        'Latihan mendengarkan dan melafalkan secara fasih'
      ];
    }
  }
  // 6. IPAS / IPA
  else if (subject === 'IPAS' || subject === 'IPA') {
    if (isLowerMI) {
      materialText = `Hai peneliti cilik ${grade}! Yuk kita cari tahu tentang "${topic}" dalam pelajaran ${subject}. ` +
        `Di sekitar kita ada banyak ciptaan Allah yang luar biasa: hewan, tumbuhan, udara, dan air. ` +
        `Kita akan mengamati bagaimana tumbuhan tumbuh, hewan bergerak, dan bagaimana kita merawat lingkungan sekitar. ` +
        `Sains itu seru dan membuat kita semakin bersyukur atas indahnya bumi kita!`;
      points = [
        `Mengamati benda dan makhluk hidup di sekitar (${topic})`,
        'Mengenal bagian tubuh dan fungsi utamanya',
        'Cara merawat tanaman dan hewan peliharaan',
        'Menjaga kebersihan lingkungan sekolah dan rumah'
      ];
    } else {
      materialText = `Materi pembelajaran ${subject} untuk jenjang ${grade} bertema "${topic}". ` +
        `Alam semesta menyimpan banyak keteraturan dan keajaiban sains yang menarik untuk diteliti. ` +
        `Melalui materi "${topic}", kita mempelajari bagaimana fenomena alam berlangsung, interaksi antar komponen penyusunnya, serta proses sebab-akibat yang terjadi secara berkesinambungan. ` +
        `Dengan memahami sains dan fenomena lingkungan sekitar, kita dapat menjaga kelestarian bumi dan memecahkan permasalahan nyata dalam kehidupan.`;
      points = [
        `Konsep dasar dan definisi ${topic}`,
        'Proses kerja dan komponen-komponen utamanya',
        'Contoh fenomena di lingkungan sekitar',
        'Manfaat pemahaman materi untuk menjaga kelestarian alam'
      ];
    }
  }
  // 7. MATEMATIKA
  else if (subject === 'Matematika') {
    if (isLowerMI) {
      materialText = `Ayo belajar berhitung seru untuk ${grade} topik "${topic}"! ` +
        `Matematika itu seperti bermain tebak-tebakan angka yang mengasyikkan. ` +
        `Kita akan belajar menghitung benda nyata, mengelompokkan bentuk, penjumlahan dan pengurangan ceria dengan bantuan gambar warna-warni. ` +
        `Siapa yang rajin berlatih berhitung, pasti akan menjadi anak yang teliti dan cerdas!`;
      points = [
        `Mengenal lambang dan nama bilangan (${topic})`,
        'Operasi hitung ceria dengan benda konkret',
        'Membandingkan banyak dan sedikitnya benda',
        'Menerapkan hitungan saat bermain dan berbelanja'
      ];
    } else {
      materialText = `Pembelajaran Matematika jenjang ${grade} mengenai "${topic}". ` +
        `Matematika melatih kita berpikir logis, runtut, dan terstruktur dalam memecahkan masalah. ` +
        `Dalam materi "${topic}", kita mempelajari konsep dasar perhitungan, langkah-langkah penyelesaian rumus secara bertahap, serta trik mudah untuk memahami hubungan antar angka dan pola. ` +
        `Matematika sangat bermanfaat dalam kehidupan sehari-hari seperti menghitung belanja, mengukur luas, dan mengelola waktu.`;
      points = [
        `Pengenalan konsep dan simbol ${topic}`,
        'Langkah sistematis penyelesaian soal langkah demi langkah',
        'Tips dan trik perhitungan cepat & teliti',
        'Penerapan praktis matematika di kehidupan sehari-hari'
      ];
    }
  }
  // 8. DYNAMIC UNIVERSAL FALLBACK
  else {
    materialText = `Materi pembelajaran ${subject} jenjang ${grade} mengenai "${topic}". ` +
      `Materi ini disusun secara terpadu untuk membekali peserta didik dengan pemahaman yang utuh dan aplikatif. ` +
      `Kita akan mengeksplorasi latar belakang, pengertian utama mengenai ${topic}, mekanisme kerja, hingga contoh nyata di lingkungan siswa. ` +
      (subtopics ? `Fokus khusus pembahasan mencakup: ${subtopics}. ` : '') +
      `Mari kita cermati setiap bagian dengan teliti untuk memperoleh wawasan yang mendalam dan bermakna.`;
    points = [
      `Pengenalan konsep utama ${topic}`,
      'Penjelasan terstruktur dan mekanisme penting',
      'Contoh penerapan aplikatif di dunia nyata',
      'Rangkuman poin inti pembelajaran'
    ];
  }

  return {
    title: topic,
    material: materialText,
    keyPoints: points,
    suggestedDuration: 3,
  };
}

startServer();
