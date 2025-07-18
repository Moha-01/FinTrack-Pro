import type {NextConfig} from 'next';

const isFirebaseHosting = process.env.FIREBASE_APP_HOSTING_URL;

const nextConfig: NextConfig = {
  // Set output to 'export' for static sites (like GitHub Pages)
  // but keep it as default for server environments (like Firebase App Hosting)
  output: isFirebaseHosting ? undefined : 'export',
  // basePath is needed for GitHub Pages, but not for Firebase App Hosting
  basePath: isFirebaseHosting ? undefined : (process.env.NODE_ENV === 'production' ? '/FinTrack-Pro' : ''),
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
  env: {
    // This variable helps the app know if it's running in a server environment
    NEXT_PUBLIC_SERVER_CAPABLE: isFirebaseHosting ? 'true' : 'false',
  },
};

export default nextConfig;
