import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gaana Discovery AI – Phase 5",
    template: "%s | Gaana Discovery AI",
  },
  description:
    "AI-powered music discovery platform — graduation demo of Phase 5 multi-source review scraping, AI analysis, and personalized recommendations.",
  keywords: ["Gaana", "music discovery", "AI", "recommendations", "review analysis"],
  authors: [{ name: "Gaana Discovery AI Team" }],
  openGraph: {
    title: "Gaana Discovery AI – Phase 5",
    description: "Graduation demo — AI-powered music discovery with review analysis and recommendations.",
    type: "website",
    locale: "en_IN",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7e22ce" },
    { media: "(prefers-color-scheme: dark)", color: "#581c87" },
  ],
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
