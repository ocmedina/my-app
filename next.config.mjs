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
};

export default withPWA({
  dest: "public",     // 📦 genera el service worker en /public
  register: true,     // registra el SW automáticamente
  skipWaiting: true,  // activa la nueva versión sin recargar
  disable: isDev,     // 🚫 desactiva PWA en modo desarrollo
})(nextConfig);
