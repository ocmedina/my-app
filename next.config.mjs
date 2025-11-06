import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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

export default withPWA({
  dest: "public",     // 📦 genera el service worker en /public
  register: true,     // registra el SW automáticamente
  skipWaiting: true,  // activa la nueva versión sin recargar
  disable: isDev,     // 🚫 desactiva PWA en modo desarrollo
})(nextConfig);
