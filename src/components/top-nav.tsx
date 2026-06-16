export default function TopNav() {
  return (
    <header className="flex items-center h-[52px] px-5 bg-[#F9F7F9]">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/star.png" alt="" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
        <span className="text-[#2D2540] text-[17px] font-bold tracking-[-0.3px]">
          이름담다
        </span>
      </div>
    </header>
  );
}
