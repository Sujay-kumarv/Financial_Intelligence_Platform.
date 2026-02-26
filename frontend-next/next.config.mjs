/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    let backendUrl = 'http://127.0.0.1:8005/api/v1/:path*';

    if (process.env.NEXT_PUBLIC_API_URL) {
      const apiHost = process.env.NEXT_PUBLIC_API_URL;
      // If it's a full URL already
      if (apiHost.startsWith('http')) {
        backendUrl = `${apiHost}/api/v1/:path*`;
      }
      // If it's an internal Render host (e.g. "backend")
      else if (!apiHost.includes('.')) {
        backendUrl = `http://${apiHost}:8000/api/v1/:path*`;
      }
      // If it's a public Render host (e.g. "backend.onrender.com")
      else {
        backendUrl = `https://${apiHost}/api/v1/:path*`;
      }
    }

    const backendPhotosUrl = backendUrl.replace('/api/v1', '');

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
