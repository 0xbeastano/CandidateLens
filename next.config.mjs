/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // For pdfjs-dist / canvas compatibility in browser / server
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
