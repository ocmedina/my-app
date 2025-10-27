import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { hasPermission, type Role } from '@/lib/permissions';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUser(user);
        setProfile(profile);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser(session.user);
          setProfile(profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const can = (permission: keyof typeof import('@/lib/permissions').PERMISSIONS) => {
    return hasPermission(profile?.role, permission);
  };

  return {
    user,
    profile,
    role: profile?.role as Role,
    loading,
    can,
    isAdmin: profile?.role === 'administrador',
  };
}