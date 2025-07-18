import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export', // Entfernt für serverseitiges Hosting auf Firebase App Hosting
  // basePath: process.env.NODE_ENV === 'production' ? '/FinTrack-Pro' : '', // Nicht mehr benötigt für Firebase App Hosting
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
