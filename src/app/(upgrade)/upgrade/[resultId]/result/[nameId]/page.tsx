import ResultDetailView from "@/components/result/ResultDetailView";

export default async function PremiumNameDetailPage({
  params,
}: {
  params: Promise<{ resultId: string; nameId: string }>;
}) {
  const { resultId, nameId } = await params;
  void resultId;
  void nameId;
  return <ResultDetailView />;
}
