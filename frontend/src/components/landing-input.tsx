"use client";

import { useState, useRef, useEffect } from "react";
import {
  FlaskConical,
  Shield,
  Leaf,
  Sparkles,
  BookOpen,
  Microscope,
  Scale,
  Settings,
} from "lucide-react";

interface LandingInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  { Icon: FlaskConical, text: "开发一款清热解毒的含片产品" },
  { Icon: Shield, text: "设计针对中老年人的免疫调节保健品" },
  { Icon: Sparkles, text: "研发灵芝孢子粉+西洋参配方产品" },
  { Icon: Leaf, text: "开发改善睡眠的草本功能食品" },
];

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

export function LandingInput({ onSend, isLoading }: LandingInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="flex-1 flex flex-col items-center justify-center w-full relative overflow-hidden">
      {/* Decorative seal — right edge */}
      <div className="hidden lg:block absolute right-12 bottom-10 select-none pointer-events-none animate-fade-up">
        <div className="seal-ring w-14 h-14 bg-cinnabar/85 rounded-sm flex items-center justify-center rotate-3">
          <div className="font-serif text-bone text-[20px] leading-none tracking-tight">
            本草
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl px-6 animate-ink-bleed">
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
          <div className="flex items-center justify-end px-5 pb-4 pt-2">
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

        {/* Suggestion strip */}
        <div className="mt-8 w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-serif text-[15px] text-ink-soft tracking-[0.18em]">
              范 例
            </span>
            <div className="flex-1 ornament-rule-soft text-ink-faint" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={s.text}
                onClick={() => onSend(s.text)}
                disabled={isLoading}
                style={{ animationDelay: `${idx * 70}ms` }}
                className="group flex items-center gap-2 text-[13.5px] px-4 py-2 rounded-full bg-ochre/10 border border-ochre/25 text-ink-soft hover:bg-ochre/10 hover:border-ochre/30 hover:text-ink hover:shadow-bubble transition-all disabled:opacity-50 animate-fade-up"
              >
                <s.Icon className="w-3.5 h-3.5 text-ochre-dark/85 group-hover:text-ochre-dark transition-colors" />
                <span className="font-sans">{s.text}</span>
              </button>
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
  );
 }
