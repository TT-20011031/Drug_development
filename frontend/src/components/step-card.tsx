"use client";

import { PipelineStep } from "@/lib/types";
import { StepIcon } from "./step-icon";

interface StepCardProps {
  step: PipelineStep;
  isActive: boolean;
  onClick: () => void;
}

export function StepCard({ step, isActive, onClick }: StepCardProps) {
  const dotColor = {
    pending: "bg-gray-300",
    running: "bg-green-500",
    done: "bg-green-500",
    error: "bg-red-500",
  }[step.status];

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive ? "bg-green-50 border border-green-200" : "hover:bg-gray-50 border border-transparent"}
        cursor-pointer
      `}
    >
      {/* Status dot */}
      <span className="flex-shrink-0 relative">
        <span className={`block w-2.5 h-2.5 rounded-full ${dotColor}`} />
        {step.status === "running" && (
          <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-50" />
        )}
      </span>

      {/* Icon + Label */}
      <StepIcon name={step.icon} className={`w-4 h-4 flex-shrink-0 ${step.status === "done" ? "text-green-600" : step.status === "running" ? "text-green-600" : "text-gray-400"}`} />
      <span className={`text-sm font-medium truncate ${step.status === "done" ? "text-gray-700" : step.status === "running" ? "text-green-700" : "text-gray-400"}`}>
        {step.label}
      </span>

      {/* Duration or running indicator */}
      <span className="ml-auto flex-shrink-0">
        {step.status === "done" && step.duration !== undefined && (
          <span className="text-xs text-gray-400">{step.duration}s</span>
        )}
        {step.status === "running" && (
          <span className="flex gap-0.5">
            <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </span>
    </button>
  );
}
