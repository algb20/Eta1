/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> deploys as a plain static site (Netlify + Pi Browser).
  // All data access happens client-side (Supabase) or via Supabase Edge
  // Functions, so no Next.js server runtime is required.
  output: "export",
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
