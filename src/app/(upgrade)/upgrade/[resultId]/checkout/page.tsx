import CheckoutClient from "./_components/checkout-client";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  return <CheckoutClient resultId={resultId} />;
}
