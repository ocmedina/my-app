const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/pedidos/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix status badges
const badgePatterns = [
    { from: 'bg-blue-100 text-blue-800', to: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' },
    { from: 'bg-purple-100 text-purple-800', to: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' },
    { from: 'bg-green-100 text-green-800', to: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
    { from: 'bg-purple-100 text-purple-700', to: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    { from: 'bg-green-100 text-green-700', to: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
];

badgePatterns.forEach(({ from, to }) => {
    if (content.includes(from) && !content.includes(to)) {
        content = content.replace(new RegExp(from, 'g'), to);
    }
});

// Fix colored sections
const sectionPatterns = [
    { from: 'bg-green-50 rounded-xl p-4 border border-green-200', to: 'bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800' },
    { from: 'bg-orange-50 rounded-xl p-4 border-2 border-orange-300', to: 'bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border-2 border-orange-300 dark:border-orange-700' },
    { from: 'bg-green-50 rounded-xl p-3 border-2 border-green-300', to: 'bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border-2 border-green-300 dark:border-green-700' },
    { from: 'bg-red-50 rounded-lg p-3 border-2 border-red-200', to: 'bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border-2 border-red-200 dark:border-red-700' },
];

sectionPatterns.forEach(({ from, to }) => {
    if (content.includes(from) && !content.includes(to)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
    }
});

// Fix selected states
if (content.includes('border-blue-600 bg-blue-50 text-blue-700')) {
    content = content.replace(/border-blue-600 bg-blue-50 text-blue-700/g, 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400');
}

if (content.includes('border-gray-300 bg-white text-gray-700 hover:border-gray-400')) {
    content = content.replace(/border-gray-300 bg-white text-gray-700 hover:border-gray-400/g, 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-600');
}

// Fix hover backgrounds
if (content.includes('text-red-600 bg-red-50 rounded-lg hover:bg-red-100')) {
    content = content.replace(/text-red-600 bg-red-50 rounded-lg hover:bg-red-100/g, 'text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30');
}

if (content.includes('text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100')) {
    content = content.replace(/text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100/g, 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30');
}

if (content.includes('bg-blue-50 text-blue-600 hover:bg-blue-100')) {
    content = content.replace(/bg-blue-50 text-blue-600 hover:bg-blue-100/g, 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed dark mode in pedidos/page.tsx modal');
