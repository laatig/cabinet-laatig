import { Check } from 'lucide-react';

interface StatusTrackerProps {
  steps: string[];
  currentStep: number;
}

export default function StatusTracker({ steps, currentStep }: StatusTrackerProps) {
  return (
    <div className="status-tracker">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        const stepClass = [
          'tracker-step',
          isCompleted ? 'completed' : '',
          isActive ? 'active' : '',
        ].filter(Boolean).join(' ');

        return (
          <div key={idx} className={stepClass}>
            <div className="step-circle">
              {isCompleted ? <Check size={16} /> : idx + 1}
            </div>
            <div className="step-text">{step}</div>
          </div>
        );
      })}
    </div>
  );
}
