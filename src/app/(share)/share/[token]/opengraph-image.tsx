import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getShareNameCount } from "@/lib/share/public";

export const alt = "어떤 이름이 제일 잘 어울릴까요? | 첫지음";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 공유 링크의 미리보기 이미지.
 *
 * **이름을 싣지 않는다.** 카카오톡·트위터 같은 곳은 미리보기 이미지를 자기
 * CDN에 캐시하고, 그 주소는 토큰과 무관하게 남는다. 링크를 닫아도 회수할 수
 * 없는 자리라 개수만 보여준다.
 *
 * 폰트는 Pretendard를 필요한 글자만 남겨 정적 TTF로 잘라 뒀다(assets/og).
 * satori는 woff2도 가변 폰트도 읽지 못해서 프로젝트의
 * PretendardVariable.woff2를 그대로 쓸 수 없다 — 한글이 전부 두부(□)가 된다.
 *
 * ⚠ 아래 문구를 고치면 scripts/subset-og-font.py의 TEXT도 같이 고치고 폰트를
 *   다시 뽑아야 한다. 서브셋에 없는 글자는 에러 없이 사라지고, 로컬에서는
 *   시스템 폰트가 대신 그려줘서 눈치채기 어렵다.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [regular, bold, nameCount] = await Promise.all([
    readFile(join(process.cwd(), "assets/og/pretendard-og-400.ttf")),
    readFile(join(process.cwd(), "assets/og/pretendard-og-800.ttf")),
    // 닫힌 링크·없는 토큰이면 null. 그래도 미리보기는 떠야 하므로 개수만 뺀다.
    getShareNameCount(token).catch(() => null),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 56,
          background: "linear-gradient(135deg, #EAE7F8 0%, #F9F7F9 60%)",
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 72px",
            background: "#FFFFFF",
            borderRadius: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "10px 22px",
                borderRadius: 9999,
                background: "#EAE7F8",
                color: "#7C6FCD",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              첫지음
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "column",
                color: "#2D2540",
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: -2,
              }}
            >
              <span>어떤 이름이</span>
              <span>제일 잘 어울릴까요?</span>
            </div>

            <div
              style={{
                marginTop: 26,
                display: "flex",
                flexDirection: "column",
                color: "#8B849E",
                fontSize: 28,
                lineHeight: 1.5,
              }}
            >
              <span>엄마·아빠가 고른 아기 이름 후보 중에서</span>
              <span>마음에 드는 이름을 골라주세요</span>
            </div>
          </div>

          {nameCount !== null && nameCount > 0 && (
            <div
              style={{
                width: 260,
                height: 260,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                background: "#EAE7F8",
              }}
            >
              <span
                style={{
                  color: "#7C6FCD",
                  fontSize: 110,
                  fontWeight: 800,
                  letterSpacing: -3,
                }}
              >
                {nameCount}
              </span>
              <span style={{ marginTop: 4, color: "#7C6FCD", fontSize: 30 }}>
                개의 이름
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: regular, style: "normal", weight: 400 },
        { name: "Pretendard", data: bold, style: "normal", weight: 800 },
      ],
    },
  );
}
