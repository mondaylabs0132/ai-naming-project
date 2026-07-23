// Edge Function: premium-email (§8)
// 트리거: naming_requests UPDATE DB Webhook. status가 PREMIUM_RESULT_READY로
// 바뀌는 순간(전환 1회)에만 결과 링크 이메일을 Brevo로 발송한다.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type NamingRequestRow = {
  id: string;
  user_id: string | null;
  status: string;
};

type WebhookPayload = {
  type: string;
  table: string;
  record: NamingRequestRow;
  old_record: NamingRequestRow | null;
  schema: string;
};

const READY = "PREMIUM_RESULT_READY";
const WEBHOOK_SECRET_HEADER = "x-webhook-secret";

function timingSafeEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i] ^ right[i];
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: webhookSecret, error: secretError } = await admin.rpc(
    "get_premium_email_webhook_secret",
  );
  const actualSecret = req.headers.get(WEBHOOK_SECRET_HEADER) ?? "";
  if (
    secretError ||
    typeof webhookSecret !== "string" ||
    !timingSafeEqual(actualSecret, webhookSecret)
  ) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const record = payload.record;
  const oldRecord = payload.old_record;

  // 1. 전환 순간 1회만 진행
  if (!record || record.status !== READY || oldRecord?.status === READY) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  const requestId = record.id;
  const userId = record.user_id;
  if (!userId) {
    return new Response(JSON.stringify({ skipped: "no_user" }), {
      headers: { "content-type": "application/json" },
    });
  }

  // 2. premium_order_id + email 확보
  const { data: order } = await admin
    .from("premium_orders")
    .select("id")
    .eq("request_id", requestId)
    .eq("status", "COMPLETED")
    .maybeSingle();
  if (!order) {
    return new Response(JSON.stringify({ skipped: "no_completed_order" }), {
      headers: { "content-type": "application/json" },
    });
  }

  const { data: user } = await admin
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const email = user?.email;
  if (!email) {
    return new Response(JSON.stringify({ skipped: "no_email" }), {
      headers: { "content-type": "application/json" },
    });
  }

  // 3. premium_email_deliveries INSERT(PENDING) — request_id UNIQUE로 1회성
  const { data: delivery, error: insertErr } = await admin
    .from("premium_email_deliveries")
    .insert({
      request_id: requestId,
      premium_order_id: order.id,
      user_id: userId,
      email,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (insertErr) {
    // 중복 INSERT(23505) = 이미 발송/발송중 → skip (멱등)
    return new Response(JSON.stringify({ skipped: "already_queued" }), {
      headers: { "content-type": "application/json" },
    });
  }

  // 4. Brevo 발송
  const appOrigin = Deno.env.get("APP_ORIGIN")!;
  // 결과 페이지로 바로 연결 (메일 링크).
  const link = `${appOrigin}/upgrade/${requestId}/result`;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": Deno.env.get("BREVO_API_KEY")!,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: Deno.env.get("BREVO_SENDER_EMAIL")!,
          name: Deno.env.get("BREVO_SENDER_NAME")!,
        },
        to: [{ email }],
        subject: "작명 결과가 준비되었어요",
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h1 style="font-size:20px;color:#111;">이름 20개 분석이 완료되었어요 🎉</h1>
            <p style="font-size:14px;color:#555;line-height:1.7;">
              결제해주셔서 감사합니다. 아이에게 어울리는 이름 20개 전체 결과가 준비되었어요.
              아래 버튼을 눌러 확인해보세요.
            </p>
            <a href="${link}"
               style="display:inline-block;margin-top:16px;padding:14px 24px;background:#6C5CE7;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;">
              결과 확인하기
            </a>
            <p style="font-size:12px;color:#999;margin-top:24px;">
              버튼이 동작하지 않으면 아래 주소를 복사해 접속해주세요.<br/>${link}
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      await admin
        .from("premium_email_deliveries")
        .update({
          status: "FAILED",
          failed_at: new Date().toISOString(),
          failure_message: `brevo_${res.status}: ${body.slice(0, 300)}`,
        })
        .eq("id", delivery.id);
      return new Response(JSON.stringify({ ok: false }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const data = (await res.json()) as { messageId?: string };
    await admin
      .from("premium_email_deliveries")
      .update({
        status: "SENT",
        sent_at: new Date().toISOString(),
        provider_message_id: data.messageId ?? null,
      })
      .eq("id", delivery.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    await admin
      .from("premium_email_deliveries")
      .update({
        status: "FAILED",
        failed_at: new Date().toISOString(),
        failure_message: String(e).slice(0, 300),
      })
      .eq("id", delivery.id);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
