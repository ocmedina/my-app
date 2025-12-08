const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/pedidos/nuevo/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix payment method buttons (lines 680, 696, 712, 728)
content = content.replace(
    /: "border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50"/g,
    ': "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"'
);

content = content.replace(
    /: "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"/g,
    ': "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"'
);

content = content.replace(
    /: "border-gray-300 bg-white text-gray-700 hover:border-orange-400 hover:bg-orange-50"/g,
    ': "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30"'
);

content = content.replace(
    /: "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50"/g,
    ': "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"'
);

// Fix TOTAL section (line 656)
content = content.replace(
    'className="flex justify-between items-center text-xl font-bold pt-3 border-t-2 border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 -mx-6 px-6 py-4 mt-3"',
    'className="flex justify-between items-center text-xl font-bold pt-3 border-t-2 border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 -mx-6 px-6 py-4 mt-3"'
);

// Fix customer selection cards (lines 354-358)
content = content.replace(
    /isSelected\s*\?\s*"border-blue-500 bg-blue-50 shadow-md"\s*:\s*"border-gray-200 hover:border-blue-300 hover:bg-gray-50"/g,
    'isSelected\n                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"\n                            : "border-gray-200 dark:border-slate-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-slate-800"'
);

// Fix product selection cards (lines 443-447)
content = content.replace(
    /isInCart\s*\?\s*"border-blue-300 bg-blue-50"\s*:\s*"border-gray-200 hover:border-gray-300 hover:bg-gray-50"/g,
    'isInCart\n                                ? "border-blue-300 bg-blue-50 dark:bg-blue-900/30"\n                                : "border-gray-200 dark:border-slate-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"'
);

// Fix "Total Recibido" section (line 802)
content = content.replace(
    'className="bg-purple-50 -mx-6 px-6 py-3 border-y border-purple-200"',
    'className="bg-purple-50 dark:bg-purple-950/30 -mx-6 px-6 py-3 border-y border-purple-200 dark:border-purple-900"'
);

// Fix "Saldo Pendiente" section (line 862)
content = content.replace(
    'className="pt-3 bg-orange-50 -mx-6 px-6 py-3 border-t border-orange-200"',
    'className="pt-3 bg-orange-50 dark:bg-orange-950/30 -mx-6 px-6 py-3 border-t border-orange-200 dark:border-orange-900"'
);

// Fix "Pago Completo" section (line 876)
content = content.replace(
    'className="pt-3 bg-green-50 -mx-6 px-6 py-3 border-t border-green-200"',
    'className="pt-3 bg-green-50 dark:bg-green-950/30 -mx-6 px-6 py-3 border-t border-green-200 dark:border-green-900"'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all elements in pedidos/nuevo/page.tsx');
