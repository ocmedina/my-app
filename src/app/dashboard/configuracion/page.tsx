// src/app/dashboard/configuracion/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { FaSave, FaUpload, FaStore, FaMapMarkerAlt, FaPhone, FaImage, FaCheck, FaLock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      setCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const role = profile?.role || 'vendedor';
      setUserRole(role);

      if (role !== 'administrador') {
        toast.error('No tienes permisos para acceder a esta página');
        router.push('/dashboard');
        return;
      }

      setCheckingAuth(false);
      fetchSettings();
    };

    checkUserRole();
  }, [router]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('settings').select('*');
    if (data) {
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as { [key: string]: string });
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
    
    const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });

    if (error) {
      toast.error(`Error al guardar: ${error.message}`);
    } else {
      toast.success('✓ Configuración guardada exitosamente');
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setLogoFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploading(true);

    const fileName = `logo-${Date.now()}`;
    const { data, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, logoFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      toast.error(`Error al subir el logo: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);
      
    if (publicUrlData?.publicUrl) {
      handleInputChange('logo_url', publicUrlData.publicUrl);
      toast.success('✓ Logo subido. ¡No olvides guardar!');
    } else {
      toast.error('No se pudo obtener la URL pública del logo.');
    }
    setUploading(false);
    setLogoFile(null);
    setPreviewUrl(null);
  };

  // Mientras verifica autenticación y permisos
  if (checkingAuth || (userRole !== 'administrador' && userRole !== null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Mientras carga la configuración
  if (loading && !Object.keys(settings).length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración del Negocio</h1>
          <p className="text-gray-600">Administra la información y apariencia de tu negocio</p>
        </div>

        <div className="grid gap-6">
          {/* Información General */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaStore className="text-lg" />
                Información General
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaStore className="text-blue-600" />
                  Nombre del Negocio
                </label>
                <input 
                  type="text" 
                  value={settings.business_name || ''}
                  onChange={e => handleInputChange('business_name', e.target.value)}
                  placeholder="Ej: Mi Empresa S.A."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-600" />
                  Dirección
                </label>
                <input 
                  type="text" 
                  value={settings.business_address || ''}
                  onChange={e => handleInputChange('business_address', e.target.value)}
                  placeholder="Ej: Av. San Martín 1234"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaPhone className="text-blue-600" />
                  Teléfono
                </label>
                <input 
                  type="text" 
                  value={settings.business_phone || ''}
                  onChange={e => handleInputChange('business_phone', e.target.value)}
                  placeholder="Ej: +54 261 123-4567"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Logo del Negocio */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaImage className="text-lg" />
                Logo del Negocio
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Vista previa del logo actual */}
                <div className="flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Logo Actual</p>
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {settings.logo_url ? (
                      <img 
                        src={settings.logo_url} 
                        alt="Logo actual" 
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <FaImage className="text-3xl mx-auto mb-2" />
                        <p className="text-xs">Sin logo</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vista previa del nuevo logo */}
                {previewUrl && (
                  <div className="flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Vista Previa</p>
                    <div className="w-32 h-32 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center bg-purple-50">
                      <img 
                        src={previewUrl} 
                        alt="Vista previa" 
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    </div>
                  </div>
                )}

                {/* Selector de archivo y botón de subida */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Seleccionar Nuevo Logo</p>
                  <div className="space-y-3">
                    <label className="block">
                      <span className="sr-only">Elegir archivo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer"
                      />
                    </label>
                    
                    <button 
                      onClick={handleLogoUpload} 
                      disabled={!logoFile || uploading}
                      className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <FaUpload />
                          Subir Logo
                        </>
                      )}
                    </button>

                    {settings.logo_url && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-medium mb-1">URL actual:</p>
                        <p className="text-xs text-gray-700 break-all">{settings.logo_url}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="sticky bottom-4">
            <button 
              onClick={handleSaveSettings} 
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FaCheck className="text-xl" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}