import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg'],
  // Menghasilkan .next/standalone untuk Docker — image lebih kecil tanpa node_modules penuh
  output: 'standalone',
};

export default nextConfig;
