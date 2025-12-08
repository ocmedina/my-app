const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src/app/reparto/components');

// Función para procesar archivos
function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix hover backgrounds
    if (content.includes('hover:bg-blue-50')) {
        content = content.replace(/hover:bg-blue-50/g, 'hover:bg-blue-50 dark:hover:bg-blue-900/30');
        changed = true;
    }

    if (content.includes('hover:bg-red-50')) {
        content = content.replace(/hover:bg-red-50/g, 'hover:bg-red-50 dark:hover:bg-red-900/30');
        changed = true;
    }

    if (content.includes('hover:bg-green-50')) {
        content = content.replace(/hover:bg-green-50/g, 'hover:bg-green-50 dark:hover:bg-green-900/30');
        changed = true;
    }

    // Fix status badges
    const badgePatterns = [
        { from: 'bg-yellow-100 text-yellow-700', to: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
        { from: 'bg-yellow-100 text-yellow-800', to: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' },
        { from: 'bg-red-100 text-red-700', to: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
        { from: 'bg-red-100 text-red-800', to: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' },
        { from: 'bg-green-100 text-green-700', to: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
        { from: 'bg-green-100 text-green-800', to: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
        { from: 'bg-purple-100 text-purple-700', to: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    ];

    badgePatterns.forEach(({ from, to }) => {
        if (content.includes(from) && !content.includes(to)) {
            content = content.replace(new RegExp(from, 'g'), to);
            changed = true;
        }
    });

    // Fix card backgrounds
    const cardPatterns = [
        { from: 'bg-purple-50 p-3 rounded-xl border-2 border-purple-200', to: 'bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border-2 border-purple-200 dark:border-purple-700' },
        { from: 'bg-red-50 rounded-lg border border-red-200', to: 'bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700' },
        { from: 'bg-yellow-50 border border-yellow-200', to: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700' },
        { from: 'bg-red-100 rounded-full', to: 'bg-red-100 dark:bg-red-900/30 rounded-full' },
    ];

    cardPatterns.forEach(({ from, to }) => {
        if (content.includes(from) && !content.includes(to)) {
            content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
            changed = true;
        }
    });

    // Fix tab backgrounds
    if (content.includes('bg-blue-50 border-b-2 border-blue-600 text-blue-600')) {
        content = content.replace(/bg-blue-50 border-b-2 border-blue-600 text-blue-600/g, 'bg-blue-50 dark:bg-blue-900/30 border-b-2 border-blue-600 text-blue-600');
        changed = true;
    }

    // Fix selected states
    if (content.includes('border-blue-600 bg-blue-50 text-blue-700')) {
        content = content.replace(/border-blue-600 bg-blue-50 text-blue-700/g, 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400');
        changed = true;
    }

    if (content.includes('border-gray-200 bg-white text-gray-600 hover:border-gray-300')) {
        content = content.replace(/border-gray-200 bg-white text-gray-600 hover:border-gray-300/g, 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        return path.basename(filePath);
    }
    return null;
}

// Procesar todos los archivos
const files = [
    'NewOrderView.tsx',
    'HistoryView.tsx',
    'DailyOrdersView.tsx',
    'DeliveryHeader.tsx',
    'modals/RemitoModal.tsx',
    'modals/OrderDetailsModal.tsx',
    'modals/EditOrderModal.tsx',
    'modals/DeliveryConfirmationModal.tsx',
    'modals/CancelOrderModal.tsx',
    'modals/AddProductModal.tsx',
];

const changedFiles = [];
files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    if (fs.existsSync(filePath)) {
        const result = processFile(filePath);
        if (result) changedFiles.push(result);
    }
});

console.log(`✅ Fixed dark mode in ${changedFiles.length} files:`);
changedFiles.forEach(file => console.log(`  - ${file}`));
