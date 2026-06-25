import FunnelFooter from "./funnel-footer";
import type { FunnelStepProps } from "./funnel-footer";
import FunnelHeader from "./funnel-header";
import ProgressBar from "./progress-bar";

export default function FunnelFrame({
  children,
  currentStep,
  onNext,
  onPrev,
}: FunnelStepProps & { children: React.ReactNode }) {
  return (
    <div>
      <FunnelHeader />
      <ProgressBar currentStep={currentStep} />
      <main>{children}</main>
      <FunnelFooter currentStep={currentStep} onNext={onNext} onPrev={onPrev} />
    </div>
  );
}
