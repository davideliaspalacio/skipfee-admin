import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Panel admin: SPA client-rendered detrás de login.
  // En desarrollo NO usamos `output:'export'` (rompe rutas dinámicas y HMR).
  // En la Fase 7 (deploy) se activa: output: "export" → carpeta out/ a Cloudflare.
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
