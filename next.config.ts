import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

// Content-Security-Policy tuned to the app's third parties (Razorpay checkout,
// Cloudinary/Unsplash images, Google Fonts). Enforced — if a legitimate third party
// is added later it has to be listed here or the browser will block it.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://cdn.pixabay.com",
  "frame-src https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
  "connect-src 'self' https://*.razorpay.com https://api.cloudinary.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // The development server is intentionally reachable through the configured
  // Cloudflare Tunnel. Next blocks its client/HMR resources for forwarded
  // hostnames unless they are explicitly trusted.
  allowedDevOrigins: ["test.sajidbanday.me"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
