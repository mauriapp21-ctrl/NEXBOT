import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RPA Studio",
    template: "%s · RPA Studio",
  },
  description: "Crea, graba, ejecuta y mantiene bots de automatización web sin programar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" suppressHydrationWarning className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
