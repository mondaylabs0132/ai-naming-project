export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ohangFromSurvey, fetchSurveyAndSurname, collectNames,
  generateDetailedReason, toDbRow, toApiShape, toApiShapeFromDb,
} from '../_lib';

// TODO: 임시 차단 코드. 결제 완료 및 요청 소유자 검증을 추가할 때 이 상수와 아래 guard를 제거한다.
const PREMIUM_GENERATION_ENABLED = false;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    // TODO: 임시 차단 guard. 프리미엄 검증 로직 구현 시 이 if 블록을 제거한다.
    if (!PREMIUM_GENERATION_ENABLED) {
      return NextResponse.json(
        { error: '프리미엄 생성은 아직 사용할 수 없습니다.' },
        { status: 403 },
      );
    }

    const { requestId } = await params;
    const supabase = createAdminClient();

    // ── 캐시 확인 ─────────────────────────────────────────────
    const { data: cachedRows } = await supabase
      .from('name_candidates')
      .select('*')
      .eq('request_id', requestId)
      .gt('sort_order', 0)
      .order('sort_order');

    if (cachedRows && cachedRows.length > 0) {
      const { data: surveyRow } = await supabase
        .from('naming_surveys')
        .select('birth_year,birth_month,birth_day,birth_time')
        .eq('request_id', requestId)
        .single();

      const { lacking: ohang, count: ohangCount } = surveyRow
        ? ohangFromSurvey(surveyRow as Parameters<typeof ohangFromSurvey>[0])
        : { lacking: [] as string[], count: { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 } };

      return NextResponse.json({
        requestId,
        ohang,
        ohangCount,
        names: cachedRows.map((r) => toApiShapeFromDb(r as Record<string, unknown>)),
      });
    }

    // ── 설문 + 성씨 로드 ───────────────────────────────────────
    const loaded = await fetchSurveyAndSurname(supabase, requestId);
    if (!loaded) {
      return NextResponse.json({ error: '설문 정보를 찾을 수 없습니다.' }, { status: 404 });
    }
    const { survey, surname } = loaded;
    const { lacking, count: ohangCount } = ohangFromSurvey(survey);

    // 무료 이름 hangul 제외 대상으로 추가
    const { data: freeRow } = await supabase
      .from('name_candidates')
      .select('given_name_hangul')
      .eq('request_id', requestId)
      .eq('sort_order', 0)
      .single();

    const usedNames = new Set<string>(
      freeRow ? [(freeRow as { given_name_hangul: string }).given_name_hangul] : [],
    );

    // ── 이름 생성 ─────────────────────────────────────────────
    const pool = await collectNames({
      supabase, surname, survey, lacking,
      target: 19, maxAttempts: 4, model: 'gpt-4o', usedNames,
    });

    if (pool.length === 0) {
      return NextResponse.json({ error: '이름 생성에 실패했습니다.' }, { status: 500 });
    }

    pool.sort((a, b) => b.score - a.score);
    const top19 = pool.slice(0, 19);

    const { map: detailMap } = await generateDetailedReason(
      top19.map((n) => ({
        hangul: n.hangul, hanja1: n.hanja1, hanja2: n.hanja2,
        meaning1: n.meaning1, meaning2: n.meaning2,
        hangul1: n.hangul1, hangul2: n.hangul2, reason: n.reason,
      })),
      'gpt-4o',
    );

    // ── DB 저장 ───────────────────────────────────────────────
    const { error: insertErr } = await supabase
      .from('name_candidates')
      .insert(
        top19.map((n, i) =>
          toDbRow({
            requestId, sortOrder: i + 1, isFreeName: false,
            surname, name: n, detail: detailMap[n.hangul], lacking,
          }),
        ),
      );

    if (insertErr) {
      console.error('[premium] name_candidates 삽입 실패:', insertErr.message);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({
      requestId,
      ohang: lacking,
      ohangCount,
      names: top19.map((n, i) => toApiShape(n, detailMap[n.hangul], lacking, i + 1)),
    });
  } catch (e) {
    console.error('[/api/naming/[requestId]/premium]', e);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
