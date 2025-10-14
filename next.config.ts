import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora errores de ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Opciones adicionales que tengas
};

export default nextConfig;
