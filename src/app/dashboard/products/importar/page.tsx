// src/app/dashboard/products/importar/page.tsx
'use client'

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx'; // Importamos la librería
import { FaUpload, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Link from 'next/link';

// Definimos la estructura esperada de cada fila del Excel
interface ProductExcelRow {
  SKU: string;
  Nombre: string;
  PrecioMinorista: number;
  PrecioMayorista: number;
  Stock: number;
  // Puedes añadir más columnas opcionales aquí (Descripción, Categoría, Marca)
}

export default function ImportProductsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: number; duplicates: number } | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResults(null); // Resetea resultados si se cambia el archivo
      setErrorDetails([]);
    }
  };

  const processImport = useCallback(async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo Excel.');
      return;
    }
    setLoading(true);
    setResults(null);
    setErrorDetails([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Tomamos la primera hoja
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ProductExcelRow>(worksheet);

        if (jsonData.length === 0) {
          toast.error('El archivo Excel está vacío o no tiene el formato correcto.');
          setLoading(false);
          return;
        }

        const productsToInsert: any[] = [];
        const currentErrors: string[] = [];
        let duplicateCount = 0;

        jsonData.forEach((row, index) => {
          // Validación básica
          if (!row.SKU || !row.Nombre || row.PrecioMinorista == null || row.PrecioMayorista == null || row.Stock == null) {
            currentErrors.push(`Fila ${index + 2}: Faltan datos obligatorios (SKU, Nombre, Precios, Stock).`);
            return; // Saltar esta fila
          }
          
          productsToInsert.push({
            sku: String(row.SKU).trim(),
            name: String(row.Nombre).trim(),
            price_minorista: parseFloat(String(row.PrecioMinorista)),
            price_mayorista: parseFloat(String(row.PrecioMayorista)),
            stock: parseInt(String(row.Stock), 10),
            is_active: true // Por defecto, los productos importados están activos
          });
        });

        if (productsToInsert.length > 0) {
          const { error, count } = await supabase
            .from('products')
            .insert(productsToInsert, { 
                // Ignorar filas con SKU duplicado
                // Nota: Esto requiere que la columna SKU tenga una restricción UNIQUE en la DB
                // Si falla, Supabase devolverá un error único que podemos manejar
             }); 
             
          // Manejo de errores de Supabase (más robusto)
          if (error) {
              if (error.message.includes('duplicate key value violates unique constraint')) {
                  // Estimamos cuántos duplicados hubo. No es exacto con `upsert`.
                  // Para un conteo exacto, se necesitaría verificar SKUs antes o procesar el error detallado.
                  toast.error("Algunos productos no se importaron porque su SKU ya existe.");
                  // Aquí no podemos saber exactamente cuántos, asignamos 0 por simplicidad
                  duplicateCount = 0; // O intentar un cálculo aproximado si es necesario
                  setResults({ success: productsToInsert.length - duplicateCount, errors: currentErrors.length, duplicates: duplicateCount });
              } else {
                  throw new Error(error.message); // Otro tipo de error
              }
          } else {
              setResults({ success: productsToInsert.length, errors: currentErrors.length, duplicates: duplicateCount });
          }
        } else {
             setResults({ success: 0, errors: currentErrors.length, duplicates: 0 });
        }
        
        setErrorDetails(currentErrors);
        
      } catch (err: any) {
        console.error("Error al procesar el archivo:", err);
        toast.error(`Error al procesar el archivo: ${err.message}`);
        setResults({ success: 0, errors: jsonData.length, duplicates: 0 });
      } finally {
        setLoading(false);
        setFile(null); // Limpiar el input de archivo
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = ''; // Resetear el input
        router.refresh(); // Refrescar datos en otras partes de la app si es necesario
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file, router]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Importar Productos desde Excel</h1>
        <Link href="/dashboard/products" className="text-blue-600 hover:underline">
          &larr; Volver a Productos
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-3">Instrucciones</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
          Sube un archivo Excel (.xlsx o .csv) con los productos. La primera fila debe contener los encabezados exactos:
        </p>
        <code className="block bg-gray-100 dark:bg-slate-800 p-2 rounded text-sm text-gray-800 dark:text-slate-100 mb-4">
          SKU | Nombre | PrecioMinorista | PrecioMayorista | Stock
        </code>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Las columnas <span className="font-semibold">SKU, Nombre, PrecioMinorista, PrecioMayorista</span> y <span className="font-semibold">Stock</span> son obligatorias. El SKU debe ser único para cada producto.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <label htmlFor="file-upload" className="mb-4 flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-800/80 dark:bg-slate-800">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FaUpload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-slate-400">
              <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo aquí
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">XLSX o CSV</p>
          </div>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .csv"/>
        </label>
        
        {file && <p className="text-sm text-center text-gray-700 dark:text-slate-200 mb-4">Archivo seleccionado: {file.name}</p>}

        <button 
          onClick={processImport} 
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
          {loading ? 'Procesando...' : 'Importar Productos'}
        </button>
      </div>

      {results && (
        <div className={`p-4 rounded-lg shadow-md ${results.errors > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            {results.errors > 0 ? <FaTimesCircle className="text-red-500"/> : <FaCheckCircle className="text-green-500"/>}
            Resultados de la Importación:
          </h3>
          <p className="text-sm">Productos importados exitosamente: <span className="font-bold">{results.success}</span></p>
          <p className="text-sm">Filas con errores (omitidas): <span className="font-bold">{results.errors}</span></p>
          {/* <p className="text-sm">SKUs duplicados (omitidos): <span className="font-bold">{results.duplicates}</span></p> */}
          {errorDetails.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-slate-600">
              <p className="text-xs font-semibold text-red-700">Detalle de errores:</p>
              <ul className="list-disc list-inside text-xs text-red-600 max-h-32 overflow-y-auto">
                {errorDetails.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}