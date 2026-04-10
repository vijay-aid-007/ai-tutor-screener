import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuemath AI Tutor Screener",
  description: "AI-powered tutor screening platform by Cuemath",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="gradient-bg min-h-screen">{children}</body>
    </html>
  );
}