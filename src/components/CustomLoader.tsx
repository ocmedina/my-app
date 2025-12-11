
"use client";

import Image from "next/image";

interface CustomLoaderProps {
    size?: number; // Tamaño en píxeles (default 100)
    text?: string; // Texto opcional debajo del loader
}

export default function CustomLoader({ size = 100, text }: CustomLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div
                className="relative animate-spin-slow"
                style={{ width: size, height: size }}
            >
                <Image
                    src="/Carga.png.png" // Using the double extension as found in file system
                    alt="Cargando..."
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            {text && (
                <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                    {text}
                </p>
            )}

            <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
        </div>
    );
}
