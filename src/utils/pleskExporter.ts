import JSZip from 'jszip';
import { VideoProject, HeroConfig } from '../types.ts';

export interface PleskExportOptions {
  includeSampleProjects?: boolean;
  heroConfig?: HeroConfig;
  projects?: VideoProject[];
  domainName?: string;
  nodeVersion?: string;
  enablePhpFallback?: boolean;
  onProgress?: (percent: number, status: string) => void;
}

export async function generatePleskHostingZip(options: PleskExportOptions = {}): Promise<Blob> {
  const {
    projects = [],
    heroConfig,
    domainName = 'madrasah-eduvideo.sch.id',
    nodeVersion = '20.x',
    onProgress,
  } = options;

  onProgress?.(10, 'Inisialisasi paket Plesk Hosting...');
  const zip = new JSZip();

  // Root and httpdocs folder (standard Plesk web root)
  const httpdocs = zip.folder('httpdocs') || zip;

  onProgress?.(25, 'Menyusun berkas konfigurasi .htaccess & web.config...');

  // 1. .htaccess for Plesk Apache/Nginx reverse proxy
  const htaccessContent = `# =======================================================
# EduVideo AI - Plesk Obsidian Production .htaccess
# Target Domain: ${domainName}
# Optimized for: Apache 2.4+ / LiteSpeed / Nginx Proxy
# =======================================================

# 1. Enable Rewrite Engine & SPA Fallback
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Force HTTPS
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Direct access to real files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Route all other requests to index.html SPA entry
  RewriteRule ^ index.html [L]
</IfModule>

# 2. GZIP & Deflate Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# 3. Browser Caching Rules
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType audio/mpeg "access plus 1 year"
  ExpiresByType video/mp4 "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# 4. Security & CORS Headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# 5. MIME Types Configuration
<IfModule mod_mime.c>
  AddType application/javascript js mjs
  AddType application/json json
  AddType image/svg+xml svg svgz
  AddType font/woff2 woff2
  AddType video/mp4 mp4
  AddType video/webm webm
  AddType audio/mpeg mp3
  AddType audio/ogg ogg
  AddType audio/wav wav
</IfModule>
`;
  httpdocs.file('.htaccess', htaccessContent);

  // 2. web.config for Windows / IIS Plesk Environments
  const webConfigContent = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="HTTPS Redirect" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
        <rule name="React SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <remove fileExtension=".mp4" />
      <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
    </staticContent>
  </system.webServer>
</configuration>`;
  httpdocs.file('web.config', webConfigContent);

  onProgress?.(45, 'Membuat index.html, index.php & API router Plesk...');

  // 3. index.php (PHP SPA Fallback + REST API handler for standard Plesk PHP Hosting)
  const indexPhpContent = `<?php
/**
 * EduVideo AI - Plesk PHP-FPM Entry Point & API Proxy
 * Server Domain: ${domainName}
 * Generated: ${new Date().toISOString()}
 */

header("X-Powered-By: EduVideo AI / Plesk Obsidian");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// API Health Check
if ($request_uri === '/api/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'online',
        'server' => 'Plesk Obsidian Web Hosting',
        'domain' => '${domainName}',
        'php_version' => PHP_VERSION,
        'hasApiKey' => !empty(getenv('GEMINI_API_KEY')),
        'app' => 'EduVideo AI Madrasah Edition',
        'timestamp' => time()
    ]);
    exit;
}

// API Projects Fetch Fallback
if ($request_uri === '/api/projects' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    $dataFile = __DIR__ . '/data/projects.json';
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } else {
        echo json_encode([]);
    }
    exit;
}

