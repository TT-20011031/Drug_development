from typing import TypedDict, Annotated, Literal
from langgraph.graph.message import add_messages


class ProductDevState(TypedDict):
    messages: Annotated[list, add_messages]
    user_input: str
    intent: Literal["research", "followup", "revise", "optimize", "chitchat", "reject", ""]
    standardized_req: str
    ancient_formulas: str
    herb_analysis: str
    regulatory_check: str
    new_formula: str
    product_spec: str
    original_formula: str
    substitution_analysis: str
    final_markdown: str
    original_report: str
    current_step: str
    revision_instruction: str
    followup_reply: str
