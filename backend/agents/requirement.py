from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

REQUIREMENT_SYSTEM_PROMPT = """你是一名资深的产品研发需求分析专家，擅长将用户自然语言需求标准化为结构化研发需求。

【你的任务】
将用户提出的产品研发相关内容深度理解后，提炼并输出一份标准化研发需求。

【标准化内容必须包含如下项目】
1. 产品方向 — 如：护肝、助眠、清热解毒、补气养血、祛湿、润肺等
2. 目标人群 — 谁来用？如：熬夜人群、久坐上班族、老年人、女性等
3. 指定/必须包含原料 — 用户明确指定的主原料或必须使用的原料，如"以X为主要原料""使用Y""含Z"等。如有多个，逐一列出；若用户未指定，填写"无"
4. 主要症状/核心诉求 — 用户希望改善什么？如：上火、口干、疲劳、失眠等
5. 推测中医证候 — 根据症状推测，如：肝郁、气虚、脾虚湿盛、阴虚火旺等
6. 可能适合的剂型方向 — 如：固体饮料、口服液、颗粒、丸剂、粉剂、含片等
7. 研发注意事项 — 如：清淡不燥、适合长期服用、避免刺激性药物等

【输出格式】
### 标准化研发需求
- **产品方向**：
- **目标人群**：
- **指定/必须包含原料**：
- **主要症状/核心诉求**：
- **推测中医证候**：
- **可能适合的剂型方向**：
- **研发注意事项**：

【注意】
- 必须深度理解用户语意后推断结构化信息，但不能胡编乱造
- 不要输出额外说明，只输出标准化结果"""


async def requirement_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.3)
    messages = [
        SystemMessage(content=REQUIREMENT_SYSTEM_PROMPT),
        HumanMessage(content=state["user_input"]),
    ]
    response = await llm.ainvoke(messages, config=config)
    return {
        "standardized_req": response.content,
        "current_step": "requirement",
    }
