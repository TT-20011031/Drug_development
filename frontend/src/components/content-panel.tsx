"use client";

import { PipelineStep } from "@/lib/types";
import { MarkdownRender } from "./markdown-render";
import { StepIcon } from "./step-icon";
import { FileText, ClipboardList } from "lucide-react";

interface ContentPanelProps {
  activeStep: PipelineStep | null;
  allSteps: PipelineStep[];
  userInput?: string;
}

const STATUS_LABEL: Record<PipelineStep["status"], string> = {
  done: "已完成",
  running: "执行中",
  error: "出错",
  pending: "待执行",
};

export function ContentPanel({
  activeStep,
  allSteps,
  userInput,
}: ContentPanelProps) {
  // Determine the chapter index this step belongs to among the active pipeline
  const stepIndex = activeStep
    ? Math.max(0, allSteps.findIndex((s) => s.id === activeStep.id))
    : -1;
  const numerals = ["壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖", "拾"];
  const chapterNumeral = stepIndex >= 0 ? numerals[stepIndex] ?? `${stepIndex + 1}` : "—";

  return (
    <div className="h-full flex flex-col bg-paper-light/30">
      {/* Header */}
      <div className="px-8 pt-6 pb-5 border-b border-ink/10 relative">
        {activeStep ? (
          <>
            {/* Top row: chapter numeral + group label */}
            <div className="flex items-baseline gap-4 mb-2">
              <span className="font-serif text-[40px] text-cinnabar leading-none">
                {chapterNumeral}
              </span>
              <span className="font-serif text-[14px] text-cinnabar-dark tracking-[0.18em]">
                {activeStep.group}
              </span>
            </div>
            {/* Title row: icon + step name + status capsules */}
            <div className="flex items-center gap-3 mt-3">
              <StepIcon
                name={activeStep.icon}
                className="w-6 h-6 text-ink-soft flex-shrink-0"
              />
              <h2 className="font-serif text-[26px] font-semibold text-ink tracking-[0.04em] flex-1 truncate">
                {activeStep.label}
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                {activeStep.duration !== undefined && (
                  <span className="font-mono text-[12px] text-qing-deep border border-qing-mist bg-qing-pale/60 px-3 py-0.5 rounded-full tracking-tight">
                    {activeStep.duration}s
                  </span>
                )}
                <span
                  className={`text-[12px] px-3 py-0.5 rounded-full tracking-wide font-serif inline-flex items-center gap-1.5 ${
                    activeStep.status === "done"
                      ? "bg-moss/15 text-moss border border-moss/30"
                      : activeStep.status === "running"
                      ? "bg-cinnabar/10 text-cinnabar border border-cinnabar/30"
                      : activeStep.status === "error"
                      ? "bg-cinnabar/15 text-cinnabar-dark border border-cinnabar/40"
                      : "bg-qing-pale text-qing-deep border border-qing-mist"
                  }`}
                >
                  {STATUS_LABEL[activeStep.status]}
                  {activeStep.status === "running" && (
                    <span className="inline-flex gap-0.5">
                      <span className="w-1 h-1 bg-cinnabar rounded-full animate-ink-drip" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 bg-cinnabar rounded-full animate-ink-drip" style={{ animationDelay: "180ms" }} />
                    </span>
                  )}
                </span>
              </div>
            </div>
          </>
        ) : (
          <h2 className="font-serif text-[20px] text-ink-faint">详细内容</h2>
        )}
      </div>

      {/* User-input quote */}
      {userInput && (
        <div className="mx-8 mt-6 relative flex-shrink-0 animate-fade-up">
          <div className="absolute -top-3 left-4 bg-paper px-3 font-serif text-[14px] text-ochre-dark tracking-[0.18em]">
            议 题
          </div>
          <div className="border-l-[3px] border-ochre bg-paper-honey/40 pl-5 pr-5 py-4 rounded-r-xl">
            <p
              className="font-serif text-[15px] text-ink-soft leading-[1.9] line-clamp-3"
              title={userInput}
            >
              {userInput}
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-7 pb-12">
        <div className="max-w-[760px] mx-auto">
          {activeStep ? (
            activeStep.content.trim() ? (
              <div className="animate-ink-bleed">
                <MarkdownRender content={activeStep.content} />
                {/* Closing ornament */}
                <div className="mt-12 flex items-center justify-center gap-3 text-ink-faint">
                  <div className="ornament-rule-soft w-16" />
                  <span className="font-serif text-[16px] text-cinnabar/60 leading-none">❦</span>
                  <div className="ornament-rule-soft w-16" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-[280px] items-center justify-center text-center">
                <div className="mb-5">
                  {activeStep.status === "running" ? (
                    <span className="inline-flex gap-1.5">
                      <span className="w-2 h-2 bg-cinnabar rounded-full animate-ink-drip" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-cinnabar rounded-full animate-ink-drip" style={{ animationDelay: "180ms" }} />
                      <span className="w-2 h-2 bg-cinnabar rounded-full animate-ink-drip" style={{ animationDelay: "360ms" }} />
                    </span>
                  ) : (
                    <FileText className="w-10 h-10 text-ink-faint" strokeWidth={1.2} />
                  )}
                </div>
                <p className="font-serif text-[15px] text-ink-mute italic max-w-md leading-relaxed">
                  {activeStep.status === "running"
                    ? "该步骤正在执行，内容生成后会逐字显现于此"
                    : "该步骤暂无可展示的详细内容"}
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <ClipboardList
                className="w-14 h-14 text-ink-faint mb-4"
                strokeWidth={1.2}
              />
              <p className="font-serif text-[16px] text-ink-mute italic">
                输入产品研发需求，开始智能分析
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
