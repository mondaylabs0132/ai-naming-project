export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ohangFromSurvey, fetchSurveyAndSurname, collectNames,
  generateDetailedReason, toDbRow, toApiShape, toApiShapeFromDb,
} from '../_lib';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await params;
    const supabase = createAdminClient();

    // ── 캐시 확인 ─────────────────────────────────────────────
    const { data: cached } = await supabase
      .from('name_candidates')
      .select('*')
      .eq('request_id', requestId)
      .eq('sort_order', 0)
      .single();

    if (cached) {
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
        freeName: toApiShapeFromDb(cached as Record<string, unknown>),
      });
    }

    // ── 설문 + 성씨 로드 ───────────────────────────────────────
    const loaded = await fetchSurveyAndSurname(supabase, requestId);
    if (!loaded) {
      return NextResponse.json({ error: '설문 정보를 찾을 수 없습니다.' }, { status: 404 });
    }
    const { survey, surname } = loaded;
    const { lacking, count: ohangCount } = ohangFromSurvey(survey);

    // ── 이름 생성 ─────────────────────────────────────────────
    const usedNames = new Set<string>();
    const pool = await collectNames({
      supabase, surname, survey, lacking,
      target: 20, maxAttempts: 2, model: 'gpt-4o', usedNames,
    });

    if (pool.length === 0) {
      return NextResponse.json({ error: '이름 생성에 실패했습니다.' }, { status: 500 });
    }

    pool.sort((a, b) => b.score - a.score);
    const freeName =
      pool.slice(5).find((r) => r.grids.형격.luck === 'good' && r.score >= 80) ??
      pool.slice(5).find((r) => r.score >= 75) ??
      pool.find((r) => r.score >= 75) ??
      pool[0];

    const { map: detailMap } = await generateDetailedReason(
      [{ hangul: freeName.hangul, hanja1: freeName.hanja1, hanja2: freeName.hanja2,
         meaning1: freeName.meaning1, meaning2: freeName.meaning2,
         hangul1: freeName.hangul1, hangul2: freeName.hangul2, reason: freeName.reason }],
      'gpt-4o',
    );

    // ── DB 저장 ───────────────────────────────────────────────
    const { error: insertErr } = await supabase
      .from('name_candidates')
      .insert(toDbRow({
        requestId, sortOrder: 0, isFreeName: true,
        surname, name: freeName, detail: detailMap[freeName.hangul], lacking,
      }));

    if (insertErr) {
      console.error('[free] name_candidates 삽입 실패:', insertErr.message);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({
      requestId,
      ohang: lacking,
      ohangCount,
      freeName: toApiShape(freeName, detailMap[freeName.hangul], lacking, 0),
    });
  } catch (e) {
    console.error('[/api/naming/[requestId]/free]', e);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
