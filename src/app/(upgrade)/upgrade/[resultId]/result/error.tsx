"use client";

import ResultErrorView from "@/components/result/ResultErrorView";

export default function PremiumResultError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ResultErrorView {...props} />;
}