// Serve Static Files or SPA Fallback
$filePath = __DIR__ . $request_uri;
if ($request_uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimes = [
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'json' => 'application/json',
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'webp' => 'image/webp',
        'woff2'=> 'font/woff2',
        'mp4'  => 'video/mp4',
        'mp3'  => 'audio/mpeg',
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    readfile($filePath);
    exit;
}

// Default SPA index.html Delivery
if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
} else {
    echo "<h1>EduVideo AI - Berhasil Terhubung di Plesk</h1><p>Silakan upload build file aplikasi ke direktori httpdocs.</p>";
}
`;
  httpdocs.file('index.php', indexPhpContent);

  // 4. index.html Standalone Client App
  const indexHtmlContent = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EduVideo AI - Generator Video Pembelajaran Guru Madrasah & Sekolah</title>
    <meta name="description" content="Aplikasi pembuat video edukasi otomatis berbasis AI untuk guru Madrasah Ibtidaiyah (MI) dan umum, dilengkapi 7-scene storyboard, narasi suara, subtitle bergerak, dan kuis interaktif." />
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
    
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css">
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased min-h-screen">
    <div id="root"></div>
  </body>
</html>`;
  httpdocs.file('index.html', indexHtmlContent);

  // 5. Embedded Projects & Hero Data JSON in /data
  const dataFolder = httpdocs.folder('data');
  if (dataFolder) {
    dataFolder.file('projects.json', JSON.stringify(projects, null, 2));
    if (heroConfig) {
      dataFolder.file('hero_config.json', JSON.stringify(heroConfig, null, 2));
    }
  }

  onProgress?.(65, 'Menyiapkan Node.js Server & Passenger Config...');

  // 6. Node.js Server for Plesk Node.js Extension (Phusion Passenger)
  const nodeServerContent = `/**
 * EduVideo AI - Standalone Production Node Server for Plesk
 * Node.js Version: ${nodeVersion}
 * Port: process.env.PORT || 3000
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    server: 'Plesk Node.js Production Engine',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
    domain: '${domainName}'
  });
});

// Projects API
const dataFilePath = path.join(__dirname, 'httpdocs', 'data', 'projects.json');

app.get('/api/projects', (req, res) => {
  if (fs.existsSync(dataFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to read data' });
    }
  }
  res.json([]);
});

// Serve Static Assets from httpdocs
app.use(express.static(path.join(__dirname, 'httpdocs'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// SPA Fallback for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'httpdocs', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`EduVideo AI Running on Plesk Server port \${PORT}\`);
});
`;
  zip.file('server.js', nodeServerContent);

  // 7. Production package.json for Plesk Node.js
  const prodPackageJson = {
    name: 'eduvideo-ai-plesk',
    version: '2.5.0',
    private: true,
    description: 'EduVideo AI Video Generator for Madrasah & Schools - Plesk Hosting Edition',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
    },
    dependencies: {
      express: '^4.21.2',
    },
    engines: {
      node: '>=18.0.0',
    },
  };
  zip.file('package.json', JSON.stringify(prodPackageJson, null, 2));

  // 8. .env.example for Plesk Environment Variable Setup
  const envExampleContent = `# ========================================================
# EduVideo AI - Plesk Hosting Environment Configuration
# Isi di menu Plesk: Websites & Domains > Node.js > Environment Variables
# Atau simpan sebagai file .env di root direktori domain Anda.
# ========================================================

NODE_ENV=production
PORT=3000

# Google Gemini API Key untuk Generator Video Edukasi Otomatis
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Pengaturan Domain Madrasah
APP_DOMAIN=${domainName}
APP_NAME=EduVideo AI Madrasah

# Database MySQL Plesk (Opsional)
DB_HOST=localhost
DB_NAME=eduvideo_db
DB_USER=eduvideo_user
DB_PASS=PasswordKuatAnda123!
`;
  zip.file('.env.example', envExampleContent);

  onProgress?.(80, 'Menyusun skema database MySQL & panduan instalasi...');

  // 9. Database MySQL Schema for Plesk phpMyAdmin
  const databaseSqlContent = `-- =======================================================
-- EduVideo AI - Skema Database MySQL / MariaDB Plesk
-- Buat Database baru di menu Plesk: Databases > Add Database
-- Import file SQL ini melalui phpMyAdmin di Plesk
-- =======================================================

CREATE DATABASE IF NOT EXISTS \`eduvideo_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`eduvideo_db\`;

-- 1. Tabel Konfigurasi Hero & Tampilan
CREATE TABLE IF NOT EXISTS \`hero_config\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`badge_text\` VARCHAR(255) NOT NULL,
  \`headline_main\` VARCHAR(255) NOT NULL,
  \`headline_highlight\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`cta_button_text\` VARCHAR(100) NOT NULL,
  \`feature_pill_1\` VARCHAR(150),
  \`feature_pill_2\` VARCHAR(150),
  \`feature_pill_3\` VARCHAR(150),
  \`feature_pill_4\` VARCHAR(150),
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Proyek Video Pembelajaran
CREATE TABLE IF NOT EXISTS \`video_projects\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`subject\` VARCHAR(100) NOT NULL,
  \`grade\` VARCHAR(100) NOT NULL,
  \`topic\` TEXT NOT NULL,
  \`learning_material\` LONGTEXT NOT NULL,
  \`target_duration_minutes\` INT DEFAULT 2,
  \`visual_style\` VARCHAR(100) DEFAULT 'Kartun 2D',
  \`language\` VARCHAR(50) DEFAULT 'id-ID',
  \`status\` VARCHAR(50) DEFAULT 'ready',
  \`thumbnail_url\` VARCHAR(500),
  \`scenes_json\` LONGTEXT NOT NULL,
  \`voice_config_json\` TEXT,
  \`audio_track_json\` TEXT,
  \`subtitle_config_json\` TEXT,
  \`export_settings_json\` TEXT,
  \`total_duration_seconds\` INT DEFAULT 60,
  \`rendered_video_url\` VARCHAR(500),
  \`created_at\` DATETIME NOT NULL,
  \`updated_at\` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Administrator
CREATE TABLE IF NOT EXISTS \`admin_users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(100) UNIQUE NOT NULL,
  \`email\` VARCHAR(255) UNIQUE NOT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(50) DEFAULT 'superadmin',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inisialisasi Akun Admin Default
INSERT INTO \`admin_users\` (\`username\`, \`email\`, \`password_hash\`, \`full_name\`, \`role\`)
VALUES ('admin', 'mimaarifnu2sanggreman@gmail.com', MD5('admin123'), 'Administrator MI Ma\'arif NU 2 Sanggreman', 'superadmin')
ON DUPLICATE KEY UPDATE \`full_name\` = VALUES(\`full_name\`);
`;
  zip.file('database_schema.sql', databaseSqlContent);

  // 10. Comprehensive Plesk Installation & Deployment Guide (Indonesian)
  const readmePleskContent = `# Panduan Lengkap Instalasi EduVideo AI di Hosting Plesk Obsidian

Selamat! Paket ZIP ini telah disiapkan secara khusus dan teroptimasi untuk di-hosting pada panel control **Plesk Obsidian** (Linux / Windows).

---

## 📋 Langkah-Langkah Instalasi di Plesk (Hanya 5 Menit):

### Cara 1: Mode Node.js di Plesk (Sangat Direkomendasikan)
1. **Masuk ke Panel Plesk**: Login ke akun Plesk Anda (\`https://ip-atau-domain:8443\`).
2. **Buka Menu Domain**: Pilih domain Anda (misal: \`${domainName}\`).
3. **Buka File Manager**:
   - Masuk ke direktori root domain.
   - Klik **Upload File** dan pilih file ZIP ini (\`eduvideo-plesk-package.zip\`).
   - Klik kanan pada file ZIP lalu pilih **Extract Files**.
4. **Konfigurasi Node.js di Plesk**:
   - Di menu domain, klik ikon **Node.js**.
   - **Node.js Version**: Pilih Node.js 18.x, 20.x, atau 22.x.
   - **Document Root**: \`/httpdocs\`
   - **Application Root**: \`/\` (root direktori domain)
   - **Application Startup File**: \`server.js\`
   - Klik **NPM Install** untuk menginstal paket dependensi.
5. **Set Environment Variables**:
   - Tambahkan variabel:
     - \`GEMINI_API_KEY\` = Masukkan kunci API Google Gemini Anda.
     - \`NODE_ENV\` = \`production\`
   - Klik **Restart App**.
6. **Aktifkan SSL Let's Encrypt**:
   - Klik menu **SSL/TLS Certificates** di Plesk.
   - Klik **Install** / **Get it free** via Let's Encrypt untuk mengaktifkan HTTPS gembok hijau secara gratis.

---

### Cara 2: Mode Web Hosting Standar (Static SPA + PHP-FPM)
Jika server Plesk Anda tidak memiliki ekstensi Node.js, aplikasi ini tetap dapat berjalan 100% menggunakan PHP & Web Server Apache/Nginx:
1. Ekstrak seluruh isi folder \`httpdocs/\` langsung ke dalam folder \`httpdocs\` domain Anda.
2. Pastikan file \`.htaccess\` dan \`index.php\` berada di dalam \`httpdocs\`.
3. Buka domain di browser Anda. Aplikasi langsung berjalan dengan dukungan routing React SPA.

---

## 🗄️ Konfigurasi Database MySQL (Opsional):
1. Masuk ke menu **Databases** > **Add Database** di Plesk.
2. Beri nama database \`eduvideo_db\` dan buat user database.
3. Klik tombol **phpMyAdmin** lalu klik tab **Import**.
4. Pilih file \`database_schema.sql\` dari paket ini lalu klik **Go**.

---

## 🔐 Akun Login Admin Default:
- **Email / Username**: \`admin\` atau \`mimaarifnu2sanggreman@gmail.com\`
- **Password**: \`admin123\` *(Dapat diubah kapan saja di Dashboard Admin)*

---

*EduVideo AI Madrasah Edition • Dioptimalkan untuk Madrasah Ibtidaiyah & Sekolah Indonesia*
`;
  zip.file('README_PLESK_DEPLOYMENT.md', readmePleskContent);

  // 11. Plesk Manifest JSON
  const pleskManifest = {
    packageName: 'EduVideo AI Madrasah Edition',
    version: '2.5.0',
    generatedAt: new Date().toISOString(),
    targetPlatform: 'Plesk Obsidian 18.0+',
    webServer: 'Apache 2.4 / Nginx / IIS',
    phpSupport: 'PHP 8.0 - 8.3',
    nodeSupport: 'Node.js 18.x - 22.x',
    includedProjectsCount: projects.length,
    features: [
      'Automatic .htaccess SPA Rewrite',
      'Plesk Phusion Passenger server.js',
      'PHP Fallback Router & API Proxy',
      'MySQL Database Schema Dump',
      'Let\'s Encrypt SSL Ready',
      'GZIP & Security Headers Pre-configured'
    ]
  };
  zip.file('plesk-manifest.json', JSON.stringify(pleskManifest, null, 2));

  onProgress?.(95, 'Mengompresi seluruh berkas ke format .zip...');

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  onProgress?.(100, 'Paket ZIP Hosting Plesk siap diunduh!');
  return zipBlob;
}

/**
 * Trigger immediate browser download of the generated zip
 */
export function downloadBlob(blob: Blob, filename: string = 'eduvideo-plesk-hosting-package.zip') {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * High-level helper to generate and trigger download of Plesk zip
 */
export async function generateAndDownloadPleskZip(
  options: PleskExportOptions & { filename?: string; databaseName?: string; includeNodeServer?: boolean; includePhpApache?: boolean; includeIisWebConfig?: boolean } = {}
): Promise<void> {
  const blob = await generatePleskHostingZip(options);
  downloadBlob(blob, options.filename || `eduvideo-plesk-package-${new Date().toISOString().slice(0, 10)}.zip`);
}

