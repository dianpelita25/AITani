// Nama file: ambil-kode-web.mjs
// Simpan di root folder proyek web Anda
// Jalankan dengan perintah: node ambil-kode-web.mjs

import fs from 'fs/promises';
import path from 'path';

// --- Utility Functions (Tetap sama) ---
const info = (msg) => console.log(`ℹ️  \x1b[1;34m${msg}\x1b[0m`);
const success = (msg) => console.log(`✅ \x1b[1;32m${msg}\x1b[0m`);
const fail = (msg) => {
    console.error(`✖️ \x1b[1;31mFAILURE: ${msg}\x1b[0m`);
    process.exit(1);
};

// --- Konfigurasi Khusus untuk Proyek Web (Vite/Tailwind) ---
const PROJECT_ROOT = process.cwd();
const OUTPUT_FILENAME = 'KONTEKS_WEB.txt';

// Folder-folder yang harus diabaikan sepenuhnya
const EXCLUDE_PATHS = [
    '.git', '.idea', '.vscode',
    'node_modules', // Sangat penting untuk diabaikan!
    'dist',         // Folder hasil build dari Vite
    'build',        // Nama lain untuk folder hasil build
    '.svelte-kit'   // Jika menggunakan SvelteKit
];

// Folder/file substring yang jika muncul di path akan dilewati (misal folder model biner)
const EXCLUDE_PATH_SUBSTRINGS = [
    'public/model', // Model AI berisi .bin besar dan unreadable
];

// File yang harus diabaikan berdasarkan nama
const EXCLUDE_NAMES = [
    'package-lock.json', // File lock, tidak perlu
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lockb',
    '.env',              // File rahasia, jangan dibagikan!
    '.env.local'
];

// File yang diabaikan berdasarkan ekstensi (biasanya file media)
const EXCLUDE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.svg',
    '.pdf', '.ttf', '.otf', '.woff', '.woff2', '.eot',
    '.mp3', '.wav',
    '.bin', '.dat', '.wasm', '.zip', '.gz',
    '.tflite'
];

// Folder utama yang berisi kode aplikasi Anda
const INCLUDE_PATHS = [
    'src',      // Folder utama berisi kode JavaScript/Svelte/Vue/React
    'public'
];

// File-file konfigurasi penting di root folder yang perlu dimasukkan
const INCLUDE_FILES_IN_ROOT = [
    'package.json',
    'vite.config.mjs', // atau .js/.ts
    'tailwind.config.js',
    'postcss.config.js',
    'jsconfig.json', // atau tsconfig.json
    'index.html',
    'README.md'
];

// Skip file jika ukurannya melewati ambang ini (dalam byte)
// Berguna untuk menghindari file besar yang sulit dibaca (mis. model AI, dump bobot)
const MAX_FILE_SIZE_BYTES = 400 * 1024; // 400 KB

// Jika ada file besar yang HARUS tetap diambil, letakkan path relatifnya di sini
const ALLOW_LARGE_FILES = [
    // contoh: 'src/important-large-file.js'
];

// --- Recursive File Walker (Fungsi untuk mencari file, tidak perlu diubah) ---
async function getFiles(dir) {
    try {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map(async (dirent) => {
            const res = path.resolve(dir, dirent.name);
            const relativePath = path.relative(PROJECT_ROOT, res);

            const shouldSkipFolder =
                EXCLUDE_PATHS.some(p => relativePath.startsWith(p)) ||
                EXCLUDE_PATH_SUBSTRINGS.some((sub) => relativePath.includes(sub));

            if (shouldSkipFolder || EXCLUDE_NAMES.includes(dirent.name)) {
                return [];
            }
            if (dirent.isDirectory()) {
                return getFiles(res);
            }
            if (EXCLUDE_EXTENSIONS.includes(path.extname(dirent.name).toLowerCase())) {
                return [];
            }
            return res;
        }));
        return files.flat();
    } catch (error) {
        // Abaikan jika folder tidak ditemukan (misal: 'public' tidak ada)
        return [];
    }
}

// --- FUNGSI UTAMA (sedikit modifikasi) ---
async function main() {
    console.clear();
    info("Memulai Kompilator Konteks untuk Proyek Web (Vite)...");
    info(`Output akan disimpan di: ${OUTPUT_FILENAME}`);

    let allFiles = [];

    // 1. Ambil semua file dari folder yang di-include (seperti 'src' dan 'public')
    for (const p of INCLUDE_PATHS) {
        const fullPath = path.join(PROJECT_ROOT, p);
        const filesFromPath = await getFiles(fullPath);
        allFiles.push(...filesFromPath);
    }

    // 2. Ambil file-file spesifik dari root folder
    for (const fileName of INCLUDE_FILES_IN_ROOT) {
        const filePath = path.join(PROJECT_ROOT, fileName);
        try {
            await fs.access(filePath); // Cek apakah file ada
            allFiles.push(filePath);
        } catch (e) { /* Abaikan jika file tidak ada */ }
    }

    // Hapus duplikat dan urutkan
    allFiles = [...new Set(allFiles)].sort();
    
    // Mulai membuat konten untuk file output
    let outputContent = `--- AWAL DARI SNAPSHOT KODE PROYEK WEB ---\n\n`;
    outputContent += `Proyek: ${path.basename(PROJECT_ROOT)}\n`;
    outputContent += `Dibuat pada: ${new Date().toString()}\n\n`;
    outputContent += "================================================================================\n";
    outputContent += "STRUKTUR FILE & KONTEN\n";
    outputContent += "================================================================================\n";
    
    for (const filePath of allFiles) {
        const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
        let fileSize = 0;
        try {
            const stat = await fs.stat(filePath);
            fileSize = stat.size;
        } catch {
            // jika gagal mendapatkan size, tetap lanjut baca (akan kosong jika gagal lagi)
        }

        if (
            MAX_FILE_SIZE_BYTES &&
            fileSize > MAX_FILE_SIZE_BYTES &&
            !ALLOW_LARGE_FILES.includes(relativePath)
        ) {
            outputContent += `\n\n--- File: ./${relativePath} (SKIPPED: > ${MAX_FILE_SIZE_BYTES} bytes) ---\n`;
            continue;
        }

        const fileContent = await fs.readFile(filePath, 'utf-8').catch(() => '');
        
        outputContent += `\n\n--- File: ./${relativePath} ---\n`;
        outputContent += `\n${fileContent}\n`;
    }

    outputContent += "\n\n================================================================================\n";
    outputContent += "--- AKHIR DARI SNAPSHOT KODE ---\n";
    outputContent += "================================================================================\n";

    await fs.writeFile(path.join(PROJECT_ROOT, OUTPUT_FILENAME), outputContent);

    success(`Snapshot kode berhasil dibuat di: ${OUTPUT_FILENAME}`);
}

main();
