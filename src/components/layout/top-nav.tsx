"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/mypage"];

export default function TopNav() {
  const pathname = usePathname();

  const isHidden =
    HIDDEN_PATHS.includes(pathname) ||
    pathname.includes("/result") ||
    pathname.startsWith("/mypage/results");
  if (isHidden) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center px-5 bg-[#F9F7F9]/80 backdrop-blur-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo.png"
        alt="이름담다 로고"
        className="py-3"
        style={{ width: "100px", height: "auto" }}
      />
    </header>
  );
}
