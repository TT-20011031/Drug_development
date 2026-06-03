"use client";

import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Microscope,
  Scale,
  Settings,
  Library,
  ArrowRight,
  UploadCloud,
} from "lucide-react";
import { getFeaturedScenarios } from "@/lib/scenarios";
import { ScenarioCard } from "./scenario-card";
import { ScenariosModal } from "./scenarios-modal";

interface LandingInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  autoUploadToDeludata: boolean;
  onAutoUploadChange: (enabled: boolean) => void;
}

const FEATURES: {
  serial: string;
  Icon: typeof BookOpen;
  title: string;
}[] = [
  { serial: "01", Icon: BookOpen, title: "古方检索" },
  { serial: "02", Icon: Microscope, title: "配方设计" },
  { serial: "03", Icon: Scale, title: "法规审查" },
  { serial: "04", Icon: Settings, title: "工程规格" },
];

export function LandingInput({
  onSend,
  isLoading,
  autoUploadToDeludata,
  onAutoUploadChange,
}: LandingInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const featuredScenarios = getFeaturedScenarios();

  const handleScenarioToggle = (id: string) => {
    setExpandedScenarioId((prev) => (prev === id ? null : id));
  };

  const handleScenarioStart = (prompt: string) => {
    if (isLoading) return;
    setExpandedScenarioId(null);
    onSend(prompt);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto relative">
      {/* Decorative seal — right edge */}
      <div className="hidden lg:block absolute right-12 bottom-10 select-none pointer-events-none animate-fade-up">
        <div className="seal-ring w-14 h-14 bg-cinnabar/85 rounded-sm flex items-center justify-center rotate-3">
          <div className="font-serif text-bone text-[20px] leading-none tracking-tight">
            本草
          </div>
        </div>
      </div>

      <div className="min-h-full flex flex-col items-center justify-center px-6 py-10 relative">
      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl animate-ink-bleed">
        {/* Micro tagline (标题已上 header，仅留副标题作为输入框上方装饰五联) */}
        <div className="mb-7 flex items-center gap-4 text-ink-faint">
          <div className="ornament-rule-soft w-16" />
          <p className="font-serif text-[13px] text-ink-mute tracking-[0.32em]">
            古方 · 解析 · 配伍 · 审核 · 规格
          </p>
          <div className="ornament-rule-soft w-16" />
        </div>

        {/* Input — manuscript card with corner ticks (preserved as identity) */}
        <div
          className={`w-full bg-paper-honey/40 rounded-2xl border transition-all duration-300 relative ${
            focused
              ? "border-ochre/60 shadow-bubble-ink"
              : "border-ink/15 shadow-bubble"
          }`}
        >
          {/* Decorative corner ticks */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ink/25 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-ink/25 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-ink/25 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ink/25 rounded-br-2xl" />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="试写一笔产品研发需求……"
            disabled={isLoading}
            rows={3}
            className="w-full resize-none bg-transparent text-[16px] leading-[1.85] font-serif px-7 pt-7 pb-2 focus:outline-none disabled:text-ink-faint placeholder:text-ink-faint placeholder:italic placeholder:font-sans"
          />
          <div className="flex flex-col gap-3 px-5 pb-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              aria-pressed={autoUploadToDeludata}
              onClick={() => onAutoUploadChange(!autoUploadToDeludata)}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-serif tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                autoUploadToDeludata
                  ? "border-qing-deep/40 bg-qing-deep/10 text-qing-deep shadow-bubble"
                  : "border-ink/12 bg-paper-warm/45 text-ink-mute hover:border-ochre/45 hover:text-ochre-dark"
              }`}
            >
              <UploadCloud className="h-4 w-4" strokeWidth={1.7} />
              <span>上传知识库</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-ochre/38 text-ochre-dark border border-ochre/55 text-[14px] font-serif tracking-[0.18em] hover:bg-ochre/48 hover:border-ochre/68 shadow-bubble transition-all disabled:bg-paper-dark disabled:text-ink-faint disabled:border-ink/15 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-30"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              <span>开始研发</span>
            </button>
          </div>
        </div>

        {/* Featured scenario library */}
        <div className="mt-8 w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-serif text-[15px] text-ink-soft tracking-[0.18em]">
              范 例
            </span>
            <div className="flex-1 ornament-rule-soft text-ink-faint" />
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={isLoading}
              className="group inline-flex items-center gap-1.5 text-[12.5px] font-serif tracking-[0.18em] text-ink-mute hover:text-cinnabar transition-colors disabled:opacity-50"
            >
              <Library className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>更 多 范 例</span>
              <ArrowRight
                className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={1.8}
              />
            </button>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {featuredScenarios.map((s, idx) => (
              <div
                key={s.id}
                style={{ animationDelay: `${idx * 70}ms` }}
                className="animate-fade-up"
              >
                <ScenarioCard
                  scenario={s}
                  expanded={expandedScenarioId === s.id}
                  onToggle={handleScenarioToggle}
                  onStart={handleScenarioStart}
                  disabled={isLoading}
                  variant="featured"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Feature strip — compact premium horizontal bar */}
        <div className="mt-10 flex w-full items-stretch overflow-hidden rounded-xl bg-qing-deep shadow-bubble-ink animate-fade-up">
          {FEATURES.map((f, idx) => (
            <div
              key={f.title}
              className={`flex flex-1 items-center justify-center gap-2.5 px-4 py-3 transition-colors hover:bg-bone/[0.06] ${
                idx > 0 ? "border-l border-bone/[0.10]" : ""
              }`}
            >
              <span className="text-[11px] font-mono tracking-widest text-qing-mist/70">
                {f.serial}
              </span>
              <f.Icon className="h-3.5 w-3.5 text-qing-mist" strokeWidth={1.5} />
              <span className="font-serif text-[14px] tracking-wide text-bone">
                {f.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>

      <ScenariosModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onStart={handleScenarioStart}
        disabled={isLoading}
      />
    </div>
  );
}
