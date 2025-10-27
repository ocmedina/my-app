'use client';

import React from 'react';
import { Package, BarChart3, FileText, Settings, ArrowRight } from 'lucide-react';

export default function FrontStockWelcome() {
  const features = [
    {
      title: 'Control de Inventario',
      description: 'Monitorea tu stock en tiempo real con alertas automáticas',
      icon: Package,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Reportes y Análisis',
      description: 'Visualiza tendencias y genera reportes detallados',
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Gestión de Movimientos',
      description: 'Registra entradas, salidas y transferencias fácilmente',
      icon: FileText,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Configuración Flexible',
      description: 'Personaliza el sistema según tus necesidades',
      icon: Settings,
      color: 'from-slate-500 to-slate-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Logo y Bienvenida */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-2xl mb-6">
            <Package className="w-14 h-14 text-blue-600" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">FrontStock</span>
          </h1>
          
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Tu sistema de gestión de inventario inteligente
          </p>
        </div>

        {/* Características del Sistema */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-blue-200">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón Principal */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/login'}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-bold rounded-xl hover:from-blue-600 hover:to-indigo-600 hover:scale-105 hover:shadow-2xl transition-all duration-300"
          >
            Iniciar Sesión
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-blue-300 text-sm">
          <p>© 2025 FrontStock - Sistema de Gestión de Inventario</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}