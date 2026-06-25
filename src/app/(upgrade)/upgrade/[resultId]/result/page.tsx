import ResultPageView from "@/components/result/ResultPageView";

export default async function PremiumResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  void resultId;
  return <ResultPageView />;
}
