"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { supabase } from "@/lib/supabaseClient";

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__?: QueryClient;
  }
}

type ReactQueryProviderProps = {
  children: React.ReactNode;
};

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Evita tormenta de re-fetches al volver la pestaña
        refetchOnReconnect: false,   // Evita re-fetch al reconectar (manejado por useResumeRefresh)
        retry: 1,                    // Solo 1 reintento en vez de 3
        staleTime: 30_000,           // 30s de cache para reducir requests innecesarios
      },
    },
  }));

  useEffect(() => {
    window.__TANSTACK_QUERY_CLIENT__ = queryClient;
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" ? <DevtoolsProbe /> : null}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}

function DevtoolsProbe() {
  useQuery({
    queryKey: ["devtools", "probe"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id").limit(1);
      if (error) throw error;
      return data ?? [];
    },
  });

  return null;
}
