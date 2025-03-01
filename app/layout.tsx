import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeColor = [
  { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor,
};

export const metadata: Metadata = {
  title: "Webcam ASCII - Real-time ASCII Art Converter",
  description:
    "Transform your webcam feed into real-time ASCII art. A creative web application built with Next.js, React, and TypeScript.",
  keywords: [
    "ASCII art",
    "webcam",
    "real-time",
    "Next.js",
    "React",
    "TypeScript",
  ],
  authors: [{ name: "fac3m4n" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: "Webcam ASCII",
    description: "Transform your webcam feed into real-time ASCII art",
    siteName: "Webcam ASCII",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
