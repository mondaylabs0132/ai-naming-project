export const runtime = "nodejs";
// 이름 후보 수집 + 요약 1건.
//
// 120초로는 부족하다. AI_DEADLINE_MS(150초)는 callAI '호출 하나당' 예산이라
// 이 라우트의 최악값은 150초 × 3회(collectNames 2 + 요약 1) = 450초다.
// 상한에 걸려 프로세스가 죽으면 catch가 실행되지 않아 rollbackFreeUsage가
// 불리지 않고, 사용자는 결과도 못 받은 채 무료 사용 1회를 잃는다.
//
// 그래서 플랫폼 상한인 300초까지 올린다. 다만 450 > 300이라 이것만으로
// 구멍이 완전히 막히지는 않는다. 3번의 AI 호출이 모두 타임아웃까지 가는
// 경우(예: OpenAI 장애)에는 여전히 강제 종료될 수 있다.
// 완전히 막으려면 라우트 전체에 하나의 예산을 걸어 callAI까지 전달해야 한다.
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  consumeFreeUsage,
  rollbackFreeUsage,
} from "@/lib/free-usage/server";
import {
  ohangFromSurvey,
  fetchSurveyAndSurname,
  collectNames,
  generateBriefDetail,
  toDbRowBrief,
  MODEL_NAME_GEN,
} from "../_lib";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  const supabase = createAdminClient();
  let shouldRollbackFreeUsage = false;

  try {
    // ── 캐시 확인 ─────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("name_candidates")
      .select("*")
      .eq("request_id", requestId)
      .eq("sort_order", 0)
      .single();

    if (cached) {
      const { data: surveyRow } = await supabase
        .from("naming_surveys")
        .select("birth_year,birth_month,birth_day,birth_time")
        .eq("request_id", requestId)
        .single();

      const { lacking: ohang, count: ohangCount } = surveyRow
        ? ohangFromSurvey(surveyRow as Parameters<typeof ohangFromSurvey>[0])
        : {
            lacking: [] as string[],
            count: { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 },
          };

      const row = cached as Record<string, unknown>;
      return NextResponse.json({
        requestId,
        ohang,
        ohangCount,
        freeName: {
          hangul:  row.given_name_hangul as string,
          hanja:   row.given_name_hanja  as string,
          hanja1:  row.hanja1            as string,
          hanja2:  row.hanja2            as string,
          score:   row.score             as number,
          summary: row.meaning_summary   as string,
          tags:    (row.tags as string[]) ?? [],
        },
      });
    }

    // ── 설문 + 성씨 로드 ───────────────────────────────────────
    const loaded = await fetchSurveyAndSurname(supabase, requestId);
    if (!loaded) {
      return NextResponse.json(
        { error: "설문 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const { survey, surname } = loaded;
    const { lacking, count: ohangCount } = ohangFromSurvey(survey);

    // 유효한 설문 요청임을 확인한 뒤, GPT 호출 직전에 무료 사용 1회 소비
    const usage = await consumeFreeUsage(supabase, {
      requestId,
    });

    if (!usage.ok) {
      return NextResponse.json(
        {
          code: usage.code,
          error: "무료 이름 추천 횟수를 초과했어요.",
        },
        { status: 429 },
      );
    }

    shouldRollbackFreeUsage = true;

    // ── 이름 생성 ─────────────────────────────────────────────
    const usedNames = new Set<string>();
    const { names: pool, cost: nameCost } = await collectNames({
      supabase,
      surname,
      survey,
      lacking,
      target: 20,
      maxAttempts: 2,
      model: MODEL_NAME_GEN,
      usedNames,
    });

    if (pool.length === 0) {
      shouldRollbackFreeUsage = false;
      await rollbackFreeUsage(supabase, { requestId });

      return NextResponse.json(
        { error: "이름 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    // 정렬 기준은 결과 화면의 순위 계산(score desc, sound_score desc)과 맞춘다.
    pool.sort((a, b) => b.score - a.score || b.soundScore - a.soundScore);
    // 무료 이름은 상위 5개를 피해서 고른다(최고 이름은 유료의 몫).
    //
    // 임계값 70/60은 calcScore의 흉 페널티 도입(-12/-20)에 맞춰 낮춘 값이다.
    // 예전 기준(80/75)을 그대로 두면 흉 있는 이름들이 감점된 뒤라
    // slice(5)에서 기준을 넘는 이름이 드물어지고, 마지막 폴백(pool.find)이
    // 상위 5위 안의 무결점 이름을 무료로 내주게 된다.
    const freeName =
      pool
        .slice(5)
        .find((r) => r.grids.형격.luck === "good" && r.score >= 70) ??
      pool.slice(5).find((r) => r.score >= 60) ??
      pool.find((r) => r.score >= 60) ??
      pool[0];

    const { summary, tags, cost: briefCost } = await generateBriefDetail(
      {
        hangul:   freeName.hangul,
        hanja1:   freeName.hanja1,
        hanja2:   freeName.hanja2,
        meaning1: freeName.meaning1,
        meaning2: freeName.meaning2,
        reason:   freeName.reason,
      },
      { gender: survey.gender },
    );

    // 무료 사용자 수가 원가의 대부분을 차지하므로 건당 실제 비용을 남긴다.
    console.log(
      `[ai-cost] stage=free requestId=${requestId} krw=${(nameCost + briefCost).toFixed(2)} pool=${pool.length}`,
    );

    // ── DB 저장 (summary + tags만, detail은 premium 호출 시 UPDATE) ──
    const { error: insertErr } = await supabase.from("name_candidates").insert(
      toDbRowBrief({
        requestId,
        sortOrder: 0,
        surname,
        name: freeName,
        summary,
        tags,
        lacking,
      }),
    );

    if (insertErr) {
      console.error("[free] name_candidates 삽입 실패:", insertErr.message);
      shouldRollbackFreeUsage = false;
      await rollbackFreeUsage(supabase, { requestId });

      return NextResponse.json({ error: "DB 저장 실패" }, { status: 500 });
    }

    shouldRollbackFreeUsage = false;

    return NextResponse.json({
      requestId,
      ohang: lacking,
      ohangCount,
      freeName: {
        hangul: freeName.hangul,
        hanja:  freeName.hanja,
        hanja1: freeName.hanja1,
        hanja2: freeName.hanja2,
        score:  freeName.score,
        summary,
        tags,
      },
    });
  } catch (e) {
    if (shouldRollbackFreeUsage) {
      await rollbackFreeUsage(supabase, { requestId });
    }

    console.error("[/api/naming/[requestId]/free]", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
