import { Star, StarHalf } from "lucide-react";

// score를 환산한 별점(0~5, 0.5 단위)을 그리는 목록용 별점.
// 결과 목록과 보관함이 같은 모양을 써야 하므로 한 곳에서만 정의한다.
export default function StarRating({ stars }: { stars: number }) {
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const size = "size-3 min-[376px]:size-[13px] shrink-0";

  return (
    <div
      className="flex items-center gap-[2px] shrink-0"
      aria-label={`5점 만점에 ${stars}점`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className={size} fill="#FFBA00" stroke="none" />
      ))}
      {half && <StarHalf className={size} fill="#FFBA00" stroke="none" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className={size} fill="none" stroke="#FFBA00" />
      ))}
    </div>
  );
}
