export default async function UpgradeEmailPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  return <div />;
}
