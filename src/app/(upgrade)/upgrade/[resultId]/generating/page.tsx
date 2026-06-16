export default async function PremiumGeneratingPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  return <div />;
}
