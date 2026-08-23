import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, DM_Mono } from "next/font/google";
import "./brand.css";
import "./admin.css";
import { Providers } from "./providers";

// Mismas fuentes que la landing (frontend-v1), mismos CSS vars.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Skipfee · Panel",
  description: "Panel administrativo de Skipfee",
  robots: { index: false, follow: false },
  icons: { icon: "/skipfeeIconMain.png", shortcut: "/skipfeeIconMain.png", apple: "/skipfeeIconMain.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
