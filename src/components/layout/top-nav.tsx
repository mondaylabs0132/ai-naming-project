export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 flex items-center px-5 bg-[#F9F7F9]/80 backdrop-blur-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="이름담다 로고"
        className="py-3"
        style={{ width: "100px", height: "auto" }}
      />
    </header>
  );
}
