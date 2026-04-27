"use client";

import { PipelineStep } from "@/lib/types";
import { StepCard } from "./step-card";

interface PipelinePanelProps {
  steps: PipelineStep[];
  activeStepId: string;
  onStepClick: (stepId: string) => void;
}

export function PipelinePanel({ steps, activeStepId, onStepClick }: PipelinePanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          执行进度
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="relative animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-11 w-0.5 h-3 bg-gray-100" />
            )}
            <StepCard
              step={step}
              isActive={activeStepId === step.id}
              onClick={() => onStepClick(step.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
