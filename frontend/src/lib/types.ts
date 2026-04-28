export type StepStatus = "pending" | "running" | "done" | "error";

export interface PipelineStep {
  id: string;
  label: string;
  group: string;
  icon: string;
  status: StepStatus;
  content: string;
  duration?: number;
}

export const PIPELINE_GROUP_ORDER = ["理解需求", "古方研究", "古方解读", "方案生成"] as const;

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: "router", label: "智能理解", group: "理解需求", icon: "Compass", status: "pending", content: "" },
  // research branch
  { id: "requirement", label: "需求解析", group: "理解需求", icon: "ClipboardList", status: "pending", content: "" },
  { id: "ancient_formulas", label: "古方检索", group: "古方研究", icon: "BookOpen", status: "pending", content: "" },
  { id: "herb_analysis", label: "药材分析", group: "古方研究", icon: "Microscope", status: "pending", content: "" },
  // optimize branch
  { id: "formula_parse", label: "古方解析", group: "古方解读", icon: "FileSearch", status: "pending", content: "" },
  { id: "substitution", label: "替代分析", group: "古方解读", icon: "ArrowLeftRight", status: "pending", content: "" },
  // shared
  { id: "regulatory_check", label: "法规审核", group: "方案生成", icon: "Scale", status: "pending", content: "" },
  { id: "new_formula", label: "配方设计", group: "方案生成", icon: "FlaskConical", status: "pending", content: "" },
  { id: "product_spec", label: "产品规格", group: "方案生成", icon: "Factory", status: "pending", content: "" },
];

export interface SSEEvent {
  event: string;
  data: string;
}
