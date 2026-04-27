"use client";

import { PipelineStep } from "@/lib/types";
import { MarkdownRender } from "./markdown-render";
import { StepIcon } from "./step-icon";
import { Loader2, FileText, ClipboardList } from "lucide-react";

interface ContentPanelProps {
  activeStep: PipelineStep | null;
  allSteps: PipelineStep[];
}

export function ContentPanel({ activeStep, allSteps }: ContentPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3.5 border-b border-gray-100 flex items-center gap-3">
        {activeStep ? (
          <>
            <StepIcon name={activeStep.icon} className="w-5 h-5 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-800 flex-1">{activeStep.label}</h2>
            <div className="flex items-center gap-2">
              {activeStep.duration !== undefined && (
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                  {activeStep.duration}s
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeStep.status === "done"
                    ? "bg-green-50 text-green-600"
                    : activeStep.status === "running"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {activeStep.status === "done" ? "已完成" : activeStep.status === "running" ? "执行中…" : "待执行"}
              </span>
            </div>
          </>
        ) : (
          <h2 className="text-sm font-medium text-gray-400">详细内容</h2>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
        {activeStep ? (
          activeStep.content.trim() ? (
            <MarkdownRender content={activeStep.content} />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-gray-400">
              <div className="space-y-2">
                <div>
                  {activeStep.status === "running" ? (
                    <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
                  ) : (
                    <FileText className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <p className="text-sm">
                  {activeStep.status === "running"
                    ? "该步骤正在执行，内容生成后会显示在这里"
                    : "该步骤暂时没有可展示的详细内容"}
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
            <ClipboardList className="w-12 h-12 text-gray-300" />
            <p className="text-sm">输入产品研发需求，开始智能分析</p>
          </div>
        )}
      </div>
    </div>
  );
}
