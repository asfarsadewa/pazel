/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.recraft.ai',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 