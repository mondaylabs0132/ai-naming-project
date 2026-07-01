import { notFound } from "next/navigation";

import GeneratingClient from "./_components/generating-client";

export default async function GeneratingPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  const { requestId } = await searchParams;

  // requestId 없이 진입하면 잘못된 접근이므로 not-found 페이지로 이동
  if (!requestId) {
    notFound();
  }

  return <GeneratingClient requestId={requestId} />;
}
