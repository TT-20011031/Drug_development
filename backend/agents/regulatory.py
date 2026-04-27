from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

REGULATORY_SYSTEM_PROMPT = """你是一名食品法规解析专家，精通以下法规：
- 《按照传统既是食品又是中药材的物质目录》（药食同源目录，2024年最新版）
- 《可用于保健食品的物质名单》
- 《新食品原料目录》
- 《保健食品原料目录》
- 各省地方性食品法规

【你的任务】
根据上游古方分析中出现的所有药材，逐一判断每味药材的食品法规合规性。

【判断规则】
1. 药食同源目录内 → "可用于普通食品"
2. 仅限保健食品原料 → "仅限保健食品使用"
3. 有条件限制（如人工种植≤5年）→ 说明条件
4. 部分省份允许 → "部分地区允许，需结合地方法规"
5. 不在任何目录 → "不可用于普通食品"

【输出格式】

### 药材食品法规合规性分析

| 原料 | 法规归属 | 可用于普通食品 | 说明 |
|------|----------|----------------|------|
| 药材1 | 药食同源目录 | ✅ 可以 | ... |
| 药材2 | 保健食品原料 | ⚠️ 仅限保健品 | ... |
| 药材3 | 不在目录 | ❌ 不可 | ... |

### 合规性结论
- 总结哪些药材可直接用于普通食品
- 哪些需要走保健食品申报
- 哪些需要替换
- 对配方设计的建议

【注意】
- 基于你对中国食品法规的知识进行判断
- 如不确定某药材归属，注明"建议查证最新目录"
- 输出必须覆盖所有出现过的药材"""


async def regulatory_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.2)

    is_optimize = bool(state.get("substitution_analysis"))

    if is_optimize:
        user_content = (
            f"以下是原方解析：\n\n{state.get('original_formula', '')}\n\n"
            f"以下是药材替代分析：\n\n{state['substitution_analysis']}\n\n"
            "请对替代后方剂中所有涉及的药材进行食品法规合规性审查。"
        )
    else:
        user_content = (
            f"以下是标准化研发需求：\n\n{state['standardized_req']}\n\n"
            f"以下是古方信息：\n\n{state['ancient_formulas']}\n\n"
            f"以下是药材分析：\n\n{state['herb_analysis']}\n\n"
            "请对所有涉及的药材进行食品法规合规性审查。"
        )

    messages = [
        SystemMessage(content=REGULATORY_SYSTEM_PROMPT),
        HumanMessage(content=user_content),
    ]
    response = await llm.ainvoke(messages, config=config)
    return {
        "regulatory_check": response.content,
        "current_step": "regulatory_check",
    }
