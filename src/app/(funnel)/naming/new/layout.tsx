import { redirect } from "next/navigation";

import { checkFreeUsage } from "@/lib/free-usage/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function NamingNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createAdminClient();
  const usage = await checkFreeUsage(supabase);

  if (!usage.ok) {
    redirect("/free-limit");
  }

  return children;
}
