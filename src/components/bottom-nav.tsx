const tabs = [
  {
    label: "추천 이름",
    active: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#7C6FCD">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
    ),
  },
  {
    label: "보관함",
    active: false,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B849E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: "공유 관리",
    active: false,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B849E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "마이페이지",
    active: false,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B849E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 bg-white flex items-center justify-around px-2 z-50"
      style={{ boxShadow: "0px -1px 12px rgba(0,0,0,0.06)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className="flex flex-col items-center gap-1 flex-1 py-2"
        >
          {tab.icon}
          <span
            className="text-[11px] font-medium leading-[1.2]"
            style={{ color: tab.active ? "#7C6FCD" : "#8B849E" }}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
