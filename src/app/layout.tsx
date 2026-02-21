import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "BlazingMQ Management Console",
    template: "%s | BlazingMQ Console",
  },
  description:
    "Professional management UI for monitoring and administering BlazingMQ message brokers, queues, domains, and clusters. Real-time metrics, performance analytics, and comprehensive broker administration.",
  keywords: [
    "BlazingMQ",
    "message queue",
    "broker",
    "admin console",
    "monitoring",
    "management UI",
    "real-time metrics",
    "performance analytics",
    "queue management",
    "domain management",
    "cluster monitoring",
  ],
  authors: [{ name: "Rohan Doshi", url: "https://github.com/RohanDoshi21" }],
  creator: "Rohan Doshi",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/RohanDoshi21/blazingmq-management-console",
    siteName: "BlazingMQ Management Console",
    title: "BlazingMQ Management Console",
    description:
      "Professional management UI for monitoring and administering BlazingMQ message brokers, queues, domains, and clusters. Real-time metrics, performance analytics, and comprehensive broker administration.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BlazingMQ Management Console",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlazingMQ Management Console",
    description:
      "Professional management UI for monitoring and administering BlazingMQ message brokers. Real-time metrics, performance analytics, and comprehensive broker administration.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-slate-950 text-slate-100 antialiased`}
      >
        <div className="flex min-h-screen">
          <ToastProvider>
            <Sidebar />
            <main className="ml-64 flex-1 min-h-screen transition-all duration-300">
              {children}
            </main>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
