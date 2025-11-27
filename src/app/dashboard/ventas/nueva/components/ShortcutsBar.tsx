"use client";

import { FaKeyboard } from "react-icons/fa";

export default function ShortcutsBar() {
  const shortcuts = [
    {
      key: "F9",
      label: "Nueva Venta",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      key: "F10",
      label: "Buscar Producto",
      color: "bg-purple-100 text-purple-700 border-purple-200",
    },
    {
      key: "F12",
      label: "Cobrar",
      color: "bg-green-100 text-green-700 border-green-200",
    },
    {
      key: "F8",
      label: "Cerrar Venta",
      color: "bg-red-100 text-red-700 border-red-200",
    },
    {
      key: "Esc",
      label: "Cancelar",
      color: "bg-gray-100 text-gray-700 border-gray-200",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] py-2 px-4 z-40 hidden md:block">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
          <FaKeyboard className="text-lg" />
          <span>Atajos de teclado</span>
        </div>
        <div className="flex items-center gap-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center gap-2">
              <kbd
                className={`px-2 py-1 rounded border text-xs font-bold font-mono shadow-sm ${shortcut.color}`}
              >
                {shortcut.key}
              </kbd>
              <span className="text-xs text-gray-600 font-medium">
                {shortcut.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
