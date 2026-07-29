import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TopNav from "@/components/layout/top-nav";
import BottomNav from "@/components/layout/bottom-nav";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

const hakgyoansimChilpanjiugae = localFont({
  src: "../fonts/HakgyoansimChilpanjiugae.otf",
  variable: "--font-hakgyoansim-chilpanjiugae",
  display: "swap",
});

export const metadata: Metadata = {
  title: "첫지음",
  description: "태어난 아이의 소중한 첫 번째 선물을 드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${hakgyoansimChilpanjiugae.variable} antialiased`}
    >
      <body className="bg-gray-300">
        <div className="max-w-150 mx-auto bg-[#F9F7F9] min-h-screen relative">
          <TopNav />
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
