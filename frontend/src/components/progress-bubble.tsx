"use client";

import { AlertCircle, FileText, Pause } from "lucide-react";
import { PipelineStep } from "@/lib/types";

interface ProgressBubbleProps {
  steps: PipelineStep[];
  onEnterReport: () => void;
  onStepClick: (stepId: string) => void;
  onPause?: () => void;
}

const NUMERALS = ["壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖", "拾"];

export function ProgressBubble({
  steps,
  onEnterReport,
  onStepClick,
  onPause,
}: ProgressBubbleProps) {
  const visibleSteps = steps.filter(
    (s) =>
      s.id !== "router" &&
      (s.status === "running" || s.status === "done" || s.status === "error")
  );

  const totalDone = visibleSteps.filter((s) => s.status === "done").length;
  const totalSteps = visibleSteps.length;

  return (
    <div className="flex justify-start animate-ink-bleed">
      <div className="seal-ring w-9 h-9 bg-cinnabar flex items-center justify-center flex-shrink-0 mt-1 mr-3">
        <span className="font-serif text-bone text-[13px] leading-none">寿</span>
      </div>
      <div className="max-w-[80%] bg-paper-warm border border-ochre/20 rounded-2xl rounded-tl-sm shadow-bubble px-5 py-4 relative">
        {/* Subtle cinnabar accent strip */}
        <span className="absolute left-0 top-3 bottom-3 w-[2px] bg-cinnabar/30 rounded-r" />

        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-ochre/15">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-[15px] text-ink tracking-[0.08em]">
              报告生成中
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-cinnabar rounded-full animate-ink-pulse" />
              <span className="w-1.5 h-1.5 bg-cinnabar/60 rounded-full animate-ink-pulse" style={{ animationDelay: "200ms" }} />
              <span className="w-1.5 h-1.5 bg-cinnabar/40 rounded-full animate-ink-pulse" style={{ animationDelay: "400ms" }} />
            </span>
          </div>
          <span className="font-mono text-[11px] text-qing-deep tracking-tight">
            {totalDone.toString().padStart(2, "0")}/{totalSteps.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="space-y-0.5">
          {visibleSteps.map((step, idx) => {
            const isRunning = step.status === "running";
            const isDone = step.status === "done";
            const isError = step.status === "error";
            const numeral = NUMERALS[idx] ?? `${idx + 1}`;
            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className="w-full flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-paper-light/60 transition-colors text-left group"
              >
                {/* Numeral */}
                <span
                  className={`font-serif text-[14px] flex-shrink-0 w-5 ${
                    isRunning ? "text-cinnabar" : isDone ? "text-moss" : isError ? "text-cinnabar" : "text-ink-faint"
                  }`}
                >
                  {numeral}
                </span>

                {/* Status indicator */}
                <span className="w-3 flex items-center justify-center flex-shrink-0">
                  {isDone && (
                    <span className="block w-1.5 h-1.5 rounded-full bg-moss" />
                  )}
                  {isRunning && (
                    <span className="relative flex">
                      <span className="block w-1.5 h-1.5 rounded-full bg-cinnabar" />
                      <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-cinnabar animate-ink-pulse" />
                    </span>
                  )}
                  {isError && <AlertCircle className="w-3 h-3 text-cinnabar" />}
                </span>

                {/* Label */}
                <span
                  className={`text-[14px] flex-1 font-serif ${
                    isRunning
                      ? "text-ink font-semibold"
                      : isError
                      ? "text-cinnabar"
                      : isDone
                      ? "text-ink-soft"
                      : "text-ink-faint"
                  }`}
                >
                  {step.label}
                </span>

                {step.duration !== undefined && (
                  <span className="font-mono text-[11px] text-ink-faint flex-shrink-0">
                    {step.duration}s
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-ochre/15 flex items-center gap-2">
          <button
            onClick={onEnterReport}
            className="inline-flex items-center gap-2 text-[13px] text-paper-light bg-qing-deep hover:bg-qing px-4 py-1.5 rounded-full shadow-bubble-ink transition-all tracking-wide font-serif group"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>进入报告查看</span>
            <span className="text-cinnabar-light group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </button>
          {onPause && (
            <button
              onClick={onPause}
              className="inline-flex items-center gap-1.5 text-[13px] text-cinnabar-dark hover:text-cinnabar-dark border border-cinnabar/45 hover:border-cinnabar/65 px-3.5 py-1.5 rounded-full transition-colors tracking-wide bg-cinnabar/15 hover:bg-cinnabar/25 font-serif"
            >
              <Pause className="w-3 h-3" />
              暂停
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ThinkingBubbleProps {
  onPause?: () => void;
}

export function ThinkingBubble({ onPause }: ThinkingBubbleProps) {
  return (
    <div className="flex justify-start animate-ink-bleed">
      <div className="seal-ring w-9 h-9 bg-cinnabar flex items-center justify-center flex-shrink-0 mt-1 mr-3">
        <span className="font-serif text-bone text-[13px] leading-none">寿</span>
      </div>
      <div className="bg-paper-warm border border-ochre/20 rounded-2xl rounded-tl-sm shadow-bubble px-5 py-3.5 flex items-center gap-3 relative">
        <span className="absolute left-0 top-3 bottom-3 w-[2px] bg-cinnabar/30 rounded-r" />
        <span className="font-serif text-[15px] text-ink-soft tracking-[0.08em]">
          沉思
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-ink rounded-full animate-ink-drip" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-ink rounded-full animate-ink-drip" style={{ animationDelay: "180ms" }} />
          <span className="w-1.5 h-1.5 bg-ink rounded-full animate-ink-drip" style={{ animationDelay: "360ms" }} />
        </span>
        {onPause && (
          <button
            onClick={onPause}
            className="ml-2 inline-flex items-center gap-1 text-[13px] text-cinnabar-dark hover:text-cinnabar-dark border border-cinnabar/45 hover:border-cinnabar/65 px-3 py-1 rounded-full transition-colors bg-cinnabar/15 hover:bg-cinnabar/25 font-serif"
          >
            <Pause className="w-3 h-3" />
            暂停
          </button>
        )}
      </div>
    </div>
  );
}

interface PausedBubbleProps {
  lastUserInput?: string;
  onResume: () => void;
  onModify: () => void;
}

export function PausedBubble({ onResume, onModify }: PausedBubbleProps) {
  return (
    <div className="flex justify-start animate-ink-bleed">
      <div className="w-9 h-9 rounded-full border border-ochre/60 bg-paper-honey flex items-center justify-center flex-shrink-0 mt-1 mr-3">
        <Pause className="w-4 h-4 text-ochre-dark" />
      </div>
      <div className="max-w-[75%] bg-paper-honey border border-ochre/40 rounded-2xl rounded-tl-sm shadow-bubble px-5 py-4 relative">
        <div className="font-serif text-[15px] text-ochre-dark mb-2 tracking-[0.08em]">
          已暂停生成
        </div>
        <div className="text-[13px] text-ink-mute mb-3 leading-relaxed font-sans">
          您可以继续从断点恢复，或修改问题后重新开始。
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResume}
            className="inline-flex items-center gap-2 text-[13px] text-paper-light bg-moss hover:bg-moss-deep px-4 py-1.5 rounded-full shadow-bubble transition-all tracking-wide font-serif"
          >
            <span>▶</span>
            继续生成
          </button>
          <button
            onClick={onModify}
            className="inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink bg-paper-light border border-ink/20 hover:border-ink/40 px-4 py-1.5 rounded-full transition-colors tracking-wide font-serif"
          >
            <span>✎</span>
            修改问题
          </button>
        </div>
      </div>
    </div>
  );
}
