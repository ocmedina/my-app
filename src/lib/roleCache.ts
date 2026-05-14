import { supabase } from "@/lib/supabaseClient";

type RoleCache = {
  userId: string;
  role: string;
  timestamp: number;
};

const ROLE_CACHE_KEY = "frontstock_role_cache";
const ROLE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readCachedRole(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as RoleCache;
    if (!cached || cached.userId !== userId) return null;
    if (Date.now() - cached.timestamp > ROLE_CACHE_TTL_MS) return null;
    return cached.role || null;
  } catch {
    return null;
  }
}

export function cacheUserRole(userId: string, role: string) {
  if (typeof window === "undefined") return;
  try {
    const payload: RoleCache = { userId, role, timestamp: Date.now() };
    window.localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write errors
  }
}

export async function getCachedUserRole(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userId = user.id;
  const cached = readCachedRole(userId);
  if (cached) return cached;

  const roleFromMetadata = user.user_metadata?.role as string | undefined;
  if (roleFromMetadata) {
    cacheUserRole(userId, roleFromMetadata);
    return roleFromMetadata;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role) {
    cacheUserRole(userId, profile.role);
    return profile.role as string;
  }

  return null;
}
