import { createBrowserClient } from '@supabase/ssr'

const customFetch = async (url, options) => {
  // Verificamos si es una operación de solo lectura o una recarga de token de auth
  const isAuthRefresh = typeof url === 'string' && url.includes('/auth/v1/token');
  const isReadOnly = !options?.method || options.method === 'GET' || options.method === 'HEAD';

  // Si es una mutación (POST, PATCH, DELETE) que no sea auth, no le ponemos timeout estricto
  // para evitar recargar la página a la mitad de una creación de pedido.
  if (!isReadOnly && !isAuthRefresh) {
    return fetch(url, options);
  }

  // 3 segundos de tolerancia máxima para Supabase. Si tarda más, consideramos la conexión muerta.
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('SUPABASE_FETCH_TIMEOUT')), 3000);
  });

  try {
    return await Promise.race([fetch(url, options), timeoutPromise]);
  } catch (error) {
    if (error.message === 'SUPABASE_FETCH_TIMEOUT') {
      // Si la petición se cuelga por inactividad de Supabase (Tenant Stop),
      // forzamos el reinicio limpio y silencioso de la aplicación completa.
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
    throw error;
  }
};

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      fetch: customFetch,
    },
  }
)