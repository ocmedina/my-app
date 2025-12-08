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

// Reemplazar el gradiente gris por el oscuro
function fixBackground(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patrón 1: bg-gradient-to-br from-gray-50 to-gray-100 sin dark mode
    const pattern1 = /className="([^"]*?)bg-gradient-to-br from-gray-50 to-gray-100(?! dark:from)([^"]*)"/g;
    if (pattern1.test(content)) {
        content = content.replace(
            /className="([^"]*?)bg-gradient-to-br from-gray-50 to-gray-100(?! dark:from)([^"]*)"/g,
            'className="$1bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950$2"'
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
console.log('Fixing backgrounds...\n');

let fixedCount = 0;
tsxFiles.forEach(file => {
    if (fixBackground(file)) {
        fixedCount++;
    }
});

console.log(`\n✨ Done! Fixed ${fixedCount} files`);
