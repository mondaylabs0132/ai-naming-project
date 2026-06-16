import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "이름담다",
  description: "AI와 전문가의 마음을 담아, 평생 부를 특별한 이름을 지어드려요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} antialiased`}>
      <body className="bg-gray-300">
        <div className="max-w-[480px] mx-auto bg-[#F9F7F9] min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  );
}
