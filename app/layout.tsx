import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Pyros Vision — Monitoramento de Queimadas",
  description: "Detecção de focos de calor em SP via NASA FIRMS + Roboflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`h-full ${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="h-full">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
    </html>
  );
}
