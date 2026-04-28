from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

ANCIENT_SYSTEM_PROMPT = """你是一位精通中医经典方剂与现代应用的中医药方剂专家。

【你的任务】
根据标准化研发需求，选择 3～5 个最适合作为产品研发参考的中医经典古方。

【输出格式要求】
第一行输出一条三级标题：
### 根据「{产品方向}」的方向，结合「{主要症状}」的症状，查找出以下合适的古方方剂：

然后依次输出每个古方，格式如下（多个方剂间空一行）：

**古方名**
出处：《xxx》

| 药材名 | 用量 |
|--------|------|
| 药材1  | 用量1 |
| 药材2  | 用量2 |

【具体要求】
- 选择的古方必须与研发需求的产品方向和症状高度相关
- 古方名只写方剂名称，如：**逍遥散**
- 出处填写主要经典来源，如：《太平惠民和剂局方》《伤寒论》等
- 每一味药占一行，药材名写中药名，用量写克数或"适量""等分"等
- 不要输出额外的解释、分析、说明性文字
- 不要使用代码块
- 如标准化需求中【指定/必须包含原料】非空（不为"无"），在所有古方列出后空一行，再用一行注明：
  - 若该原料出现在以上至少一个古方中：`> 指定原料【X】在以上古方中：✅ 出现于《方剂名》`
  - 若未出现：`> 指定原料【X】在以上古方中：❌ 未在以上古方中出现`"""


async def ancient_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.5)
    messages = [
        SystemMessage(content=ANCIENT_SYSTEM_PROMPT),
        HumanMessage(
            content=f"以下是标准化研发需求：\n\n{state['standardized_req']}\n\n"
            "请根据需求检索最合适的经典古方。"
        ),
    ]
    response = await llm.ainvoke(messages, config=config)
    return {
        "ancient_formulas": response.content,
        "current_step": "ancient_formulas",
    }
