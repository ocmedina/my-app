// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast' // <-- 1. IMPORTA TOASTER

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FrontStock',
  description: 'Sistema de Gestión de Stock y Ventas',
  icons: {
    icon: '/favicon.png',
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <Toaster // <-- 2. AÑADE EL COMPONENTE AQUÍ
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}