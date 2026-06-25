const TOTAL_STEPS = 5;

type StepNumber = 1 | 2 | 3 | 4 | 5;

type ProgressBarProps = {
  currentStep?: StepNumber;
};

export default function ProgressBar({ currentStep = 1 }: ProgressBarProps) {
  return (
    <section
      aria-label={`진행 단계 ${currentStep} / ${TOTAL_STEPS}`}
      className="bg-bg px-11 py-7"
    >
      <p className="mb-5 text-stat font-semibold leading-none tracking-normal">
        <span className="text-primary">{currentStep}</span>
        <span className="text-ink-light"> / {TOTAL_STEPS}</span>
      </p>

      <div
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))`,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: TOTAL_STEPS }, (_, index) => {
          const isActive = index < currentStep;

          return (
            <div
              key={index}
              className={[
                "h-1.5 rounded-pill",
                isActive ? "bg-primary" : "bg-primary-pale",
              ].join(" ")}
            />
          );
        })}
      </div>
    </section>
  );
}
