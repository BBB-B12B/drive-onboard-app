/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    outputFileTracingExcludes: {
        '*': ['better-sqlite3', 'node_modules/better-sqlite3', 'drizzle-orm/better-sqlite3']
    },
    serverExternalPackages: ['better-sqlite3'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.r2.cloudflarestorage.com',
                port: '',
                pathname: '/**',
            }
        ],
    },
};

export default nextConfig;
