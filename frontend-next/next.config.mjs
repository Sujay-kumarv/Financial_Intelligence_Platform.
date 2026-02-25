/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`
      : 'http://127.0.0.1:8005/api/v1/:path*';

    return [
      {
        source: '/api/v1/:path*',
        destination: backendUrl,
      },
    ];
  },
};

export default nextConfig;
