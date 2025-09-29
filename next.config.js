/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [{ source: '/t', destination: '/api/uid-redirect' }];
  },
};
module.exports = nextConfig;
