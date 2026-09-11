import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CX Systems — Atelier logiciel, Casablanca",
  description:
    "CX Systems conçoit des logiciels sur mesure à Casablanca : web, desktop, data et SaaS. Des systèmes réellement utilisés en production.",
  icons: { icon: "/assets/logo-mark.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
