// Nama file: buat-struktur.mjs
// Simpan di root folder proyek Anda
// Jalankan dengan perintah: node buat-struktur.mjs

import fs from 'fs/promises';
import path from 'path';

// --- Konfigurasi (Sama seperti skrip sebelumnya) ---
const PROJECT_ROOT = process.cwd();
const OUTPUT_FILENAME = 'STRUKTUR_PROYEK.txt';

const EXCLUDE_PATHS = ['.git', '.idea', '.vscode', 'node_modules', 'dist', 'build', '.svelte-kit'];
const EXCLUDE_NAMES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', '.env', '.env.local'];
const EXCLUDE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.svg', '.pdf', '.ttf', '.otf', '.woff', '.woff2', '.eot', '.mp3', '.wav'];

// --- Fungsi untuk mencari file (Sama seperti skrip sebelumnya) ---
async function getFiles(dir) {
    let results = [];
    try {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const res = path.resolve(dir, dirent.name);
            const relativePath = path.relative(PROJECT_ROOT, res);

            if (EXCLUDE_PATHS.some(p => relativePath.startsWith(p)) || EXCLUDE_NAMES.includes(dirent.name)) {
                continue;
            }
            if (dirent.isDirectory()) {
                results.push(res); // Tambahkan folder ke hasil
                results = results.concat(await getFiles(res));
            } else if (!EXCLUDE_EXTENSIONS.includes(path.extname(dirent.name).toLowerCase())) {
                results.push(res); // Tambahkan file ke hasil
            }
        }
    } catch (e) { /* Abaikan error jika folder tidak bisa dibaca */ }
    return results;
}

// --- Fungsi Baru untuk Membuat Tampilan Pohon ---
function generateTree(filePaths, root) {
    const rootName = path.basename(root);
    let tree = `${rootName}\n`;
    const sortedPaths = filePaths.map(p => path.relative(root, p)).sort();

    const structure = {};
    for (const p of sortedPaths) {
        p.split(path.sep).reduce((acc, part) => {
            if (!acc[part]) acc[part] = {};
            return acc[part];
        }, structure);
    }

    function buildTree(currentLevel, prefix = '') {
        const entries = Object.keys(currentLevel);
        entries.forEach((entry, index) => {
            const isLast = index === entries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            tree += `${prefix}${connector}${entry}\n`;
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            buildTree(currentLevel[entry], newPrefix);
        });
    }

    buildTree(structure);
    return tree;
}

// --- FUNGSI UTAMA ---
async function main() {
    console.clear();
    console.log("Membuat struktur file proyek...");

    const allPaths = await getFiles(PROJECT_ROOT);
    const treeStructure = generateTree(allPaths, PROJECT_ROOT);

    await fs.writeFile(OUTPUT_FILENAME, treeStructure);

    console.log("\nStruktur Proyek:");
    console.log("----------------------------------------");
    console.log(treeStructure);
    console.log("----------------------------------------");
    console.log(`✅ Struktur file berhasil disimpan di: ${OUTPUT_FILENAME}`);
}

main();