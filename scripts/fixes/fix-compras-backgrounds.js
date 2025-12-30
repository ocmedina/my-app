const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/compras/nueva/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix modal background (line 114)
content = content.replace(
    'className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"',
    'className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"'
);

// Fix "Agregar Productos" card (line 667)
content = content.replace(
    'className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">',
    'className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">'
);

// Fix cart card (line 680)
content = content.replace(
    'className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">',
    'className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">'
);

// Fix tbody (line 719)
content = content.replace(
    'className="divide-y divide-gray-200 bg-white">',
    'className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-900">'
);

// Fix summary panel (line 806)
content = content.replace(
    'className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-6 h-fit sticky top-6">',
    'className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 space-y-6 h-fit sticky top-6">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all remaining bg-white elements in compras/nueva/page.tsx');
