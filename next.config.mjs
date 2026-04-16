/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.CI !== "true",
  },
  turbopack: {},
  reactStrictMode: true,
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
