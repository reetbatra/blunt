import type { Metadata } from "next";
import { Archivo_Black, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blunt. The speech coach that roasts you.",
  description:
    "Blunt listens to how you actually talk, tells you exactly what to fix, and makes you say it again until you stop rambling. Join the waitlist for early access.",
  openGraph: {
    title: "Blunt. The speech coach that roasts you.",
    description:
      "An AI speech coach that roasts your rambling, gives you specific fixes, and makes you re-record until you sound sharp.",
    siteName: "Blunt",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blunt. The speech coach that roasts you.",
    description:
      "An AI speech coach that roasts your rambling, gives you specific fixes, and makes you re-record until you sound sharp.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
