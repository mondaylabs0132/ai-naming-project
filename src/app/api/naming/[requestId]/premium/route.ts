export const runtime = "nodejs";
// 이름 19개 수집 + 해설 20건 생성은 실측 1~2분이 걸린다.
// 명시하지 않으면 플랫폼 기본값에 맡겨지고, 상한에 걸려 죽으면
// 아무 흔적 없이 PREMIUM_GENERATING에 고착된다.
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { failAndRefund } from "@/lib/payments/refund";
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
  TARGET_NAMES,
  MIN_DELIVERABLE_NAMES,
  type RichName,
} from "../_lib";

// 살아 있다는 신호를 찍는 주기.
//
// 리퍼가 "이 건이 멈췄는지"를 판단하는 근거는 generation_started_at 하나뿐이라,
// 예전에는 정상 생성(1~2분)과 겹치지 않도록 정체 판정을 5분이나 뒤로 미뤄야 했다.
// 생성 도중 주기적으로 이 값을 갱신하면 "진행 중"과 "죽음"이 구분되므로,
// 리퍼는 90초만 조용해도 죽은 것으로 보고 곧장 회수에 들어갈 수 있다.
const HEARTBEAT_INTERVAL_MS = 30_000;

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
  // catch에서도 요청 id가 필요하므로 try 밖에서 푼다.
  const { requestId } = await params;
  const supabase = createAdminClient();

  // finally에서 반드시 멈춰야 한다. 남겨 두면 요청이 끝난 뒤에도 하트비트가
  // 계속 찍혀, 죽은 건을 리퍼가 영영 살아 있다고 오해한다.
  let stopHeartbeat: (() => void) | null = null;

  try {

    // 공개 API의 무단 생성 호출을 막기 위한 게이트.
    // 내부 자동 생성은 secret 헤더로, 사용자 재시도는 세션+주문 소유권으로 검증한다
    const isInternal = isInternalGenerationRequest(req);

    let userId: string | null = null;
    if (!isInternal) {
      // 시크릿이 아예 설정돼 있지 않으면 내부 호출을 인정할 방법이 없다.
      // 이 경우 서버가 보낸 트리거도 세션 검사로 떨어지는데, 서버 간 fetch에는
      // 쿠키가 없어 무조건 실패한다. 이걸 "요청 없음"으로 위장하면 원인을
      // 영영 못 찾으므로, 설정 오류로 분명히 드러낸다.
      if (!internalJobSecret) {
        console.error(
          "[premium] INTERNAL_JOB_SECRET(또는 WEBHOOK_SECRET)이 설정되지 않아 내부 호출을 인증할 수 없습니다.",
        );
        return NextResponse.json(
          { error: "internal_secret_not_configured" },
          { status: 500 },
        );
      }

      const authClient = await createServerClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      // 로그인하지 않은 호출. 404로 감추면 호출자가 "요청이 없다"로 오해한다.
      if (!user) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

    // 최종 실패로 확정하고 즉시 환불한다.
    //
    // 여기까지 왔다는 것은 내부 재시도(AI 호출 3회 · 이름 수집 4라운드 ·
    // 해설 누락분 개별 재시도)를 모두 쓰고도 안 됐다는 뜻이다. 예전에는 사유만
    // 적어 두고 리퍼에 넘겼는데, 그러면 같은 실패를 5분 간격으로 세 번 더
    // 반복하는 20분 동안 사용자는 진행률 게이지만 보고 있어야 했다.
    // 판정을 내릴 수 있었다는 것 자체가 프로세스가 살아 있었다는 뜻이므로
    // 이 자리에서 끝낸다. 상태가 FAILED로 바뀌는 순간 화면 폴링(2초)이
    // 곧바로 실패·환불 안내로 넘어간다.
    const finalizeFailure = async (reason: string) => {
      stopHeartbeat?.();
      stopHeartbeat = null;
      const result = await failAndRefund(supabase, requestId, reason);
      return result.ok ? result.refunded : false;
    };

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

    // ── 생성 시작 표시 ─────────────────────────────────────────
    // generation_started_at은 리퍼(reap_stuck_generations)가 "이 건이 멈췄는지"를
    // 판단하는 유일한 근거다. 긴 작업 전에 반드시 찍어야 한다.
    //
    // status를 PREMIUM_GENERATING으로 되돌리는 것이 사용자 재시도 버튼도 고친다.
    // 이전에는 FAILED인 채로 생성만 시작해, 실패 화면의 폴링이 다음 tick에서
    // 다시 FAILED를 읽고 곧바로 실패 화면으로 튕겼다.
    await supabase
      .from("naming_requests")
      .update({
        status: "PREMIUM_GENERATING",
        generation_started_at: new Date().toISOString(),
        generation_failure_reason: null,
      })
      .eq("id", requestId)
      .in("status", ["PREMIUM_GENERATING", "FAILED"]);

    // 여기서부터가 긴 구간(이름 수집 + 해설 생성)이다. 살아 있다는 신호를
    // 주기적으로 찍어 리퍼가 정상 진행 중인 건을 회수하지 않게 한다.
    // 상태 조건을 거는 이유: 실패가 확정된 뒤 늦게 도착한 하트비트가
    // FAILED 행의 시각을 되살리면 안 되기 때문이다.
    {
      const timer = setInterval(() => {
        void supabase
          .from("naming_requests")
          .update({ generation_started_at: new Date().toISOString() })
          .eq("id", requestId)
          .eq("status", "PREMIUM_GENERATING")
          .then(({ error }) => {
            if (error) {
              console.warn(
                `[premium] 하트비트 갱신 실패 requestId=${requestId}: ${error.message}`,
              );
            }
          });
      }, HEARTBEAT_INTERVAL_MS);
      // 이 타이머 때문에 함수 인스턴스가 붙잡히지 않도록 한다.
      timer.unref?.();
      stopHeartbeat = () => clearInterval(timer);
    }

    // ── 설문 + 성씨 로드 ───────────────────────────────────────
    const loaded = await fetchSurveyAndSurname(supabase, requestId);
    if (!loaded) {
      // 결제는 됐는데 이름을 만들 근거가 없다. 몇 번을 다시 돌려도 결과가
      // 같으므로 기다릴 이유가 없다.
      const refunded = await finalizeFailure("설문 정보를 찾을 수 없습니다.");
      return NextResponse.json(
        { error: "설문 정보를 찾을 수 없습니다.", refunded },
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

    // ── 유료 이름 생성 (무료 1개를 뺀 나머지) ──────────────────
    //
    // 무료 결과 없이 곧바로 결제한 요청(무료 횟수 소진 → 바로 유료 전환)은
    // 채워야 할 이름이 하나 더 많다. TARGET_NAMES - 1로 고정하면 19개만
    // 만들어져 "요청당 20개" 규칙이 깨진다.
    const premiumTarget = freeRichName ? TARGET_NAMES - 1 : TARGET_NAMES;
    // 무료 이름이 없으면 유료 이름이 sort_order 0부터 채워진다.
    // name_candidates에는 CHECK (is_free_visible = (sort_order = 0)) 제약이
    // 있으므로, 0번 행만 is_free_visible = true여야 INSERT가 통과한다.
    const sortOrderOffset = freeRichName ? 1 : 0;

    const { names: pool, cost: nameCost } = await collectNames({
      supabase,
      surname,
      survey,
      lacking,
      target: premiumTarget,
      maxAttempts: 4,
      model: MODEL_NAME_GEN,
      usedNames,
    });

    // 정렬 기준은 결과 화면의 순위 계산(score desc, sound_score desc)과 맞춘다.
    // score만으로 자르면 동점 경계에서 화면 순위와 저장 순서가 어긋날 수 있다.
    pool.sort((a, b) => b.score - a.score || b.soundScore - a.soundScore);
    const premiumNames = pool.slice(0, premiumTarget);
    const totalNames = premiumNames.length + (freeRichName ? 1 : 0);

    // 점수 미달·독음 불일치 후보를 걸러내면 목표치를 못 채울 수 있다.
    // 몇 개 모자란 정도는 그대로 제공하되(결제 화면에 고지), 하한 미만이면
    // 상품이라 부를 수 없으므로 실패로 본다.
    //
    // 후보 부족은 AI 무작위성 탓이라 재시도로 살아나기도 한다. 다만 그 재시도는
    // 바로 위 collectNames가 이미 4라운드나 돌린 뒤다. 같은 일을 5분 간격으로
    // 세 번 더 반복하는 대신 여기서 끝내고 환불한다.
    if (totalNames < MIN_DELIVERABLE_NAMES) {
      const reason = `이름 부족: ${totalNames}개 (하한 ${MIN_DELIVERABLE_NAMES})`;
      console.error(`[premium] ${reason} requestId=${requestId}`);
      const refunded = await finalizeFailure(reason);
      return NextResponse.json(
        { error: "이름 생성에 실패했습니다.", refunded },
        { status: 500 },
      );
    }

    // ── 무료(1) + 유료(나머지) 일괄 detail 생성 ────────────────
    const allForDetail = [...(freeRichName ? [freeRichName] : []), ...premiumNames];
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
      premiumNames.map((n, i) =>
        toDbRow({
          requestId,
          sortOrder: i + sortOrderOffset,
          isFreeName: !freeRichName && i === 0,
          surname,
          name: n,
          detail: detailMap[n.hangul],
          lacking,
        }),
      ),
    );

    if (insertErr) {
      console.error("[premium] name_candidates 삽입 실패:", insertErr.message);
      // 제약 위반 같은 결정적 오류가 대부분이라 재시도해도 같은 자리에서 막힌다.
      const refunded = await finalizeFailure(`DB 저장 실패: ${insertErr.message}`);
      return NextResponse.json({ error: "DB 저장 실패", refunded }, { status: 500 });
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
    // 여기까지 예외가 올라왔다는 것은 callAI의 자체 재시도(3회 + 지수 백오프)로도
    // 못 넘긴 오류라는 뜻이다. 확정하고 환불한다.
    //
    // 환불 자체가 실패하면(토스 장애 등) 상태만 FAILED로 남는데, 그 건은 리퍼의
    // 환불 재시도 패스가 다시 주워 온다.
    const reason = e instanceof Error ? e.message : String(e);
    let refunded = false;
    try {
      const result = await failAndRefund(supabase, requestId, reason);
      refunded = result.ok ? result.refunded : false;
    } catch (refundError) {
      // 환불 처리 자체가 던진 경우. 원래 오류를 삼키지 않도록 따로 남긴다.
      console.error(
        `[premium] 실패 확정 중 오류 requestId=${requestId}:`,
        refundError,
      );
    }

    return NextResponse.json(
      { error: "서버 오류가 발생했습니다.", refunded },
      { status: 500 },
    );
  } finally {
    stopHeartbeat?.();
  }
}
