export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function fail(status: number, code: string) {
  return NextResponse.json({ ok: false, code }, { status });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return fail(401, "unauthorized");
  }

  const admin = createAdminClient();

  const { error: rpcError } = await admin.rpc("delete_account_data", {
    p_user_id: user.id,
  });

  if (rpcError) {
    console.error("Account data deletion failed:", {
      message: rpcError.message,
      code: rpcError.code,
    });

    return fail(500, "delete_failed");
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id, true);

  if (authError) {
    console.error("Auth user soft deletion failed:", {
      message: authError.message,
      status: authError.status,
      name: authError.name,
      code: authError.code,
    });

    return fail(500, "delete_failed");
  }

  return NextResponse.json({ ok: true });
}
