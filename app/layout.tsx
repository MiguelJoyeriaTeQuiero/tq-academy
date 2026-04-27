import type { Metadata, Viewport } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Cuerpo y nombre marca — oficial del manual Te Quiero
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Display serif — alternativa libre a "Zodiak" del manual.
// Fraunces es variable (opsz, soft) y comparte el carácter cálido del manual.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TQ Academy · Te Quiero",
  description:
    "Plataforma de formación de Te Quiero — Reivindicando el valor de lo accesible desde 1988.",
};

export const viewport: Viewport = {
  themeColor: "#00557F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${fraunces.variable}`}
    >
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
