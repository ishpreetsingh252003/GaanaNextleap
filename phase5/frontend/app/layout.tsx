import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7e22ce" },
    { media: "(prefers-color-scheme: dark)", color: "#581c87" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Gaana Discovery AI",
    template: "%s | Gaana Discovery AI",
  },
  description:
    "Review-led AI music discovery — analyse public feedback to surface pain points, then generate fresh but relevant Indian music recommendations.",
  keywords: ["Gaana", "music discovery", "AI", "Indian music", "recommendations", "review analysis"],
  authors: [{ name: "Gaana Discovery AI" }],
  openGraph: {
    title: "Gaana Discovery AI",
    description: "Review-led AI music discovery for fresh but relevant Indian music recommendations.",
    type: "website",
    locale: "en_IN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
