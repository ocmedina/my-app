'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Package, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.224-11.28-7.661l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083L43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 7.585l6.19 5.238C44.434 36.338 48 29.832 48 24c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState('sign-in')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.')
      setEmail('')
      setPassword('')
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      toast.error('Credenciales inválidas. Por favor, intenta de nuevo.')
      setLoading(false)
      return
    }

    if (signInData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', signInData.user.id)
        .single();
      
      if (profile?.role === 'repartidor') {
        router.push('/reparto');
      } else {
        router.push('/dashboard');
      }
    }
    // No ponemos setLoading(false) aquí para que el usuario no vea un parpadeo antes de la redirección.
  }

  const handleOAuthSignIn = async (provider: 'google') => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if(error){
      toast.error('No se pudo iniciar sesión con Google.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-2xl mb-4">
            <Package className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {view === 'sign-in' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h1>
          <p className="text-blue-200">
            {view === 'sign-in' ? 'Ingresa a FrontStock' : 'Únete a FrontStock'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={view === 'sign-in' ? handleSignIn : handleSignUp} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"/>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {view === 'sign-in' && (
              <div className="text-right">
                <button type="button" className="text-sm text-blue-300 hover:text-white transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg">
              {loading ? (<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>) : (<> {view === 'sign-in' ? 'Iniciar Sesión' : 'Crear Cuenta'} <ArrowRight className="w-5 h-5" /></>)}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-transparent text-blue-200">O continúa con</span></div>
          </div>

          <button onClick={() => handleOAuthSignIn('google')} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-white/20 transition-all hover:shadow-lg disabled:opacity-50">
            <GoogleIcon /> Continuar con Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              {view === 'sign-in' ? (<>¿No tienes cuenta?{' '}<button onClick={() => { setView('sign-up'); }} className="font-semibold text-white hover:underline">Regístrate</button></>) : (<>¿Ya tienes cuenta?{' '}<button onClick={() => { setView('sign-in'); }} className="font-semibold text-white hover:underline">Inicia Sesión</button></>)}
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-blue-300 text-sm">© 2025 FrontStock. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}