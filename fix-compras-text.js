const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/compras/nueva/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix modal title (line 117)
content = content.replace(
    'className="text-xl font-bold text-gray-800 flex items-center gap-2">',
    'className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">'
);

// Fix cancel button (line 608)
content = content.replace(
    'className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-semibold flex items-center gap-2"',
    'className="px-6 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-all font-semibold flex items-center gap-2"'
);

// Fix "Agregar Productos" title (line 668)
content = content.replace(
    /className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">\s*<FaBoxes/,
    'className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">\n                <FaBoxes'
);

// Fix product name in table (line 730)
content = content.replace(
    'className="font-semibold text-gray-800">',
    'className="font-semibold text-gray-800 dark:text-slate-100">'
);

// Fix summary panel title (line 807) - this one might be duplicate
const summaryTitleRegex = /<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">\s*<FaFileInvoice/;
if (summaryTitleRegex.test(content)) {
    content = content.replace(
        summaryTitleRegex,
        '<h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">\n              <FaFileInvoice'
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all text-gray-800 elements in compras/nueva/page.tsx');
