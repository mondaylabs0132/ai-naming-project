"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    label: "추천 이름",
    href: "/",
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#7C6FCD">
        <path d="M12 3 C12.4 3 12.7 3.3 12.9 3.7 L14.8 8.9 C15 9.4 15.4 9.7 15.9 9.8 L21.4 10.4 C22.2 10.5 22.5 11.5 21.9 12 L17.8 15.7 C17.4 16.1 17.2 16.6 17.4 17.1 L18.7 22.4 C18.9 23.2 18 23.8 17.3 23.3 L12.5 20.4 C12.2 20.2 11.8 20.2 11.5 20.4 L6.7 23.3 C6 23.8 5.1 23.2 5.3 22.4 L6.6 17.1 C6.8 16.6 6.6 16.1 6.2 15.7 L2.1 12 C1.5 11.5 1.8 10.5 2.6 10.4 L8.1 9.8 C8.6 9.7 9 9.4 9.2 8.9 L11.1 3.7 C11.3 3.3 11.6 3 12 3Z" />
      </svg>
    ),
    inactiveIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B849E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 C12.4 3 12.7 3.3 12.9 3.7 L14.8 8.9 C15 9.4 15.4 9.7 15.9 9.8 L21.4 10.4 C22.2 10.5 22.5 11.5 21.9 12 L17.8 15.7 C17.4 16.1 17.2 16.6 17.4 17.1 L18.7 22.4 C18.9 23.2 18 23.8 17.3 23.3 L12.5 20.4 C12.2 20.2 11.8 20.2 11.5 20.4 L6.7 23.3 C6 23.8 5.1 23.2 5.3 22.4 L6.6 17.1 C6.8 16.6 6.6 16.1 6.2 15.7 L2.1 12 C1.5 11.5 1.8 10.5 2.6 10.4 L8.1 9.8 C8.6 9.7 9 9.4 9.2 8.9 L11.1 3.7 C11.3 3.3 11.6 3 12 3Z" />
      </svg>
    ),
  },
  {
    label: "보관함",
    href: "/bookmarks",
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#7C6FCD" stroke="#7C6FCD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    inactiveIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B849E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: "공유 관리",
    href: "/share",
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C6FCD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    inactiveIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B849E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "마이페이지",
    href: "/mypage",
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#7C6FCD" stroke="#7C6FCD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    inactiveIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B849E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const HIDDEN_PATH_PREFIXES = ["/naming", "/results", "/upgrade", "/login"];

export default function BottomNav() {
  const pathname = usePathname();

  const isHidden =
    HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.includes("/result/") ||
    pathname.endsWith("/detail");
  if (isHidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-16 bg-white flex items-center justify-around px-2 z-50"
      style={{ boxShadow: "0px -1px 12px rgba(0,0,0,0.06)" }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex flex-col items-center gap-1 flex-1 py-2"
          >
            {isActive ? tab.activeIcon : tab.inactiveIcon}
            <span
              className="text-[11px] font-medium leading-[1.2]"
              style={{ color: isActive ? "#7C6FCD" : "#8B849E" }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
