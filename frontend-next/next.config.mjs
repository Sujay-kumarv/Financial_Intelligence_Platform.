/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    let backendUrl = 'https://backend-469a.onrender.com/api/v1/:path*';

    if (process.env.NEXT_PUBLIC_API_URL) {
      const apiHost = process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
      backendUrl = (apiHost.includes('.') || apiHost.includes('onrender.com'))
        ? `https://${apiHost}/api/v1/:path*`
        : `http://${apiHost}:8000/api/v1/:path*`;
    }

    const backendPhotosUrl = backendUrl.replace('/api/v1/:path*', '');

    return [
      {
        source: '/api/v1/:path*',
        destination: backendUrl,
      },
      {
        source: '/uploads/photos/:path*',
        destination: `${backendPhotosUrl}/uploads/photos/:path*`,
      },
    ];
  },
};

export default nextConfig;
