/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ya lo tenés
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ desactiva chequeos ESLint en build
  },
};

export default nextConfig;
