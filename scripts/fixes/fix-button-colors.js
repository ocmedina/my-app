#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Revertir cambios en botones de colores que no deberían haberse modificado
const fixes = [
    // Restaurar botones azules
    { from: /bg-blue-600 dark:bg-slate-900/g, to: 'bg-blue-600' },
    { from: /bg-blue-500 dark:bg-slate-900/g, to: 'bg-blue-500' },
    { from: /hover:bg-blue-700 dark:hover:bg-slate-800\/80/g, to: 'hover:bg-blue-700' },
    { from: /hover:bg-blue-600 dark:hover:bg-slate-800\/80/g, to: 'hover:bg-blue-600' },

    // Restaurar botones verdes
    { from: /bg-green-600 dark:bg-slate-900/g, to: 'bg-green-600' },
    { from: /bg-green-500 dark:bg-slate-900/g, to: 'bg-green-500' },
    { from: /hover:bg-green-700 dark:hover:bg-slate-800\/80/g, to: 'hover:bg-green-700' },

    // Restaurar botones rojos
    { from: /bg-red-600 dark:bg-slate-900/g, to: 'bg-red-600' },
    { from: /bg-red-500 dark:bg-slate-900/g, to: 'bg-red-500' },
    { from: /hover:bg-red-700 dark:hover:bg-slate-800\/80/g, to: 'hover:bg-red-700' },

    // Restaurar botones amarillos/naranjas
    { from: /bg-yellow-500 dark:bg-slate-900/g, to: 'bg-yellow-500' },
    { from: /bg-orange-600 dark:bg-slate-900/g, to: 'bg-orange-600' },
    { from: /bg-orange-500 dark:bg-slate-900/g, to: 'bg-orange-500' },

    // Restaurar botones púrpura
    { from: /bg-purple-600 dark:bg-slate-900/g, to: 'bg-purple-600' },
    { from: /bg-purple-500 dark:bg-slate-900/g, to: 'bg-purple-500' },

    // Restaurar fondos de colores en tarjetas de estadísticas
    { from: /bg-blue-50 dark:bg-slate-950/g, to: 'bg-blue-50 dark:bg-blue-900/20' },
    { from: /bg-green-50 dark:bg-slate-950/g, to: 'bg-green-50 dark:bg-green-900/20' },
    { from: /bg-red-50 dark:bg-slate-950/g, to: 'bg-red-50 dark:bg-red-900/20' },
    { from: /bg-yellow-50 dark:bg-slate-950/g, to: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { from: /bg-orange-50 dark:bg-slate-950/g, to: 'bg-orange-50 dark:bg-orange-900/20' },
    { from: /bg-purple-50 dark:bg-slate-950/g, to: 'bg-purple-50 dark:bg-purple-900/20' },
    { from: /bg-indigo-50 dark:bg-slate-950/g, to: 'bg-indigo-50 dark:bg-indigo-900/20' },
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(({ from, to }) => {
        const newContent = content.replace(from, to);
        if (newContent !== content) {
            modified = true;
            content = newContent;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed: ${filePath}`);
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
console.log('Fixing button colors...\n');

let updatedCount = 0;
files.forEach(file => {
    if (processFile(file)) {
        updatedCount++;
    }
});

console.log(`\n✓ Fixed ${updatedCount} files`);
