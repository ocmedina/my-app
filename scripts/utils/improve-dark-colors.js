#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Nueva paleta mejorada - más suave y moderna
const replacements = [
    // Reemplazar los fondos oscuros actuales por una paleta más suave
    { from: /dark:bg-gray-900/g, to: 'dark:bg-slate-950' },
    { from: /dark:bg-gray-800/g, to: 'dark:bg-slate-900' },
    { from: /dark:bg-gray-700/g, to: 'dark:bg-slate-800' },
    { from: /dark:bg-gray-600/g, to: 'dark:bg-slate-700' },

    // Textos más suaves
    { from: /dark:text-white/g, to: 'dark:text-slate-50' },
    { from: /dark:text-gray-100/g, to: 'dark:text-slate-100' },
    { from: /dark:text-gray-200/g, to: 'dark:text-slate-200' },
    { from: /dark:text-gray-300/g, to: 'dark:text-slate-300' },
    { from: /dark:text-gray-400/g, to: 'dark:text-slate-400' },

    // Bordes más sutiles
    { from: /dark:border-gray-700/g, to: 'dark:border-slate-700' },
    { from: /dark:border-gray-600/g, to: 'dark:border-slate-600' },

    // Divisores
    { from: /dark:divide-gray-700/g, to: 'dark:divide-slate-700' },

    // Hover states más suaves
    { from: /dark:hover:bg-gray-800/g, to: 'dark:hover:bg-slate-800' },
    { from: /dark:hover:bg-gray-700/g, to: 'dark:hover:bg-slate-800/80' },
    { from: /dark:hover:bg-gray-600/g, to: 'dark:hover:bg-slate-700' },
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
        const newContent = content.replace(from, to);
        if (newContent !== content) {
            modified = true;
            content = newContent;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${filePath}`);
        return true;
    }
    return false;
}

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules') {
                walkDir(filePath, fileList);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Procesar archivos
const srcDir = path.join(__dirname, 'src');
const files = walkDir(srcDir);

console.log(`Found ${files.length} TypeScript files`);
console.log('Improving dark mode color palette...\n');

let updatedCount = 0;
files.forEach(file => {
    if (processFile(file)) {
        updatedCount++;
    }
});

console.log(`\n✓ Updated ${updatedCount} files with improved colors`);
