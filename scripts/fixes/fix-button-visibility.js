const fs = require('fs');
const path = require('path');

// Buscar todos los archivos .tsx en dashboard
function findTsxFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findTsxFiles(filePath, fileList);
        } else if (file.endsWith('.tsx')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Arreglar botones con problemas de visibilidad
function fixButtons(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patrón 1: bg-white sin dark mode en botones
    const pattern1 = /className="([^"]*?)bg-white(?! dark:bg)([^"]*?)"/g;
    if (pattern1.test(content)) {
        content = content.replace(
            /className="([^"]*?)bg-white(?! dark:bg)([^"]*)"/g,
            (match, before, after) => {
                // Solo si parece ser un botón o elemento interactivo
                if (before.includes('button') || before.includes('hover:') || after.includes('hover:')) {
                    return `className="${before}bg-white dark:bg-slate-800${after}"`;
                }
                return match;
            }
        );
        modified = true;
    }

    // Patrón 2: text-gray-700 sin dark mode en botones
    const pattern2 = /className="([^"]*?)text-gray-700(?! dark:text)([^"]*?)"/g;
    if (pattern2.test(content)) {
        content = content.replace(
            /className="([^"]*?)text-gray-700(?! dark:text)([^"]*)"/g,
            (match, before, after) => {
                if (before.includes('button') || before.includes('hover:') || after.includes('hover:')) {
                    return `className="${before}text-gray-700 dark:text-slate-200${after}"`;
                }
                return match;
            }
        );
        modified = true;
    }

    // Patrón 3: bg-gray-100 sin dark mode
    const pattern3 = /className="([^"]*?)bg-gray-100(?! dark:bg)([^"]*?)"/g;
    if (pattern3.test(content)) {
        content = content.replace(
            /className="([^"]*?)bg-gray-100(?! dark:bg)([^"]*)"/g,
            'className="$1bg-gray-100 dark:bg-slate-700$2"'
        );
        modified = true;
    }

    // Patrón 4: bg-gray-200 sin dark mode
    const pattern4 = /className="([^"]*?)bg-gray-200(?! dark:bg)([^"]*?)"/g;
    if (pattern4.test(content)) {
        content = content.replace(
            /className="([^"]*?)bg-gray-200(?! dark:bg)([^"]*)"/g,
            'className="$1bg-gray-200 dark:bg-slate-600$2"'
        );
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        return true;
    }

    return false;
}

// Main
const dashboardDir = path.join(__dirname, 'src', 'app', 'dashboard');
const tsxFiles = findTsxFiles(dashboardDir);

console.log(`Found ${tsxFiles.length} .tsx files in dashboard`);
console.log('Fixing button visibility issues...\n');

let fixedCount = 0;
tsxFiles.forEach(file => {
    if (fixButtons(file)) {
        fixedCount++;
    }
});

console.log(`\n✨ Done! Fixed ${fixedCount} files`);
