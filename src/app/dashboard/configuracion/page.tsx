"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import {
  FaSave, FaUpload, FaStore, FaMapMarkerAlt, FaPhone,
  FaImage, FaCheck, FaLock, FaPalette
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';
import {
  HiOutlineDesktopComputer,
  HiTemplate,
  HiOutlineOfficeBuilding,
  HiOutlinePhotograph,
  HiOutlineColorSwatch
} from 'react-icons/hi';

type Tab = 'general' | 'branding' | 'appearance';

export default function SettingsPage() {
  const router = useRouter();
  const { layout, setLayout } = useLayout();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Logo states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Auth states
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
    setSaving(true);
    const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));

    const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });

    if (error) {
      toast.error(`Error al guardar: ${error.message}`);
    } else {
      toast.success('✓ Configuración guardada exitosamente');
    }
    setSaving(false);
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

  if (checkingAuth || (userRole !== 'administrador' && userRole !== null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 tracking-tight">
            Configuración
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Administra la información, marca y apariencia de tu sistema.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Navegación */}
          <nav className="lg:w-64 flex-shrink-0 space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${activeTab === 'general'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
            >
              <HiOutlineOfficeBuilding className="text-lg flex-shrink-0" />
              General
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${activeTab === 'branding'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
            >
              <HiOutlinePhotograph className="text-lg flex-shrink-0" />
              Marca y Logo
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${activeTab === 'appearance'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
            >
              <HiOutlineDesktopComputer className="text-lg flex-shrink-0" />
              Estilos y Apariencia
            </button>
          </nav>

          {/* Área de Contenido */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-slate-800 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

                {/* Header del Panel */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {activeTab === 'general' && 'Información General'}
                    {activeTab === 'branding' && 'Marca y Logo'}
                    {activeTab === 'appearance' && 'Estilos y Apariencia'}
                  </h2>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FaSave /> Guardar Cambios
                      </>
                    )}
                  </button>
                </div>

                <div className="p-6 lg:p-8">
                  {/* SECCIÓN GENERAL */}
                  {activeTab === 'general' && (
                    <div className="space-y-6 max-w-2xl">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                          Nombre del Negocio
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaStore />
                          </div>
                          <input
                            type="text"
                            value={settings.business_name || ''}
                            onChange={e => handleInputChange('business_name', e.target.value)}
                            placeholder="Ej: Mi Empresa S.A."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                          Dirección
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaMapMarkerAlt />
                          </div>
                          <input
                            type="text"
                            value={settings.business_address || ''}
                            onChange={e => handleInputChange('business_address', e.target.value)}
                            placeholder="Ej: Av. San Martín 1234"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                          Teléfono
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaPhone />
                          </div>
                          <input
                            type="text"
                            value={settings.business_phone || ''}
                            onChange={e => handleInputChange('business_phone', e.target.value)}
                            placeholder="Ej: +54 9 11 1234-5678"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN BRANDING */}
                  {activeTab === 'branding' && (
                    <div className="space-y-8">
                      <div className="flex flex-col sm:flex-row gap-8 items-start">
                        {/* Preview Logo */}
                        <div className="p-1 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 border border-dashed border-gray-300 dark:border-slate-700 flex-shrink-0">
                          <div className="w-40 h-40 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center p-4 relative overflow-hidden group">
                            {previewUrl || settings.logo_url ? (
                              <img
                                src={previewUrl || settings.logo_url}
                                alt="Logo"
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <div className="text-gray-300 dark:text-slate-700 flex flex-col items-center">
                                <FaImage className="text-4xl mb-2" />
                                <span className="text-xs">Sin Logo</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 max-w-md space-y-4">
                          <div className="relative group">
                            <label htmlFor="logo-upload" className="flex items-center justify-center w-full px-4 py-10 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all">
                              <div className="space-y-2 text-center">
                                <FaUpload className="mx-auto h-8 w-8 text-gray-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                                <div className="text-sm text-gray-600 dark:text-slate-300">
                                  <span className="font-semibold text-purple-600 dark:text-purple-400">Clic para subir</span> o arrastra y suelta
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-500">PNG, JPG hasta 5MB</p>
                              </div>
                              <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                            </label>
                          </div>

                          <button
                            onClick={handleLogoUpload}
                            disabled={!logoFile || uploading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {uploading ? 'Subiendo...' : 'Subir y Actualizar Logo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN APARIENCIA */}
                  {activeTab === 'appearance' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => setLayout('sidebar')}
                          className={`relative group p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-4 overflow-hidden
                            ${layout === 'sidebar'
                              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10'
                              : 'border-gray-200 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-800/50'
                            }`}
                        >
                          <div className="flex items-center justify-between w-full z-10">
                            <span className={`text-base font-bold ${layout === 'sidebar' ? 'text-teal-700 dark:text-teal-400' : 'text-gray-900 dark:text-slate-200'}`}>
                              Sidebar Lateral
                            </span>
                            {layout === 'sidebar' && (
                              <div className="h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs">
                                <FaCheck />
                              </div>
                            )}
                          </div>

                          {/* Miniatura Visual CSS */}
                          <div className="flex gap-2 w-full h-32 bg-gray-100 dark:bg-slate-950 rounded-lg p-2 border border-black/5 dark:border-white/5">
                            <div className="w-16 h-full bg-teal-600/20 dark:bg-teal-400/20 rounded border border-teal-600/30 dark:border-teal-400/30 animate-pulse"></div>
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="w-full h-4 bg-gray-200 dark:bg-slate-800 rounded"></div>
                              <div className="flex-1 bg-white dark:bg-slate-900 rounded border border-dashed border-gray-300 dark:border-slate-800"></div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 dark:text-slate-400 z-10">
                            Navegación vertical fija a la izquierda.
                          </p>
                        </button>

                        <button
                          onClick={() => setLayout('navbar')}
                          className={`relative group p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-4 overflow-hidden
                            ${layout === 'navbar'
                              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10'
                              : 'border-gray-200 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-800/50'
                            }`}
                        >
                          <div className="flex items-center justify-between w-full z-10">
                            <span className={`text-base font-bold ${layout === 'navbar' ? 'text-teal-700 dark:text-teal-400' : 'text-gray-900 dark:text-slate-200'}`}>
                              Navbar Superior
                            </span>
                            {layout === 'navbar' && (
                              <div className="h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs">
                                <FaCheck />
                              </div>
                            )}
                          </div>

                          {/* Miniatura Visual CSS */}
                          <div className="flex flex-col gap-2 w-full h-32 bg-gray-100 dark:bg-slate-950 rounded-lg p-2 border border-black/5 dark:border-white/5">
                            <div className="w-full h-8 bg-teal-600/20 dark:bg-teal-400/20 rounded border border-teal-600/30 dark:border-teal-400/30 animate-pulse"></div>
                            <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded border border-dashed border-gray-300 dark:border-slate-800"></div>
                          </div>

                          <p className="text-sm text-gray-500 dark:text-slate-400 z-10">
                            Barra superior horizontal compacta.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}