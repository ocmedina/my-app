const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/reportes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix purple card (line 361)
content = content.replace(
    'className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200"',
    'className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-800"'
);

// Fix saved report cards (lines 596, 607, 615, 623)
content = content.replace(
    /<div className="bg-blue-50 p-3 rounded-lg border border-blue-200">/g,
    '<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">'
);

content = content.replace(
    /<div className="bg-green-50 p-3 rounded-lg border border-green-200">/g,
    '<div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">'
);

content = content.replace(
    /<div className="bg-purple-50 p-3 rounded-lg border border-purple-200">/g,
    '<div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">'
);

content = content.replace(
    /<div className="bg-orange-50 p-3 rounded-lg border border-orange-200">/g,
    '<div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">'
);

// Fix section headers (lines 634, 681)
content = content.replace(
    'className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300"',
    'className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700"'
);

content = content.replace(
    'className="bg-green-50 p-4 rounded-lg border-2 border-green-300"',
    'className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-300 dark:border-green-700"'
);

// Fix arqueo section (line 718)
content = content.replace(
    'className="bg-blue-50 p-5 rounded-lg border border-blue-200"',
    'className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800"'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all dark mode issues in reportes/page.tsx');
