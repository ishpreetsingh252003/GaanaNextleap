import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gaana Discovery AI – Phase 2",
  description: "Multi-source review scraper: Google Play, App Store, Reddit, Quora, Web & Twitter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
