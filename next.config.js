/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [{ source: '/t', destination: '/api/uid-redirect' }];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "worker-src 'self' blob: https://*.plaid.com",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.plaid.com https://www.gstatic.com/recaptcha/ https://www.google.com/recaptcha/ https://cdn.getpinwheel.com https://maps.googleapis.com",
              "frame-src 'self' https://*.plaid.com",
              "connect-src 'self' https://*.plaid.com https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
