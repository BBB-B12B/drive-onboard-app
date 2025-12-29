/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    outputFileTracingExcludes: {
        '*': [
            'better-sqlite3',
            'node_modules/better-sqlite3',
            'drizzle-orm/better-sqlite3',
            '**/._*',
            '**/**/._*',
        ]
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
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false, // Important for AWS SDK v3 in Worker and sqlite
        };

        // NUCLEAR OPTION: Tell webpack that better-sqlite3 does not exist.
        config.resolve.alias = {
            ...config.resolve.alias,
            "better-sqlite3": false,
        };

        return config;
    },
};

export default nextConfig;
