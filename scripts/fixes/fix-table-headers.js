const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/dashboard/ventas/[id]/SaleDetailsClient.tsx',
    'src/app/dashboard/products/page.tsx',
    'src/app/dashboard/proveedores/page.tsx',
    'src/app/dashboard/proveedores/ordenes/page.tsx',
    'src/app/dashboard/pedidos/[id]/OrderDetailsClient.tsx',
    'src/app/dashboard/compras/nueva/page.tsx',
    'src/app/dashboard/clientes/page.tsx'
];

let fixedCount = 0;

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix table headers: bg-gradient-to-r from-gray-50 to-gray-100 without dark mode
    content = content.replace(
        /className="bg-gradient-to-r from-gray-50 to-gray-100"/g,
        'className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900"'
    );

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
    }
});

console.log(`\n✨ Done! Fixed ${fixedCount} files`);
