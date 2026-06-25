"use client";

import { FormProvider } from "react-hook-form";

import StepAvoid from "./_components/steps/step-avoid";
import StepBirthInfo from "./_components/steps/step-birth-info";
import StepBirthStatus from "./_components/steps/step-birth-status";
import StepLastName from "./_components/steps/step-last-name";
import StepPreferences from "./_components/steps/step-preferences";
import { useFunnel } from "./_hooks/use-funnel";
import { useSurveyForm } from "./_hooks/use-survey-form";

type StepName =
  | "lastName"
  | "birthStatus"
  | "birthInfo"
  | "preferences"
  | "avoid";

export default function NamingNewPage() {
  const { Funnel, Step, next, prev } = useFunnel<StepName>("lastName");
  const methods = useSurveyForm();

  return (
    <FormProvider {...methods}>
      <Funnel>
        <Step name="lastName">
          <StepLastName currentStep={1} onNext={() => next("birthStatus")} />
        </Step>
        <Step name="birthStatus">
          <StepBirthStatus
            currentStep={2}
            onNext={() => next("birthInfo")}
            onPrev={() => prev("lastName")}
          />
        </Step>
        <Step name="birthInfo">
          <StepBirthInfo
            currentStep={3}
            onNext={() => next("preferences")}
            onPrev={() => prev("birthStatus")}
          />
        </Step>
        <Step name="preferences">
          <StepPreferences
            currentStep={4}
            onNext={() => next("avoid")}
            onPrev={() => prev("birthInfo")}
          />
        </Step>
        <Step name="avoid">
          <StepAvoid currentStep={5} onPrev={() => prev("preferences")} />
        </Step>
      </Funnel>
    </FormProvider>
  );
}
