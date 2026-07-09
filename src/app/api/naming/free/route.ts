import {
  surveySchema,
  type ValidSurveyData,
} from "@/app/(funnel)/naming/new/_lib/schema";
import { mapSurveyToRow } from "@/app/(funnel)/naming/new/_lib/survey-mapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsedSurvey = surveySchema.safeParse(getSurveyData(body));

  if (!parsedSurvey.success) {
    return Response.json(
      { error: "입력값을 다시 확인해주세요." },
      { status: 400 },
    );
  }

  // 로그인 상태면 새 결과를 처음부터 본인 소유로 귀속 → 이후 재-OTP 불필요
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const supabase = createAdminClient();
  const { data: requestRow, error: requestError } = await supabase
    .from("naming_requests")
    .insert({ status: "FREE_ACTIVE", user_id: user?.id ?? null })
    .select("id")
    .single();

  if (requestError || !requestRow) {
    return Response.json(
      { error: "작명 요청을 저장하지 못했어요." },
      { status: 500 },
    );
  }

  const requestId = requestRow.id as string;
  const surveyRow = mapSurveyToRow(
    parsedSurvey.data as ValidSurveyData,
    requestId,
  );
  const { error: surveyError } = await supabase
    .from("naming_surveys")
    .insert(surveyRow);

  if (surveyError) {
    await supabase.from("naming_requests").delete().eq("id", requestId);

    return Response.json(
      { error: "설문을 저장하지 못했어요." },
      { status: 500 },
    );
  }

  return Response.json({ requestId }, { status: 201 });
}

function getSurveyData(body: unknown) {
  if (!body || typeof body !== "object" || !("surveyData" in body)) {
    return undefined;
  }

  return body.surveyData;
}
