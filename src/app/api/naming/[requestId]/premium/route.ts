export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  ohangFromSurvey,
  fetchSurveyAndSurname,
  collectNames,
  generateDetailedReason,
  buildDetailedExplanation,
  buildDetailBody,
  toDbRow,
  toApiShape,
  toApiShapeFromDb,
  MODEL_NAME_GEN,
  type RichName,
} from "../_lib";

// 유료 생성 API 요청이 서버 내부 호출인지 검증할 때 읽는 커스텀 헤더 이름.
const INTERNAL_JOB_SECRET_HEADER = "x-internal-job-secret";
const internalJobSecret =
  process.env.INTERNAL_JOB_SECRET ?? process.env.WEBHOOK_SECRET;

function isInternalGenerationRequest(req: NextRequest) {
  const actual = req.headers.get(INTERNAL_JOB_SECRET_HEADER);

  return Boolean(internalJobSecret && actual && actual === internalJobSecret);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await params;
    const supabase = createAdminClient();

    // 공개 API의 무단 생성 호출을 막기 위한 게이트.
    // 내부 자동 생성은 secret 헤더로, 사용자 재시도는 세션+주문 소유권으로 검증한다
    const isInternal = isInternalGenerationRequest(req);

    let userId: string | null = null;
    if (!isInternal) {
      const authClient = await createServerClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      userId = user.id;
    }

    // ── 결제 검증: 내부 호출은 완료 주문만, 브라우저 재시도는 완료 주문 + 소유자까지 확인 ──
    const { data: paidOrder } = await supabase
      .from("premium_orders")
      .select("id,user_id")
      .eq("request_id", requestId)
      .eq("status", "COMPLETED")
      .maybeSingle();
    if (!paidOrder) {
      return NextResponse.json({ error: "payment_required" }, { status: 403 });
    }
    // 브라우저 호출은 내부 secret이 없으므로 결제한 본인인지 주문 소유권을 확인한다.
    if (userId && paidOrder.user_id !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // 유료 결과 생성 완료 시 status를 RESULT_READY로 전이 → 이메일 DB Webhook 발동.
    // 재시도 도중 GENERATING 유지 + 최종 FAILED 착지는 호출자(complete.ts)가 담당.
    const markResultReady = () =>
      supabase
        .from("naming_requests")
        .update({ status: "PREMIUM_RESULT_READY" })
        .eq("id", requestId)
        .in("status", ["PREMIUM_GENERATING", "FAILED"]);

    // ── 캐시 확인 (sort_order >= 0, 무료 이름 포함) ──────────────
    const { data: cachedRows } = await supabase
      .from("name_candidates")
      .select("*")
      .eq("request_id", requestId)
      .gte("sort_order", 0)
      .order("sort_order");

    // sort_order > 0 인 유료 이름이 이미 저장돼 있으면 캐시 반환
    if (cachedRows && cachedRows.some((r) => (r as Record<string, unknown>).sort_order as number > 0)) {
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

      await markResultReady();
      return NextResponse.json({
        requestId,
        ohang,
        ohangCount,
        names: cachedRows.map((r) =>
          toApiShapeFromDb(r as Record<string, unknown>),
        ),
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

    // ── 무료 이름 DB에서 로드 (usedNames 제외 + detail 생성용) ──
    const { data: freeRow } = await supabase
      .from("name_candidates")
      .select("*")
      .eq("request_id", requestId)
      .eq("sort_order", 0)
      .single();

    const freeHangul = freeRow ? (freeRow as Record<string, unknown>).given_name_hangul as string : null;
    const usedNames = new Set<string>(freeHangul ? [freeHangul] : []);

    // freeRow 데이터로 RichName 재구성 (detail 생성에 필요)
    const freeRichName: RichName | null = freeRow
      ? {
          hangul:         (freeRow as Record<string, unknown>).given_name_hangul   as string,
          hanja:          (freeRow as Record<string, unknown>).given_name_hanja    as string,
          hanja1:         (freeRow as Record<string, unknown>).hanja1              as string,
          hanja2:         (freeRow as Record<string, unknown>).hanja2              as string,
          hangul1:        (freeRow as Record<string, unknown>).hangul1             as string,
          hangul2:        (freeRow as Record<string, unknown>).hangul2             as string,
          meaning1:       ((freeRow as Record<string, unknown>).meaning1           as string[]) ?? [],
          meaning2:       ((freeRow as Record<string, unknown>).meaning2           as string[]) ?? [],
          reason:         (freeRow as Record<string, unknown>).meaning_summary     as string,
          score:          (freeRow as Record<string, unknown>).score               as number,
          grids:          (freeRow as Record<string, unknown>).grids               as RichName['grids'],
          ohang1:         (freeRow as Record<string, unknown>).ohang1              as string,
          ohang2:         (freeRow as Record<string, unknown>).ohang2              as string,
          soundScore:     (freeRow as Record<string, unknown>).sound_score         as number,
          soundOhangList: ((freeRow as Record<string, unknown>).sound_ohang_list   as string[]) ?? [],
          soundDetails:   ((freeRow as Record<string, unknown>).sound_details      as string[]) ?? [],
        }
      : null;

    // ── 유료 이름 19개 생성 ────────────────────────────────────
    const { names: pool, cost: nameCost } = await collectNames({
      supabase,
      surname,
      survey,
      lacking,
      target: 19,
      maxAttempts: 4,
      model: MODEL_NAME_GEN,
      usedNames,
    });

    if (pool.length === 0) {
      return NextResponse.json(
        { error: "이름 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    pool.sort((a, b) => b.score - a.score);
    const top19 = pool.slice(0, 19);

    // ── 무료(1) + 유료(19) = 20개 일괄 detail 생성 ────────────
    const allForDetail = [...(freeRichName ? [freeRichName] : []), ...top19];
    // 오행·사격·발음오행·부족 기운을 그대로 넘겨, AI가 이 값들을 추측하지 않도록 한다.
    const { map: detailMap, cost: detailCost } = await generateDetailedReason(
      allForDetail,
      { surname, lacking },
    );

    console.log(
      `[ai-cost] stage=premium requestId=${requestId} krw=${(nameCost + detailCost).toFixed(2)} names=${allForDetail.length}`,
    );

    // ── DB: 무료 이름 행 UPDATE + 유료 이름 INSERT ─────────────
    if (freeRichName) {
      const freeDetail = detailMap[freeRichName.hangul];
      await supabase
        .from("name_candidates")
        .update({
          meaning_summary:      freeDetail?.summary ?? freeRichName.reason,
          detailed_explanation: buildDetailedExplanation(freeRichName, freeDetail),
          detail_body:          buildDetailBody(freeRichName, freeDetail),
          tags:       freeDetail?.tags       ?? [],
          categories: freeDetail?.categories ?? [],
        })
        .eq("request_id", requestId)
        .eq("sort_order", 0);
    }

    const { error: insertErr } = await supabase.from("name_candidates").insert(
      top19.map((n, i) =>
        toDbRow({
          requestId,
          sortOrder: i + 1,
          isFreeName: false,
          surname,
          name: n,
          detail: detailMap[n.hangul],
          lacking,
        }),
      ),
    );

    if (insertErr) {
      console.error("[premium] name_candidates 삽입 실패:", insertErr.message);
      return NextResponse.json({ error: "DB 저장 실패" }, { status: 500 });
    }

    await markResultReady();
    return NextResponse.json({
      requestId,
      ohang: lacking,
      ohangCount,
      names: allForDetail.map((n, i) =>
        toApiShape(n, detailMap[n.hangul], lacking, i),
      ),
    });
  } catch (e) {
    console.error("[/api/naming/[requestId]/premium]", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
