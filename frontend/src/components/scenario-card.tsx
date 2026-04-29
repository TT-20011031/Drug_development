"use client";

import { ChevronDown, Play } from "lucide-react";
import type { Scenario } from "@/lib/scenarios";

interface ScenarioCardProps {
  scenario: Scenario;
  expanded: boolean;
  onToggle: (id: string) => void;
  onStart: (prompt: string) => void;
  disabled?: boolean;
  /** Visual density: featured (landing) vs compact (modal grid). */
  variant?: "featured" | "compact";
}

const CATEGORY_BADGE: Record<
  Scenario["category"],
  { label: string; className: string }
> = {
  research: {
    label: "新研发",
    className: "bg-moss/15 text-moss border border-moss/30",
  },
  optimize: {
    label: "古方优化",
    className: "bg-qing/10 text-qing-deep border border-qing/30",
  },
};

export function ScenarioCard({
  scenario,
  expanded,
  onToggle,
  onStart,
  disabled = false,
  variant = "featured",
}: ScenarioCardProps) {
  const badge = CATEGORY_BADGE[scenario.category];
  const Icon = scenario.Icon;

  return (
    <div
      className={`group relative rounded-xl border bg-paper-honey/40 transition-all duration-300 ${
        expanded
          ? "border-ochre/55 shadow-bubble-ink"
          : "border-ochre/25 hover:border-ochre/50 shadow-bubble hover:-translate-y-[1px]"
      }`}
    >
      {/* Top-left cinnabar brush stroke (identity mark) */}
      <span
        className={`absolute top-3 left-3 h-[1.5px] rounded-full transition-all duration-300 ${
          expanded
            ? "w-8 bg-cinnabar/70"
            : "w-6 bg-cinnabar/40 group-hover:bg-cinnabar/70"
        }`}
        aria-hidden
      />

      {/* Collapsed header — clickable */}
      <button
        type="button"
        onClick={() => onToggle(scenario.id)}
        className="w-full text-left px-4 pt-5 pb-4"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
              expanded
                ? "bg-cinnabar/15 text-cinnabar-dark"
                : "bg-paper-light/80 text-ochre-dark"
            } transition-colors`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.6} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10.5px] px-2 py-[1px] rounded-full tracking-[0.12em] ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="text-[10.5px] text-ink-faint font-serif tracking-wide">
                {scenario.dosageForm} · {scenario.audience}
              </span>
            </div>
            <h3
              className={`font-serif tracking-[0.04em] leading-tight ${
                variant === "compact" ? "text-[15px]" : "text-[16.5px]"
              } text-ink`}
            >
              {scenario.title}
            </h3>
            <p
              className={`mt-1 font-sans text-ink-mute leading-snug ${
                variant === "compact" ? "text-[12px]" : "text-[12.5px]"
              }`}
            >
              {scenario.tagline}
            </p>
          </div>
          <ChevronDown
            className={`flex-shrink-0 w-4 h-4 mt-1 text-ink-faint transition-transform duration-300 ${
              expanded ? "rotate-180 text-cinnabar" : ""
            }`}
            strokeWidth={1.6}
          />
        </div>
      </button>

      {/* Expanded body */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <div className="border-l-[3px] border-cinnabar/60 pl-4 py-1 mb-3">
              <div className="font-serif text-[11px] text-cinnabar-dark tracking-[0.18em] mb-2">
                需 求 描 述
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[13px] text-ink-soft leading-[1.7]">
                {scenario.prompt}
              </pre>
            </div>

            <div className="border-l-[3px] border-ochre/50 pl-4 py-1 mb-4">
              <div className="font-serif text-[11px] text-ochre-dark tracking-[0.18em] mb-2">
                关 键 考 察
              </div>
              <ul className="space-y-1.5">
                {scenario.highlights.map((h, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-[12.5px] text-ink-mute leading-relaxed font-sans"
                  >
                    <span className="font-mono text-[10.5px] text-cinnabar/70 flex-shrink-0 mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onStart(scenario.prompt)}
                disabled={disabled}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cinnabar/85 text-bone border border-cinnabar-dark/40 text-[13px] font-serif tracking-[0.18em] hover:bg-cinnabar shadow-bubble transition-all disabled:bg-paper-dark disabled:text-ink-faint disabled:border-ink/15 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5" strokeWidth={2} />
                <span>开 始 研 发</span>
              </button>
              <button
                type="button"
                onClick={() => onToggle(scenario.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-ink/15 text-[12.5px] font-serif text-ink-mute hover:text-ink hover:border-ink/30 hover:bg-paper-light/60 transition-colors"
              >
                收 起
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
