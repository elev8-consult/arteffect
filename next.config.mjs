import { withPayload } from "@payloadcms/next/withPayload";

function imageRemotePatterns() {
  /** @type {import('next').NextConfig['images']} */
  const patterns = [
    {
      protocol: "https",
      hostname: "images.unsplash.com"
    }
  ];

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const normalized = /^https?:\/\//i.test(candidate.trim())
        ? candidate.trim()
        : `https://${candidate.trim()}`;
      const url = new URL(normalized);
      if (!patterns.some((pattern) => pattern.hostname === url.hostname)) {
        patterns.push({
          protocol: url.protocol.replace(":", ""),
          hostname: url.hostname
        });
      }
    } catch {
      // Ignore invalid site URL during config load.
    }
  }

  return patterns;
}

const storefrontContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "media-src 'self' blob: https://images.unsplash.com https://cdn.coverr.co",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : [])
].join("; ");

// Payload Admin needs a looser policy for its bundled UI runtime.
const adminContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : [])
].join("; ");

const sharedSecurityHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(self), usb=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : [])
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Content-Security-Policy", value: adminContentSecurityPolicy },
          ...sharedSecurityHeaders
        ]
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: storefrontContentSecurityPolicy },
          ...sharedSecurityHeaders
        ]
      },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      }
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: imageRemotePatterns()
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"]
  }
};

export default withPayload(nextConfig);
