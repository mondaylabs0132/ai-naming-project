import Link from "next/link";
import { Link2Off } from "lucide-react";

/**
 * 없는 토큰·닫힌 링크·만료된 링크가 모두 여기로 온다.
 * 어느 쪽인지 구분해 알려주지 않는다 — 링크의 존재 여부를 흘리지 않기 위해서다.
 */
export default function ShareNotFound() {
  return (
    <div className="px-5 py-20 flex flex-col items-center text-center">
      <span className="size-14 rounded-full bg-primary-pale flex items-center justify-center">
        <Link2Off size={26} className="text-primary" />
      </span>
      <h1 className="mt-5 font-bold text-ink tracking-[-0.3px] text-[20px]">
        닫힌 링크예요
      </h1>
      <p className="mt-2.5 text-ink-muted text-caption leading-[1.6] break-keep">
        링크가 만료됐거나 공유가 중지됐어요.
        <br />
        보내준 분에게 새 링크를 받아주세요.
      </p>
      <Link
        href="/?ref=share"
        className="mt-7 h-13 px-7 flex items-center justify-center font-semibold text-btn rounded-pill bg-primary text-white shadow-btn"
      >
        우리 아이 이름 지어보기
      </Link>
    </div>
  );
}
