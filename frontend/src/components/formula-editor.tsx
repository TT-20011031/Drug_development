"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, ArrowRight } from "lucide-react";
import {
  FormulaRow,
  parseFormulaMarkdown,
  calcDerived,
  buildRevisionInstruction,
} from "@/lib/formula-table";

interface FormulaEditorProps {
  rawMarkdown: string;
  isLoading: boolean;
  onSubmitRevision: (instruction: string) => void;
}

interface EditorRow {
  id: string;
  name: string;
  amount: string; // 保留为字符串避免输入过程被 NaN 干扰
  unitPrice: string;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function numOrZero(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function rowToFormula(r: EditorRow): FormulaRow {
  return {
    id: r.id,
    name: r.name.trim(),
    amount: numOrZero(r.amount),
    unitPrice: numOrZero(r.unitPrice),
  };
}

function formulaToEditor(r: FormulaRow): EditorRow {
  return {
    id: r.id,
    name: r.name,
    amount: String(r.amount),
    unitPrice: String(r.unitPrice),
  };
}

export function FormulaEditor({
  rawMarkdown,
  isLoading,
  onSubmitRevision,
}: FormulaEditorProps) {
  const parsed = useMemo(() => parseFormulaMarkdown(rawMarkdown), [rawMarkdown]);

  const [rows, setRows] = useState<EditorRow[]>([]);
  const [baseline, setBaseline] = useState<FormulaRow[]>([]);

  // 当 markdown 变化（初次解析或后端 revise 完成回流）时，把 baseline 与编辑态同步重置
  useEffect(() => {
    if (!parsed.parseOk) {
      setRows([]);
      setBaseline([]);
      return;
    }
    setBaseline(parsed.rows.map((r) => ({ ...r })));
    setRows(parsed.rows.map(formulaToEditor));
  }, [rawMarkdown, parsed.parseOk, parsed.rows]);

  const editedFormula = useMemo(() => rows.map(rowToFormula), [rows]);
  const derived = useMemo(() => calcDerived(editedFormula), [editedFormula]);
  const derivedById = useMemo(() => {
    const m = new Map<string, { ratio: number; subtotal: number }>();
    for (const d of derived.perRow) m.set(d.id, { ratio: d.ratio, subtotal: d.subtotal });
    return m;
  }, [derived.perRow]);

  const dirty = useMemo(() => {
    if (rows.length !== baseline.length) return true;
    for (const r of rows) {
      const b = baseline.find((x) => x.id === r.id);
      if (!b) return true;
      if (r.name.trim() !== b.name) return true;
      if (numOrZero(r.amount) !== b.amount) return true;
      if (numOrZero(r.unitPrice) !== b.unitPrice) return true;
    }
    return false;
  }, [rows, baseline]);

  if (!parsed.parseOk) return null;

  const updateRow = (id: string, patch: Partial<EditorRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () =>
    setRows((rs) => [
      ...rs,
      { id: uid(), name: "", amount: "0", unitPrice: "0" },
    ]);
  const reset = () => setRows(baseline.map(formulaToEditor));
  const submit = () => {
    if (isLoading || !dirty) return;
    const instruction = buildRevisionInstruction(baseline, editedFormula);
    onSubmitRevision(instruction);
  };

  return (
    <div className="mb-8 bg-paper-light/50 border border-ink/10 rounded-xl px-5 py-4 animate-fade-up">
      {/* Header bar */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-serif text-[15px] text-ink font-semibold tracking-[0.08em]">
            配方编辑器
          </span>
          {dirty && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cinnabar/10 text-cinnabar border border-cinnabar/30 tracking-wide font-serif whitespace-nowrap">
              已修改 · 未提交
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={!dirty || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-ink/15 text-[12px] text-ink-mute hover:text-ink-soft hover:border-ink/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
          重置
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!dirty || isLoading}
          className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-lg text-[12px] font-serif tracking-[0.08em] transition-colors ${
            dirty && !isLoading
              ? "bg-cinnabar text-paper hover:bg-cinnabar-dark border border-cinnabar"
              : "bg-paper-dark/60 text-ink-faint border border-ink/15 cursor-not-allowed"
          }`}
        >
          {isLoading ? "重写中..." : "提交修改"}
          {!isLoading && <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="text-[11px] tracking-[0.18em] text-ink-mute font-serif border-b border-ink/10">
              <th className="text-left px-2 py-1.5 font-normal w-[28%]">药材</th>
              <th className="text-right px-2 py-1.5 font-normal w-[14%]">用量(g)</th>
              <th className="text-right px-2 py-1.5 font-normal w-[12%]">占比</th>
              <th className="text-right px-2 py-1.5 font-normal w-[18%]">单价(元/kg)</th>
              <th className="text-right px-2 py-1.5 font-normal w-[16%]">小计(元)</th>
              <th className="w-[12%]" aria-label="操作"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = derivedById.get(r.id) || { ratio: 0, subtotal: 0 };
              return (
                <tr key={r.id} className="border-b border-ink/5 last:border-b-0">
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) => updateRow(r.id, { name: e.target.value })}
                      disabled={isLoading}
                      placeholder="药材名"
                      className="w-full bg-paper border border-ink/15 rounded px-2 py-1 text-[14px] text-ink focus:border-cinnabar focus:outline-none disabled:bg-paper-dark/40 disabled:text-ink-faint"
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={r.amount}
                      onChange={(e) => updateRow(r.id, { amount: e.target.value })}
                      disabled={isLoading}
                      className="w-full bg-paper border border-ink/15 rounded px-2 py-1 text-[14px] text-ink text-right font-mono focus:border-cinnabar focus:outline-none disabled:bg-paper-dark/40 disabled:text-ink-faint"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right text-ink-soft font-mono whitespace-nowrap">
                    {d.ratio.toFixed(1)}%
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={r.unitPrice}
                      onChange={(e) => updateRow(r.id, { unitPrice: e.target.value })}
                      disabled={isLoading}
                      className="w-full bg-paper border border-ink/15 rounded px-2 py-1 text-[14px] text-ink text-right font-mono focus:border-cinnabar focus:outline-none disabled:bg-paper-dark/40 disabled:text-ink-faint"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right text-ink-soft font-mono whitespace-nowrap">
                    {d.subtotal.toFixed(2)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      disabled={isLoading}
                      className="text-ink-faint hover:text-cinnabar transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="删除该行"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-ink/10 flex-wrap">
        <button
          type="button"
          onClick={addRow}
          disabled={isLoading}
          className="inline-flex items-center gap-1 text-[12px] text-ochre-dark hover:text-cinnabar transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          添加药材
        </button>
        <div className="flex items-center gap-4 text-[13px] font-mono">
          <span className="text-ink-mute">
            总用量：<span className="text-ink-soft">{derived.totalAmount.toFixed(1)}g</span>
          </span>
          <span className="text-ink-mute">
            合计成本：
            <span className="text-cinnabar font-semibold">
              {derived.totalCost.toFixed(2)} 元/份
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
