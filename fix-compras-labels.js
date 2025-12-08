const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/compras/nueva/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all labels in modal (lines 132, 149, 166, 188)
content = content.replace(
    /className="block text-sm font-medium text-gray-700 mb-1"/g,
    'className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1"'
);

// Fix label in summary panel (line 840)
content = content.replace(
    /className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">\s*<FaDollarSign className="text-green-600"/,
    'className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">\n                <FaDollarSign className="text-green-600"'
);

// Fix all border-gray-300 inputs that don't have dark mode
content = content.replace(
    /className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/g,
    'className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"'
);

// Fix text-gray-600 and text-gray-500 elements
content = content.replace(
    /className="text-gray-600"/g,
    'className="text-gray-600 dark:text-slate-300"'
);

content = content.replace(
    /className="text-gray-500"/g,
    'className="text-gray-500 dark:text-slate-400"'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all remaining labels and inputs in compras/nueva/page.tsx');
