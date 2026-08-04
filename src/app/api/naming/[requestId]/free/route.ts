export const runtime = "nodejs";

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
    const pool = await collectNames({
      supabase,
      surname,
      survey,
      lacking,
      target: 20,
      maxAttempts: 2,
      model: "gpt-4o",
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

    pool.sort((a, b) => b.score - a.score);
    const freeName =
      pool
        .slice(5)
        .find((r) => r.grids.형격.luck === "good" && r.score >= 80) ??
      pool.slice(5).find((r) => r.score >= 75) ??
      pool.find((r) => r.score >= 75) ??
      pool[0];

    const { summary, tags } = await generateBriefDetail(
      {
        hangul:   freeName.hangul,
        hanja1:   freeName.hanja1,
        hanja2:   freeName.hanja2,
        meaning1: freeName.meaning1,
        meaning2: freeName.meaning2,
        reason:   freeName.reason,
      },
      "gpt-4o",
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
