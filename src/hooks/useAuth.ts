import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { hasPermission, type Role } from '@/lib/permissions';

const PROFILE_SELECT = 'id, full_name, username, email, role, is_active';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', userId)
        .single();

      return data;
    };

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const profile = await fetchProfile(user.id);
        const roleFromMetadata = user.user_metadata?.role as string | undefined;

        setUser(user);
        setProfile(profile || (roleFromMetadata ? { id: user.id, role: roleFromMetadata } : null));
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          const roleFromMetadata = session.user.user_metadata?.role as string | undefined;

          setUser(session.user);
          setProfile(profile || (roleFromMetadata ? { id: session.user.id, role: roleFromMetadata } : null));
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
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