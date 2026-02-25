import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Never advertise the framework version in response headers
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent this page from being embedded in an iframe (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent browsers from MIME-sniffing a response away from the declared content-type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send the origin (no path) as the referrer to cross-origin requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Enable strict XSS protection in older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Disallow permissions that this app doesn't need
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
