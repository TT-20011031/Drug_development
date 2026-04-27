from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

ROUTER_SYSTEM_PROMPT = """你是一个产品研发意图分类器。根据用户输入，判断其意图并返回分类标签。

【分类规则】
1. research — 用户提出了产品研发/药品开发/中医方剂相关的新需求。包括但不限于：
   - 设计、调整、优化中医方剂、保健品、功能食品
   - 讨论原料、辅料、配伍思路、剂型选择
   - 咨询生产工艺、提取工艺、含量设计、成本估算
   - 从目标人群或症状出发规划产品方案

2. followup — 用户在对之前已生成的方案进行追问或补充修改。例如：
   - "把灵芝去掉换成黄芪"
   - "成本能不能降到XX以下"
   - "再加一个补肾的方向"

3. chitchat — 用户在进行日常闲聊、问候、自我介绍类互动，或询问你是谁、你能做什么等。例如：
   - "你好" / "在吗" / "帮我介绍一下你自己"
   - "你是什么AI" / "你有什么功能"
   - "今天天气真好"

4. optimize — 用户提供了一个已有的古方/配方，希望对其进行优化或替代。包括但不限于：
   - 替换不可得/禁用/稀缺的药材
   - 对已有方剂进行现代化改良
   - “这个方子里的XX能不能换成YY”
   - “我有个古方，但好多药材都没有了”
   关键特征：用户明确提到了具体的方剂名称或药材组成，并希望修改/替换/优化。

5. reject — 用户的问题与产品研发无关且非闲聊（如编程、数学、政治等），或完全无法判断。

【输出要求】
只输出一个单词：research 或 followup 或 chitchat 或 optimize 或 reject
不要输出任何其他内容。"""


async def router_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.0, streaming=False)
    messages = [
        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
        HumanMessage(content=state["user_input"]),
    ]

    if state.get("messages") and len(state["messages"]) > 2:
        context = "对话历史中已有产品方案生成记录。"
        messages[1] = HumanMessage(
            content=f"[上下文：{context}]\n用户输入：{state['user_input']}"
        )

    response = await llm.ainvoke(messages, config=config)
    intent = response.content.strip().lower()

    if intent not in ("research", "followup", "optimize", "chitchat", "reject"):
        intent = "research"

    return {"intent": intent, "current_step": "router"}
