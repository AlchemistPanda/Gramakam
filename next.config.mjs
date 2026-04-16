/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply to all routes so the admin page inherits it too
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'bluetooth=*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
