/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/gallery', destination: '/', permanent: false },
      { source: '/feed', destination: '/', permanent: false },
      { source: '/merchandise', destination: '/', permanent: false },
      { source: '/books', destination: '/', permanent: false },
      { source: '/books/:path*', destination: '/', permanent: false },
      { source: '/qrgen', destination: '/', permanent: false },
    ];
  },
  images: {
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
};

export default nextConfig;
