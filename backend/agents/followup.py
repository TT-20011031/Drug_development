from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

FOLLOWUP_SYSTEM_PROMPT = """你是寿仙谷的智能产品研发助手。用户之前已经完成了一次产品研发流程，生成了完整的研发报告。
现在用户对报告内容进行追问或要求补充修改。

请根据已有报告内容和之前的对话历史，给出精准的回答。

【规则】
- 直接回答用户的问题，不要重复已有报告的全部内容
- 如果用户要求修改某个部分，给出修改后的内容
- 如果用户的问题超出报告范围，基于你的专业知识补充回答
- 参考之前的追问历史保持回答一致性
- 使用 Markdown 格式输出
- 回复控制在合理长度，不要过于冗长"""


async def followup_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.3, streaming=False)
 
    original = state.get("original_report", "") or state.get("final_markdown", "")
    user_question = state["user_input"]

    context = f"【原始研发报告】\n{original[:4000]}" if original else "（暂无已有报告）"

    chat_history = state.get("messages", [])
    history_lines = []
    for msg in chat_history[:-1]:
        role = getattr(msg, "type", "")
        content = getattr(msg, "content", str(msg))
        if role == "human":
            history_lines.append(f"用户：{content}")
        elif role == "ai":
            history_lines.append(f"助手：{content[:200]}...")
    history_block = "\n".join(history_lines[-10:]) if history_lines else ""

    prompt_parts = [context]
    if history_block:
        prompt_parts.append(f"\n【对话历史】\n{history_block}")
    prompt_parts.append(f"\n【本次追问】\n{user_question}")

    messages = [
        SystemMessage(content=FOLLOWUP_SYSTEM_PROMPT),
        HumanMessage(content="\n".join(prompt_parts)),
    ]

    response = await llm.ainvoke(messages, config=config)

    return {
        "followup_reply": response.content,
        "current_step": "followup",
    }
