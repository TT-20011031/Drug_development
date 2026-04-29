// 配方表解析与派生计算工具（B4 可编辑配方表）
// 从 product_spec markdown 中解析 engineer agent 输出的「新配方组成」+「成本预测」两张表，
// 合并为一份结构化 FormulaRow[]，供 FormulaEditor 受控编辑。

export interface FormulaRow {
  id: string;
  name: string;
  amount: number; // 用量 g
  unitPrice: number; // 单价 元/kg
}

export interface ParsedFormula {
  rows: FormulaRow[];
  parseOk: boolean; // 「新配方组成」表必须存在且至少 1 行
}

interface MdTable {
  headers: string[];
  rows: string[][];
}

// 切出 ### 标题下、到下一个 ### 之间的段落
function extractSection(md: string, headingPattern: RegExp): string | null {
  const lines = md.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headingPattern.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^###\s/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

// 解析段落中第一个 markdown 表格
function parseMdTable(section: string): MdTable | null {
  const lines = section.split("\n").map((l) => l.trim());
  let headerIdx = -1;
  for (let i = 0; i < lines.length - 1; i++) {
    const cur = lines[i];
    const next = lines[i + 1];
    if (cur.startsWith("|") && cur.endsWith("|") && /^\|[\s\-:|]+\|$/.test(next)) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return null;

  const splitRow = (row: string) =>
    row.slice(1, -1).split("|").map((c) => c.trim());

  const headers = splitRow(lines[headerIdx]);
  const rows: string[][] = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith("|") || !l.endsWith("|")) break;
    rows.push(splitRow(l));
  }
  return { headers, rows };
}

function findColIndex(headers: string[], regex: RegExp): number {
  return headers.findIndex((h) => regex.test(h));
}

