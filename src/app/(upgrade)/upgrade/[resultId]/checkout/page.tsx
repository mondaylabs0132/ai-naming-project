import CheckoutClient from "./_components/checkout-client";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ resultId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { resultId } = await params;
  const sp = await searchParams;

  // confirm A-실패 redirect(?error=)와 Toss failUrl redirect(?code=&message=) 둘 다 수용
  const pick = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const initialErrorCode = pick(sp.error) ?? pick(sp.code) ?? null;
  const initialErrorMessage = pick(sp.message) ?? null;

  return (
    <CheckoutClient
      resultId={resultId}
      initialErrorCode={initialErrorCode}
      initialErrorMessage={initialErrorMessage}
    />
  );
}
