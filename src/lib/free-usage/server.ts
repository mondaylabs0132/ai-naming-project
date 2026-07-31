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
  const rawIp = headerStore.get("x-forwarded-for")?.trim().toLowerCase();
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

export async function checkFreeUsage(
  supabase: SupabaseClient,
): Promise<FreeUsageResult> {
  const { visitorId, ipHash } = await getVisitorIdAndIpHash();
  const { data, error } = await supabase.rpc("check_free_usage", {
    p_visitor_id: visitorId,
    p_ip_hash: ipHash,
  });

  if (error) throw error;
  return normalizeFreeUsageRpcResult(data);
}

export async function consumeFreeUsage(
  supabase: SupabaseClient,
  params: { requestId: string },
): Promise<FreeUsageResult> {
  const { visitorId, ipHash } = await getVisitorIdAndIpHash();
  const { data, error } = await supabase.rpc("use_free_usage", {
    p_request_id: params.requestId,
    p_visitor_id: visitorId,
    p_ip_hash: ipHash,
  });

  if (error) throw error;
  return normalizeFreeUsageRpcResult(data);
}

export async function setFreeUsageUpgradeEffect(
  supabase: SupabaseClient,
  params: { requestId: string; effect: "PAID" | "REANALYSIS" | "ROLLBACK" },
) {
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
