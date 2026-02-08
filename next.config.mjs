/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // Supabase proje domaini 
      },
    ],
  },
};

export default nextConfig;
