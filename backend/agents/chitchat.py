from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

CHITCHAT_SYSTEM_PROMPT = """你是寿仙谷的智能产品研发助手，专注于中医药产品研发、配方设计等领域。
当用户与你进行日常闲聊时，请友好自然地回应，并适时引导用户提出产品研发相关需求。

注意：
- 回复简洁、亲切，不超过150字
- 可以简单介绍自己的功能：帮助研发中医药产品、设计配方、分析古方等
- 自然引导用户提出研发需求"""


async def chitchat_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.7, streaming=False)
    messages = [
        SystemMessage(content=CHITCHAT_SYSTEM_PROMPT),
        HumanMessage(content=state["user_input"]),
    ]

    response = await llm.ainvoke(messages, config=config)

    return {
        "final_markdown": response.content,
        "current_step": "chitchat",
    }
