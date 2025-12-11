"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type LayoutType = "sidebar" | "navbar";

interface LayoutContextType {
    layout: LayoutType;
    setLayout: (layout: LayoutType) => void;
    isLoading: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [layout, setLayoutState] = useState<LayoutType>("sidebar");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Try to load from localStorage first for immediate render
        const local = localStorage.getItem("frontstock_layout_preference");
        if (local === "sidebar" || local === "navbar") {
            setLayoutState(local);
        }

        // 2. Fetch from Supabase settings (Business Configuration)
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from("settings")
                    .select("value")
                    .eq("key", "layout_style")
                    .maybeSingle();

                if (data && (data.value === "sidebar" || data.value === "navbar")) {
                    setLayoutState(data.value as LayoutType);
                    localStorage.setItem("frontstock_layout_preference", data.value);
                }
            } catch (error) {
                console.error("Error fetching layout settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const setLayout = async (newLayout: LayoutType) => {
        // Optimistic update
        setLayoutState(newLayout);
        localStorage.setItem("frontstock_layout_preference", newLayout);

        // Persist to Supabase
        try {
            await supabase.from("settings").upsert({
                key: "layout_style",
                value: newLayout,
            }, { onConflict: "key" });
        } catch (error) {
            console.error("Error saving layout setting:", error);
        }
    };

    return (
        <LayoutContext.Provider value={{ layout, setLayout, isLoading }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error("useLayout must be used within a LayoutProvider");
    }
    return context;
}
