// Edge Function: premium-email (§8)
// 트리거: naming_requests UPDATE DB Webhook.
// status가 아래 둘 중 하나로 바뀌는 순간(전환 1회)에만 Brevo로 메일을 보낸다.
//   PREMIUM_RESULT_READY → 결과 링크 안내
//   FAILED               → 생성 실패 + 환불 안내
// 결제 후 페이지를 떠난 사용자에게 닿을 수단이 메일뿐이라, 실패도 반드시 알린다.
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
const FAILED = "FAILED";
const WEBHOOK_SECRET_HEADER = "x-webhook-secret";

/** premium_email_deliveries.kind — (요청, 종류)당 1통을 보장하는 값. */
const KIND_BY_STATUS: Record<string, string> = {
  [READY]: "RESULT_READY",
  [FAILED]: "GENERATION_FAILED",
};

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
  const kind = record ? KIND_BY_STATUS[record.status] : undefined;
  if (!kind || oldRecord?.status === record.status) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "content-type": "application/json" },
    });
  }
  const isFailure = record.status === FAILED;

  const requestId = record.id;
  const userId = record.user_id;
  if (!userId) {
    return new Response(JSON.stringify({ skipped: "no_user" }), {
      headers: { "content-type": "application/json" },
    });
  }

  // 2. premium_order_id + email 확보
  // 실패 메일은 환불이 끝난 뒤에 도착할 수 있다. 이 함수는 pg_net으로 비동기
  // 호출되므로, 상태를 읽는 시점에 이미 REFUNDED로 바뀌어 있을 수 있다.
  const { data: order } = await admin
    .from("premium_orders")
    .select("id,status,amount")
    .eq("request_id", requestId)
    .in("status", ["COMPLETED", "REFUNDED"])
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
      kind,
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
  // 성공은 결과 페이지로, 실패는 결제 내역으로 보낸다.
  // 실패 건에 결과 링크를 주면 빈 화면만 보게 된다.
  const link = isFailure
    ? `${appOrigin}/mypage/orders`
    : `${appOrigin}/upgrade/${requestId}/result`;

  const refunded = order.status === "REFUNDED";
  // 쿠폰 100% 건은 돌려줄 돈이 없다. "환불했다"고 쓰면 카드 명세서를 뒤지게 된다.
  const refundLine = !refunded
    ? "환불은 순차적으로 처리되며, 처리 후 다시 안내드릴게요."
    : order.amount > 0
      ? "결제하신 금액은 전액 환불 처리했어요. 카드사에 따라 반영까지 영업일 기준 3~5일이 걸릴 수 있어요."
      : "사용하신 쿠폰을 다시 쓰실 수 있도록 돌려드렸어요.";

  const subject = isFailure
    ? "작명 결과 생성에 실패했어요 (환불 안내)"
    : "작명 결과가 준비되었어요";

  const htmlContent = isFailure
    ? `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h1 style="font-size:20px;color:#111;">결과를 만들어 드리지 못했어요</h1>
            <p style="font-size:14px;color:#555;line-height:1.7;">
              여러 번 다시 시도했지만 이름 분석을 끝내지 못했습니다. 기다리게 해서 죄송합니다.<br/>
              ${refundLine}
            </p>
            <a href="${link}"
               style="display:inline-block;margin-top:16px;padding:14px 24px;background:#6C5CE7;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;">
              결제 내역 확인하기
            </a>
            <p style="font-size:12px;color:#999;margin-top:24px;">
              버튼이 동작하지 않으면 아래 주소를 복사해 접속해주세요.<br/>${link}<br/><br/>
              주문번호: ${requestId}
            </p>
          </div>
        `
    : `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h1 style="font-size:20px;color:#111;">이름 분석이 완료되었어요 🎉</h1>
            <p style="font-size:14px;color:#555;line-height:1.7;">
              결제해주셔서 감사합니다. 아이에게 어울리는 이름 전체 결과가 준비되었어요.
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
        `;

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
        subject,
        htmlContent,
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
