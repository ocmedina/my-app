const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/compras/nueva/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix modal cancel button (line 223)
content = content.replace(
    'className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"',
    'className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950 transition-colors disabled:opacity-50"'
);

// Fix table row hover (line 726)
content = content.replace(
    'className="hover:bg-gray-50 transition-colors"',
    'className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950 transition-colors"'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed remaining buttons and hover states in compras/nueva/page.tsx');
