import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Panel admin: SPA client-rendered detrás de login → export estático a Cloudflare
  // (mismo modelo que la landing). Sin rutas server, sin middleware, sin API routes.
  // `next dev` sigue funcionando normal con esto activado.
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
