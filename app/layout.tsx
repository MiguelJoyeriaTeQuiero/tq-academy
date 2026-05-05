import type { Metadata, Viewport } from "next";
import { Montserrat, Lato } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Cuerpo — Lato (pesos disponibles: 300, 400, 700)
const lato = Lato({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "700"],
  display: "swap",
});

// Titulares y display — Montserrat
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TQ Academy · Te Quiero",
  description:
    "Plataforma de formación de Te Quiero — Reivindicando el valor de lo accesible desde 1988.",
};

export const viewport: Viewport = {
  themeColor: "#00557F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${lato.variable} ${montserrat.variable}`}
    >
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
