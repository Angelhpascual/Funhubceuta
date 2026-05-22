import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AD Ceuta FanHub",
  description: "La app de los aficionados del AD Ceuta FC",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ceuta FC",
  },
};

export const viewport: Viewport = {
  themeColor: "#D62027",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ceuta FC" />
        <link rel="apple-touch-icon" href="/escudo.png" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
