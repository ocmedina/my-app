import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora errores de ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuración de webpack para manejar @react-pdf/renderer
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalizar @react-pdf/renderer en el servidor
      config.externals = [...(config.externals || []), '@react-pdf/renderer'];
    } else {
      // Configurar alias para el cliente
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