// 容错地提取数字（剥离 g、元、%、**、空格、全角字符等）
function parseNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/\*+/g, "").replace(/[^\d.\-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// 解析用量并统一转为 g（兼容 mg / g / kg / 毫克 / 克 / 千克）
function parseAmountInGrams(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/\*+/g, "").trim();
  const m = cleaned.match(/([\d.\-]+)\s*(mg|g|kg|毫克|克|千克)?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = (m[2] || "g").toLowerCase();
  if (unit === "mg" || unit === "毫克") return n / 1000;
  if (unit === "kg" || unit === "千克") return n * 1000;
  return n; // g / 克 / 无单位
}

// 宽松名字规范化（去括号注释 + 常见制剂后缀 + 空白），用于合并匹配
function normName(s: string): string {
  return s
    .replace(/[（(].*?[)）]/g, "")
    .replace(/(提取物|粉|颗粒)$/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function cleanName(raw: string): string {
  return (raw || "").replace(/\*+/g, "").trim();
}

function isSummaryName(name: string): boolean {
  return /合计|总计|小计/.test(name);
}

function makeRowId(name: string, idx: number): string {
  return `${name || "row"}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseFormulaMarkdown(md: string): ParsedFormula {
  if (!md) return { rows: [], parseOk: false };

  const compSection = extractSection(md, /^###\s*新配方组成/);
  if (!compSection) return { rows: [], parseOk: false };
  const compTable = parseMdTable(compSection);
  if (!compTable || compTable.rows.length === 0) {
    return { rows: [], parseOk: false };
  }

  const compNameIdx = findColIndex(compTable.headers, /品名|药材|原辅料|名称/);
  const compAmountIdx = findColIndex(compTable.headers, /用量|剂量/);
  if (compNameIdx < 0 || compAmountIdx < 0) {
    return { rows: [], parseOk: false };
  }

  const baseRows: FormulaRow[] = [];
  for (const cells of compTable.rows) {
    const name = cleanName(cells[compNameIdx] || "");
    if (!name || isSummaryName(name)) continue;
    const amount = parseAmountInGrams(cells[compAmountIdx] || "");
    baseRows.push({
      id: makeRowId(name, baseRows.length),
      name,
      amount,
      unitPrice: 0,
    });
  }

  if (baseRows.length === 0) return { rows: [], parseOk: false };

  // 从「成本预测」表合并单价
  const costSection = extractSection(md, /^###\s*成本预测/);
  if (costSection) {
    const costTable = parseMdTable(costSection);
    if (costTable) {
      const costNameIdx = findColIndex(costTable.headers, /品名|药材|原辅料|名称/);
      const costPriceIdx = findColIndex(costTable.headers, /单价/);
      if (costNameIdx >= 0 && costPriceIdx >= 0) {
        for (const cells of costTable.rows) {
          const name = cleanName(cells[costNameIdx] || "");
          if (!name || isSummaryName(name)) continue;
          const price = parseNumber(cells[costPriceIdx] || "");
          // 名字匹配：精确 → 提取物后缀互通 → 宽松 normName 兜底
          const target = baseRows.find(
            (r) =>
              r.name === name ||
              `${r.name}提取物` === name ||
              r.name === name.replace(/提取物$/, "") ||
              normName(r.name) === normName(name),
          );
          if (target) target.unitPrice = price;
        }
      }
    }
  }

  return { rows: baseRows, parseOk: true };
}

export interface DerivedRow {
  id: string;
  ratio: number; // %
  subtotal: number; // 元
}

export interface DerivedSummary {
  totalAmount: number;
  totalCost: number;
  perRow: DerivedRow[];
}

export function calcDerived(rows: FormulaRow[]): DerivedSummary {
  const totalAmount = rows.reduce(
    (s, r) => s + (Number.isFinite(r.amount) ? Math.max(0, r.amount) : 0),
    0,
  );
  const perRow: DerivedRow[] = rows.map((r) => {
    const amount = Number.isFinite(r.amount) ? r.amount : 0;
    const price = Number.isFinite(r.unitPrice) ? r.unitPrice : 0;
    const subtotal = (amount / 1000) * price;
    const ratio = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    return {
      id: r.id,
      ratio: Number.isFinite(ratio) ? ratio : 0,
      subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    };
  });
  const totalCost = perRow.reduce((s, p) => s + p.subtotal, 0);
  return { totalAmount, totalCost, perRow };
}

// 把 baseline → edited 的差异序列化为人类可读的 revision_instruction
export function buildRevisionInstruction(
  original: FormulaRow[],
  edited: FormulaRow[],
): string {
  const origByName = new Map(original.map((r) => [r.name, r]));
  const editedByName = new Map(edited.map((r) => [r.name, r]));

  const added: FormulaRow[] = [];
  const removed: FormulaRow[] = [];
  const changed: { name: string; from: FormulaRow; to: FormulaRow }[] = [];

  for (const r of edited) {
    const o = origByName.get(r.name);
    if (!o) {
      added.push(r);
    } else if (o.amount !== r.amount || o.unitPrice !== r.unitPrice) {
      changed.push({ name: r.name, from: o, to: r });
    }
  }
  for (const r of original) {
    if (!editedByName.has(r.name)) removed.push(r);
  }

  const summary: string[] = [];
  for (const c of changed) {
    const parts: string[] = [];
    if (c.from.amount !== c.to.amount) {
      parts.push(`用量 ${c.from.amount}→${c.to.amount}g`);
    }
    if (c.from.unitPrice !== c.to.unitPrice) {
      parts.push(`单价 ${c.from.unitPrice}→${c.to.unitPrice} 元/kg`);
    }
    summary.push(`- 调整：${c.name}（${parts.join("，")}）`);
  }
  for (const r of added) {
    const priceNote = r.unitPrice > 0 ? `，单价 ${r.unitPrice} 元/kg` : "";
    summary.push(`- 新增：${r.name} ${r.amount}g${priceNote}`);
  }
  for (const r of removed) {
    summary.push(`- 删除：${r.name}`);
  }

  const tableHeader = "| 药材 | 用量(g) | 单价(元/kg) |\n|------|---------|------------|";
  const tableRows = edited
    .map((r) => `| ${r.name || "(未命名)"} | ${r.amount} | ${r.unitPrice || 0} |`)
    .join("\n");

  const lines = [
    "请按以下调整后的配方表重新生成下游章节，**保持其他章节结构不变**：",
    "",
    tableHeader,
    tableRows,
    "",
  ];
  if (summary.length > 0) {
    lines.push("变更摘要：");
    lines.push(summary.join("\n"));
    lines.push("");
  }
  lines.push(
    "请仅刷新「新配方组成」「含量预测」「推荐工艺」「成本预测」四节，配伍分析按新组成同步更新；产品名称、功效、主治、适宜人群保持不变。",
  );
  return lines.join("\n");
}
