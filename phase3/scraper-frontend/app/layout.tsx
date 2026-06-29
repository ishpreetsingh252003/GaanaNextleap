import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gaana Scraper | Review Collection Engine",
  description: "Collect, filter and export Gaana user reviews from 6 live sources with custom date ranges.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
