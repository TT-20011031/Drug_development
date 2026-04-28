"use client";

import { PipelineStep } from "@/lib/types";
import { StepIcon } from "./step-icon";

interface StepCardProps {
  step: PipelineStep;
  isActive: boolean;
  onClick: () => void;
  numeral?: string;
}

export function StepCard({ step, isActive, onClick, numeral }: StepCardProps) {
  const isRunning = step.status === "running";
  const isDone = step.status === "done";
  const isError = step.status === "error";
  const isPending = step.status === "pending";

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 pl-3 pr-3 py-2.5 transition-all duration-200 relative text-left rounded-md
        ${isActive
          ? "bg-ochre/30 shadow-bubble"
          : "hover:bg-qing-pale/50"}
      `}
    >
      {/* Active 3px ochre-dark brush bar */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-ochre-dark rounded-r" />
      )}

      {/* Manuscript numeral */}
      {numeral && (
        <span
          className={`font-serif text-[14px] flex-shrink-0 w-5 leading-none ${
            isRunning ? "text-cinnabar" : isDone ? "text-moss" : isError ? "text-cinnabar" : "text-qing-deep/50"
          }`}
        >
          {numeral}
        </span>
      )}

      {/* Status dot */}
      <span className="flex-shrink-0 relative w-2 flex items-center justify-center">
        {isRunning ? (
          <>
            <span className="block w-2 h-2 rounded-full bg-cinnabar" />
            <span className="absolute inset-0 w-2 h-2 rounded-full bg-cinnabar animate-ink-pulse" />
          </>
        ) : (
          <span
            className={`block w-1.5 h-1.5 rounded-full ${
              isDone ? "bg-moss" : isError ? "bg-cinnabar" : "bg-qing-mist"
            }`}
          />
        )}
      </span>

      {/* Icon */}
      <StepIcon
        name={step.icon}
        className={`w-4 h-4 flex-shrink-0 ${
          isRunning
            ? "text-cinnabar"
            : isDone
            ? "text-moss"
            : isError
            ? "text-cinnabar"
            : "text-ink-faint"
        }`}
      />

      {/* Label */}
      <span
        className={`text-[14px] truncate font-serif ${
          isRunning
            ? "text-ink font-semibold"
            : isDone
            ? "text-ink-soft"
            : isError
            ? "text-cinnabar"
            : "text-ink-faint"
        }`}
      >
        {step.label}
      </span>

      {/* Right indicator */}
      <span className="ml-auto flex-shrink-0">
        {isDone && step.duration !== undefined && (
          <span className="font-mono text-[11px] text-ink-faint tracking-tight">
            {step.duration}s
          </span>
        )}
        {isRunning && (
          <span className="inline-flex gap-0.5 items-center">
            <span
              className="w-1 h-1 bg-cinnabar rounded-full animate-ink-drip"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1 h-1 bg-cinnabar rounded-full animate-ink-drip"
              style={{ animationDelay: "180ms" }}
            />
            <span
              className="w-1 h-1 bg-cinnabar rounded-full animate-ink-drip"
              style={{ animationDelay: "360ms" }}
            />
          </span>
        )}
        {isPending && (
          <span className="font-serif text-[11px] text-ink-faint">待</span>
        )}
      </span>
    </button>
  );
}
