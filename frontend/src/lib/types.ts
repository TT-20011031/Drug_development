export type StepStatus = "pending" | "running" | "done" | "error";

export interface PipelineStep {
  id: string;
  label: string;
  icon: string;
  status: StepStatus;
  content: string;
  duration?: number;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: "router", label: "智能理解", icon: "Compass", status: "pending", content: "" },
  // research branch
  { id: "requirement", label: "步骤一", icon: "ClipboardList", status: "pending", content: "" },
  { id: "ancient_formulas", label: "步骤二", icon: "BookOpen", status: "pending", content: "" },
  { id: "herb_analysis", label: "步骤三", icon: "Microscope", status: "pending", content: "" },
  // optimize branch
  { id: "formula_parse", label: "步骤一", icon: "FileSearch", status: "pending", content: "" },
  { id: "substitution", label: "步骤二", icon: "ArrowLeftRight", status: "pending", content: "" },
  // shared
  { id: "regulatory_check", label: "步骤四", icon: "Scale", status: "pending", content: "" },
  { id: "new_formula", label: "步骤五", icon: "FlaskConical", status: "pending", content: "" },
  { id: "product_spec", label: "步骤六", icon: "Factory", status: "pending", content: "" },
];

export interface SSEEvent {
  event: string;
  data: string;
}
