/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    outputFileTracing: false, // Required for OpenNext build stability
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
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        // Force fs to false even for server if running in Edge-like environment (OpenNext)
        // Check if this breaks Node-based build steps. OpenNext uses 'edge' or 'worker' runtime.
        // For purely client-side or edge-compatible bundles:
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false, // Important for AWS SDK v3 in Worker
        };
        return config;
    },
};

export default nextConfig;
