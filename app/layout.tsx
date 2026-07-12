import type { Metadata } from "next";
import { Archivo_Black, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const siteUrl = new URL("https://bluntapp.reetbatra.com");

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
  metadataBase: siteUrl,
  title: "Blunt. The speech coach that roasts you.",
  description:
    "Blunt listens to how you actually talk, tells you exactly what to fix, and makes you say it again until you stop rambling. Join the waitlist for early access.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Blunt. The speech coach that roasts you.",
    description:
      "An AI speech coach that roasts your rambling, gives you specific fixes, and makes you re-record until you sound sharp.",
    url: siteUrl,
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
      <body className="min-h-full flex flex-col">
        <Script
          async
          src="https://plausible.io/js/pa-JfDyr5448XUo7qBzWv3sF.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};window.plausible.init=window.plausible.init||function(i){window.plausible.o=i||{}};window.plausible.init();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
