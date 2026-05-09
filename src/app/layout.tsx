import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 작명소",
  description: "AI 작명소",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`antialiased`}>
      <body>{children}</body>
    </html>
  );
}
