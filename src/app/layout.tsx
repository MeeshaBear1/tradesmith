import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// "Cold Steel & Forge Fire" — Archivo (stamped display), Hanken Grotesk (sturdy UI),
// JetBrains Mono (spec/measurement). See BRAND.md + docs/art-direction.md.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["600", "700", "800"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jbMono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Tradesmith — forged for the field",
  description:
    "The trades operating system. Quote it from the truck, get paid before you pack up — AI takeoff, branded proposals, and same-day deposits.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${hanken.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
