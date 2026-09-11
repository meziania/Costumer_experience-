/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    outputFileTracingIncludes: {
      "/": ["./prisma/dev.db"],
      "/api/**": ["./prisma/dev.db"],
    },
  },
};

export default nextConfig;
