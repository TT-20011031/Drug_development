from langchain_core.runnables import RunnableConfig
from state import ProductDevState


async def revise_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    """轻量预处理：把用户的修改指令写入 revision_instruction，
    后续由 formula_agent / engineer_agent 在 revise 分支中读取并重新生成报告。
    本节点不调用 LLM，对前端不可见。
    """
    instruction = state.get("user_input", "").strip()
    return {
        "revision_instruction": instruction,
        "current_step": "revise",
    }
