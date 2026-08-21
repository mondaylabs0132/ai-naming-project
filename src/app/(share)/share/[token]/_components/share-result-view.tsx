import Link from "next/link";
import { Check } from "lucide-react";

import type { ShareCandidate, ShareParticipant } from "@/lib/share/constants";

/**
 * 투표를 마친 뒤 보는 화면.
 *
 * 집계는 투표 후에만 보여준다. 먼저 보이면 앞사람 표에 끌려가서
 * "각자 어떻게 생각하는지"를 묻는 의미가 사라진다.
 */
export default function ShareResultView({
  candidates,
  voterCount,
  participants,
}: {
  candidates: ShareCandidate[];
  voterCount: number;
  participants: ShareParticipant[];
}) {
  // 득표 내림차순, 동점이면 가나다.
  const ranked = [...candidates].sort(
    (a, b) =>
      b.voteCount - a.voteCount || a.fullName.localeCompare(b.fullName, "ko"),
  );
  const topVotes = ranked[0]?.voteCount ?? 0;
  const withComments = participants.filter((p) => p.comment);

  return (
    <div className="px-5 pt-5 pb-10 flex flex-col gap-3.5">
      {/* ── 완료 ── */}
      <div
        className="bg-surface p-5 shadow-card flex items-center gap-3.5"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <span className="size-11 shrink-0 rounded-full bg-primary-pale flex items-center justify-center">
          <Check size={22} strokeWidth={2.5} className="text-primary" />
        </span>
        <div>
          <p className="font-bold text-ink tracking-[-0.3px] text-[17px]">
            투표 고마워요!
          </p>
          <p className="mt-[3px] text-ink-muted text-[12px] leading-[1.5]">
            엄마·아빠에게 바로 전달됐어요
          </p>
        </div>
      </div>

      {/* ── 집계 ── */}
      <div
        className="bg-surface p-5 shadow-card"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <p className="flex items-baseline gap-1.5">
          <span className="font-bold text-primary tracking-[-0.3px] text-stat">
            {voterCount}명
          </span>
          <span className="text-ink-muted text-caption">이 투표했어요</span>
        </p>

        <div className="mt-4 flex flex-col gap-3.5">
          {ranked.map((candidate, index) => {
            const isTop = index === 0 && candidate.voteCount > 0;
            // 1위 기준 상대 길이. 표가 하나도 없으면 전부 빈 막대.
            const ratio =
              topVotes > 0 ? (candidate.voteCount / topVotes) * 100 : 0;

            return (
              <div key={candidate.id} className="flex flex-col gap-[7px]">
                <div className="flex items-center gap-2">
                  {isTop && (
                    <span className="px-2 py-0.5 rounded-pill bg-primary text-white font-bold text-[11px]">
                      1위
                    </span>
                  )}
                  <span
                    className={[
                      "flex-1 min-w-0 truncate",
                      isTop
                        ? "font-bold text-ink text-[16px]"
                        : "font-semibold text-ink text-[15px]",
                    ].join(" ")}
                  >
                    {candidate.fullName}
                  </span>
                  <span
                    className={[
                      "text-[14px] font-semibold shrink-0",
                      isTop ? "text-primary font-bold" : "text-ink-muted",
                    ].join(" ")}
                  >
                    {candidate.voteCount}표
                  </span>
                </div>
                <div className="h-2.5 rounded-pill bg-surface-section overflow-hidden">
                  <div
                    className={[
                      "h-full rounded-pill",
                      isTop ? "bg-primary" : "bg-[var(--color-primary-muted)]",
                    ].join(" ")}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 한마디 ── */}
      {withComments.length > 0 && (
        <div
          className="bg-surface px-5 py-[18px] shadow-card"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="font-semibold text-ink text-caption">남겨준 한마디</p>
          <ul className="mt-3.5 flex flex-col gap-3">
            {withComments.map((participant, index) => (
              <li
                key={index}
                className={
                  index > 0 ? "pt-3 border-t border-divider flex gap-2.5" : "flex gap-2.5"
                }
              >
                <span className="size-[30px] shrink-0 rounded-full bg-primary-pale text-primary font-bold text-[11px] flex items-center justify-center">
                  {participant.label ?? "익명"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-ink text-caption leading-[1.55] break-keep">
                    {participant.comment}
                  </p>
                  {participant.votedNames.length > 0 && (
                    <p className="mt-0.5 text-ink-light text-[11px]">
                      {participant.votedNames.join(" · ")}에 투표
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 전환 ── */}
      <div
        className="bg-primary-pale p-5"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <p className="font-bold text-ink leading-[1.35] tracking-[-0.3px] break-keep text-[18px]">
          이 이름들, 어떻게 지었을까요?
        </p>
        <p className="mt-1.5 text-ink/70 text-[12px] leading-[1.6] break-keep">
          첫지음이 사주·수리·발음까지 분석해 이름 20개를 지어드려요.
        </p>

        <div className="mt-3.5 flex gap-2">
          {[
            { value: "20개", label: "이름 추천" },
            { value: "1분", label: "설문 소요" },
            { value: "무료", label: "첫 이름 1개" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 bg-surface py-3 px-2 flex flex-col items-center gap-1"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <span className="font-bold text-primary text-[18px]">
                {stat.value}
              </span>
              <span className="text-ink-muted text-[10px] text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/?ref=share"
          className="mt-3.5 w-full h-13 flex items-center justify-center font-semibold text-btn rounded-pill bg-primary text-white shadow-btn"
        >
          우리 아이 이름도 지어보기
        </Link>
      </div>
    </div>
  );
}
