"use client";

import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

interface StepProps {
  name: string;
  children: ReactNode;
}

function Step({ children }: StepProps) {
  return <>{children}</>;
}

interface FunnelProps {
  children: ReactNode;
}

export function useFunnel<TStep extends string>(initialStep: TStep) {
  const [currentStep, setCurrentStep] = useState<TStep>(initialStep);

  const Funnel = useMemo(() => {
    function Funnel({ children }: FunnelProps) {
      const steps = Children.toArray(children).filter(
        (child): child is ReactElement<StepProps> =>
          isValidElement(child) && child.type === Step,
      );
      return steps.find((step) => step.props.name === currentStep) ?? null;
    }
    return Funnel;
  }, [currentStep]);

  const next = (step: TStep) => setCurrentStep(step);
  const prev = (step: TStep) => setCurrentStep(step);

  return { Funnel, Step, next, prev, currentStep } as const;
}
