import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        unoptimized: true, // Required for static export on GitHub Pages
    },
    assetPrefix: isProd ? '/FCS_app/' : '',
    basePath: isProd ? '/FCS_app' : '',
    output: 'export',
};

export default nextConfig;
