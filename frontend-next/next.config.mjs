/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`
      : 'http://127.0.0.1:8005/api/v1/:path*';

    const backendPhotosUrl = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/uploads/photos/:path*`.replace('/api/v1', '')
      : 'http://127.0.0.1:8005/uploads/photos/:path*';

    return [
      {
        source: '/api/v1/:path*',
        destination: backendUrl,
      },
      {
        source: '/uploads/photos/:path*',
        destination: backendPhotosUrl,
      },
    ];
  },
};

export default nextConfig;
