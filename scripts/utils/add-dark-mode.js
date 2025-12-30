#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patrones a reemplazar
const replacements = [
    // Fondos blancos básicos
    { from: /className="([^"]*?)bg-white(?!\s+dark:bg-)([^"]*?)"/g, to: 'className="$1bg-white dark:bg-gray-800$2"' },
    { from: /className='([^']*?)bg-white(?!\s+dark:bg-)([^']*?)'/g, to: "className='$1bg-white dark:bg-gray-800$2'" },

    // Textos grises
    { from: /className="([^"]*?)text-gray-700(?!\s+dark:text-)([^"]*?)"/g, to: 'className="$1text-gray-700 dark:text-gray-200$2"' },
    { from: /className="([^"]*?)text-gray-600(?!\s+dark:text-)([^"]*?)"/g, to: 'className="$1text-gray-600 dark:text-gray-300$2"' },
    { from: /className="([^"]*?)text-gray-500(?!\s+dark:text-)([^"]*?)"/g, to: 'className="$1text-gray-500 dark:text-gray-400$2"' },
    { from: /className="([^"]*?)text-gray-900(?!\s+dark:text-)([^"]*?)"/g, to: 'className="$1text-gray-900 dark:text-white$2"' },
    { from: /className="([^"]*?)text-gray-800(?!\s+dark:text-)([^"]*?)"/g, to: 'className="$1text-gray-800 dark:text-gray-100$2"' },

    // Bordes
    { from: /className="([^"]*?)border-gray-200(?!\s+dark:border-)([^"]*?)"/g, to: 'className="$1border-gray-200 dark:border-gray-700$2"' },
    { from: /className="([^"]*?)border-gray-300(?!\s+dark:border-)([^"]*?)"/g, to: 'className="$1border-gray-300 dark:border-gray-600$2"' },

    // Divisores
    { from: /className="([^"]*?)divide-gray-200(?!\s+dark:divide-)([^"]*?)"/g, to: 'className="$1divide-gray-200 dark:divide-gray-700$2"' },

    // Fondos grises claros
    { from: /className="([^"]*?)bg-gray-50(?!\s+dark:bg-)([^"]*?)"/g, to: 'className="$1bg-gray-50 dark:bg-gray-900$2"' },
    { from: /className="([^"]*?)bg-gray-100(?!\s+dark:bg-)([^"]*?)"/g, to: 'className="$1bg-gray-100 dark:bg-gray-700$2"' },
    { from: /className="([^"]*?)bg-gray-200(?!\s+dark:bg-)([^"]*?)"/g, to: 'className="$1bg-gray-200 dark:bg-gray-600$2"' },

    // Hover states
    { from: /className="([^"]*?)hover:bg-gray-100(?!\s+dark:hover:bg-)([^"]*?)"/g, to: 'className="$1hover:bg-gray-100 dark:hover:bg-gray-700$2"' },
    { from: /className="([^"]*?)hover:bg-gray-50(?!\s+dark:hover:bg-)([^"]*?)"/g, to: 'className="$1hover:bg-gray-50 dark:hover:bg-gray-800$2"' },
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
console.log('Adding dark mode classes...\n');

let updatedCount = 0;
files.forEach(file => {
    if (processFile(file)) {
        updatedCount++;
    }
});

console.log(`\n✓ Updated ${updatedCount} files with dark mode classes`);
