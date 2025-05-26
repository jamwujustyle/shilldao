import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode only in development (preserved from your config)
  reactStrictMode: process.env.NODE_ENV === 'development',

  // Optimized for Docker deployments (preserved from your config)
  output: "standalone",

  // Disable X-Powered-By header (preserved from your config)
  poweredByHeader: false,

  // Environment variables (merged - keeping your explicit approach)
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  },

  // Image optimization (merged - keeping your domains and adding new features)
  images: {
    formats: ["image/avif", "image/webp"], // preserved from your config
    domains: ['shilldao.xyz', 'localhost'], // merged both configs
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shilldao.xyz',
        pathname: '/**',
      },
    ],
    // unoptimized: process.env.NODE_ENV === 'development', // added from proposed
  },

  // Compiler optimizations (preserved from your config)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Package import optimization (preserved from your config)
  transpilePackages: ['@tanstack/react-query', 'wagmi'],

  // Server external packages (preserved from your config)
  serverExternalPackages: [],

  // Production-specific optimizations (added from proposed)
  ...(process.env.NODE_ENV === 'production' && {
    productionBrowserSourceMaps: false,
    compress: true,
  }),

  // Experimental features
  experimental: {
    optimizePackageImports: ['wagmi', 'viem', '@tanstack/react-query'],
    ...(process.env.NODE_ENV === 'production' && {
      optimizeCss: true,
    }),
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    ...(process.env.NODE_ENV === 'development' && {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    }),
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_API_BASE_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // API proxy rewrites for development
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/:path*`, // Added fallback for NEXT_PUBLIC_API_BASE_URL
      },
    ] : [];
  },
};

export default nextConfig;
