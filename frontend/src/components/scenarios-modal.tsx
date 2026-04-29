"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Library } from "lucide-react";
import { SCENARIOS, type ScenarioCategory } from "@/lib/scenarios";
import { ScenarioCard } from "./scenario-card";

interface ScenariosModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (prompt: string) => void;
  disabled?: boolean;
}

type TabKey = "all" | ScenarioCategory;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "全 部" },
  { key: "research", label: "新 研 发" },
  { key: "optimize", label: "古 方 优 化" },
];

export function ScenariosModal({
  open,
  onClose,
  onStart,
  disabled = false,
}: ScenariosModalProps) {
  const [tab, setTab] = useState<TabKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reset expansion when modal opens / closes
  useEffect(() => {
    if (!open) {
      setExpandedId(null);
      setTab("all");
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  const visibleScenarios = useMemo(() => {
    if (tab === "all") return SCENARIOS;
    return SCENARIOS.filter((s) => s.category === tab);
  }, [tab]);

  if (!open) return null;

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleStart = (prompt: string) => {
    onStart(prompt);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 animate-ink-bleed"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="关闭样例库"
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 backdrop-blur-sm cursor-default"
      />

      {/* Panel */}
      <div className="relative w-full max-w-5xl max-h-[88vh] bg-paper-warm/95 rounded-2xl border border-ochre/35 shadow-bubble-ink flex flex-col overflow-hidden">
        {/* Decorative corner ticks */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ink/25 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-ink/25 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-ink/25 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ink/25 rounded-br-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-ink/10">
          <div>
            <div className="flex items-baseline gap-3 mb-1.5">
              <Library
                className="w-4 h-4 text-cinnabar"
                strokeWidth={1.6}
              />
              <h2 className="font-serif text-[20px] text-ink tracking-[0.12em]">
                范 例 札 录
              </h2>
              <span className="font-mono text-[11px] text-ink-faint">
                {SCENARIOS.length.toString().padStart(2, "0")} 例
              </span>
            </div>
            <p className="font-serif italic text-[12.5px] text-ink-mute tracking-wide">
              选取一例典型研发课题，一笔即可起势。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-ink/15 text-ink-mute hover:text-cinnabar hover:border-cinnabar/40 hover:bg-cinnabar/10 flex items-center justify-center transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" strokeWidth={1.6} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-7 pt-3 pb-2 border-b border-ink/10 flex items-center gap-6">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setExpandedId(null);
                }}
                className={`relative pb-2.5 font-serif text-[13.5px] tracking-[0.18em] transition-colors ${
                  active ? "text-ink" : "text-ink-faint hover:text-ink-mute"
                }`}
              >
                {t.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-cinnabar rounded-full animate-brush" />
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleScenarios.map((s, idx) => (
              <div
                key={s.id}
                style={{ animationDelay: `${idx * 40}ms` }}
                className="animate-fade-up"
              >
                <ScenarioCard
                  scenario={s}
                  expanded={expandedId === s.id}
                  onToggle={handleToggle}
                  onStart={handleStart}
                  disabled={disabled}
                  variant="compact"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
