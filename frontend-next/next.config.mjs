/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    let backendUrl = 'http://127.0.0.1:8005/api/v1/:path*';

    if (process.env.NEXT_PUBLIC_API_URL) {
      const apiHost = process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (apiHost.includes('.') && !apiHost.includes('localhost') && !apiHost.includes('127.0.0.1')) {
        backendUrl = `https://${apiHost}/api/v1/:path*`;
      } else {
        // If it already has a port, use it. Otherwise default to 8005.
        const portSuffix = apiHost.includes(':') ? '' : ':8005';
        backendUrl = `http://${apiHost}${portSuffix}/api/v1/:path*`;
      }
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
