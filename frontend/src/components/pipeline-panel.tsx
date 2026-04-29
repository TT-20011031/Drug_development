"use client";

import { PipelineStep, PIPELINE_GROUP_ORDER } from "@/lib/types";
import { StepCard } from "./step-card";
import { Download } from "lucide-react";

interface PipelinePanelProps {
  steps: PipelineStep[];
  activeStepId: string;
  onStepClick: (stepId: string) => void;
  pdfUrl: string | null;
}

const NUMERALS = ["壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖", "拾"];
const GROUP_NUMERALS = ["卷一", "卷二", "卷三", "卷四", "卷五"];

export function PipelinePanel({
  steps,
  activeStepId,
  onStepClick,
  pdfUrl,
}: PipelinePanelProps) {
  // Bucket steps by group, preserving original within-group order
  const grouped = new Map<string, PipelineStep[]>();
  for (const step of steps) {
    const arr = grouped.get(step.group);
    if (arr) arr.push(step);
    else grouped.set(step.group, [step]);
  }

  // Order groups by predefined sequence, skip empty
  const orderedGroups = PIPELINE_GROUP_ORDER.map((name) => ({
    name: name as string,
    items: grouped.get(name) || [],
  })).filter((g) => g.items.length > 0);

  let globalIndex = 0;
  const lastStepId = steps[steps.length - 1]?.id;

  return (
    <div className="h-full flex flex-col bg-paper-light/30">
      <div className="px-5 pt-5 pb-4 border-b border-ink/10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[17px] text-ink tracking-[0.1em]">
            执行进度
          </h2>
          <span className="font-mono text-[11px] text-qing-deep">
            {steps.filter((s) => s.status === "done").length
              .toString()
              .padStart(2, "0")}
            /{steps.length.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="ornament-rule-soft text-ink-faint mt-3" />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {orderedGroups.map((group, groupIdx) => (
          <div key={group.name} className="space-y-0.5">
            <div className="px-3 pt-1 pb-2 flex items-baseline gap-2.5">
              <span className="font-serif text-[14px] text-cinnabar tracking-wide">
                {GROUP_NUMERALS[groupIdx] ?? `卷${groupIdx + 1}`}
              </span>
              <span className="font-serif text-[15px] text-ink-soft tracking-[0.1em]">
                {group.name}
              </span>
              <div className="flex-1 ornament-rule-soft text-ink-faint" />
            </div>
            {group.items.map((step) => {
              const delayIndex = globalIndex++;
              const numeral = NUMERALS[delayIndex] ?? `${delayIndex + 1}`;
              return (
                <div
                  key={step.id}
                  className="relative animate-fade-up"
                  style={{ animationDelay: `${delayIndex * 50}ms` }}
                >
                  <StepCard
                    step={step}
                    isActive={activeStepId === step.id}
                    onClick={() => onStepClick(step.id)}
                    numeral={numeral}
                  />
                  {pdfUrl && step.id === lastStepId && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-4 mx-3 flex items-center gap-2.5 bg-cinnabar/20 text-cinnabar-dark border border-cinnabar/40 rounded-full pl-5 pr-1.5 py-1.5 hover:bg-cinnabar/35 hover:border-cinnabar/60 shadow-bubble transition-all"
                    >
                      <span className="flex-1 font-serif text-[13.5px] tracking-[0.1em]">
                        下载研发报告
                      </span>
                      <span className="bg-cinnabar/35 group-hover:bg-cinnabar w-9 h-9 rounded-full flex items-center justify-center text-paper-light transition-colors flex-shrink-0">
                        <Download className="w-4 h-4" />
                      </span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
