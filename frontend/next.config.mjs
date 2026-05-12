/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Wajib untuk deploy statis (drag & drop Netlify): menghasilkan folder `out/`
  output: "export",
};

export default nextConfig;
