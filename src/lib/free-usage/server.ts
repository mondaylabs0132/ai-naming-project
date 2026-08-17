import "server-only";

import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

import { isUuid, VISITOR_ID_COOKIE } from "./visitor";

export type FreeUsageCode = "OK" | "VISITOR_LIMIT" | "IP_LIMIT";
export type FreeUsageResult = { ok: boolean; code: FreeUsageCode };
type FreeUsageIdentity = { visitorId: string; ipHash: string };

async function getVisitorIdAndIpHash(): Promise<FreeUsageIdentity> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieVisitorId = cookieStore.get(VISITOR_ID_COOKIE)?.value;
  const rawIp = headerStore
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const pepper = process.env.FREE_TRIAL_IP_PEPPER!;

  if (!isUuid(cookieVisitorId)) {
    throw new Error("visitor_id cookie is required");
  }

  let normalizedIp = rawIp || "unknown";
  if (normalizedIp.includes(":")) {
    normalizedIp = expandIpv6(normalizedIp).split(":").slice(0, 4).join(":");
  }

  return {
    visitorId: cookieVisitorId,
    ipHash: createHmac("sha256", pepper).update(normalizedIp).digest("hex"),
  };
}

/**
 * IP 제한만 우회할지 여부.
 *
 * 결제 이력이 있는 사용자는 공유 IP(통신사 NAT·회사망) 때문에 남의 사용 이력에
 * 막히면 안 된다. 다만 방문자(visitor_id) 1회 제한은 그대로 적용되므로,
 * 이 우회로 무료 AI가 무제한 열리지는 않는다.
 */
type FreeUsageOptions = { ipLimitBypass?: boolean };

/**
 * p_ip_limit_bypass 인자를 받는 RPC는 마이그레이션
 * `20260816120000_relax_free_usage_ip_limit.sql` 이후에만 존재한다.
 * 배포 순서가 어긋나 함수가 아직 없더라도 무료 생성 자체가 죽으면 안 되므로,
 * 인자 없는 기존 시그니처로 한 번 더 시도한다(= 우회 없이 평소대로 판정).
 */
async function callFreeUsageRpc(
  supabase: SupabaseClient,
  fn: "check_free_usage" | "use_free_usage",
  args: Record<string, unknown>,
  ipLimitBypass: boolean,
): Promise<FreeUsageResult> {
  if (ipLimitBypass) {
    const { data, error } = await supabase.rpc(fn, {
      ...args,
      p_ip_limit_bypass: true,
    });

    if (!error) return normalizeFreeUsageRpcResult(data);

    console.error(
      `[free] ${fn}(p_ip_limit_bypass) 호출 실패 — 우회 없이 재시도합니다:`,
      error,
    );
  }

  const { data, error } = await supabase.rpc(fn, args);

  if (error) throw error;
  return normalizeFreeUsageRpcResult(data);
}

export async function checkFreeUsage(
  supabase: SupabaseClient,
  options: FreeUsageOptions = {},
): Promise<FreeUsageResult> {
  // 개발 환경에서는 무료 사용 제한을 확인하지 않음
  if (process.env.NODE_ENV === "development") {
    return { ok: true, code: "OK" };
  }

  const { visitorId, ipHash } = await getVisitorIdAndIpHash();

  return callFreeUsageRpc(
    supabase,
    "check_free_usage",
    { p_visitor_id: visitorId, p_ip_hash: ipHash },
    options.ipLimitBypass === true,
  );
}

export async function consumeFreeUsage(
  supabase: SupabaseClient,
  params: { requestId: string } & FreeUsageOptions,
): Promise<FreeUsageResult> {
  // 개발 환경에서는 무료 사용 횟수를 차감하지 않음
  if (process.env.NODE_ENV === "development") {
    return { ok: true, code: "OK" };
  }

  const { visitorId, ipHash } = await getVisitorIdAndIpHash();

  return callFreeUsageRpc(
    supabase,
    "use_free_usage",
    {
      p_request_id: params.requestId,
      p_visitor_id: visitorId,
      p_ip_hash: ipHash,
    },
    params.ipLimitBypass === true,
  );
}

export async function setFreeUsageUpgradeEffect(
  supabase: SupabaseClient,
  params: { requestId: string; effect: "PAID" | "REANALYSIS" | "ROLLBACK" },
) {
  // 개발 환경에서는 무료 사용 기록이 없으므로 업그레이드 효과를 반영하지 않음
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const { error } = await supabase.rpc("set_free_usage_upgrade_effect", {
    p_request_id: params.requestId,
    p_effect: params.effect,
  });

  if (error) throw error;
}

export async function rollbackFreeUsage(
  supabase: SupabaseClient,
  params: { requestId: string },
) {
  try {
    await setFreeUsageUpgradeEffect(supabase, {
      requestId: params.requestId,
      effect: "ROLLBACK",
    });
  } catch (rollbackError) {
    console.error("[free] 무료 사용 횟수 복구 실패:", rollbackError);
  }
}

function normalizeFreeUsageRpcResult(data: unknown): FreeUsageResult {
  const row = Array.isArray(data) ? data[0] : data;

  if (!row || typeof row !== "object") {
    return { ok: false, code: "IP_LIMIT" };
  }

  const value = row as { ok?: unknown; code?: unknown };
  const code =
    value.code === "OK" ||
    value.code === "VISITOR_LIMIT" ||
    value.code === "IP_LIMIT"
      ? value.code
      : "IP_LIMIT";

  return { ok: value.ok === true, code };
}

function expandIpv6(value: string): string {
  const [address] = value.split("%", 1);

  if (!address.includes("::")) {
    return address
      .split(":")
      .map((part) => part.padStart(4, "0"))
      .join(":");
  }

  const [left = "", right = ""] = address.split("::");
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const fillCount = Math.max(0, 8 - leftParts.length - rightParts.length);
  const parts = [
    ...leftParts,
    ...Array.from({ length: fillCount }, () => "0"),
    ...rightParts,
  ];

  return parts.map((part) => part.padStart(4, "0")).join(":");
}
