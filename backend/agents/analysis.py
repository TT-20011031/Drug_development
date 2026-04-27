from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

ANALYSIS_SYSTEM_PROMPT = """你是一名擅长方剂用药结构分析的中医药专家。

【你的任务】
对上游提供的古方列表进行以下三项分析：

### 任务1：统计中药材出现频次
汇总所有方剂中的中药材名称，按出现次数统计。输出 Markdown 表格：

### 提取古方高频中药

| 药材名 | 频次 |
|--------|------|
| 药材1  | X次  |

要求：药材按频次从高到低排序。

### 任务2：逐方做君臣佐使分析
对每一个方剂依次输出：

### 君臣佐使组分分析

1）方剂名：
- 君药：xxx —— 简要说明核心功效
- 臣药：xxx —— 说明配合君药的作用
- 佐药：xxx —— 辅助治疗、缓和药性
- 使药：xxx —— 引经、调和诸药
- 侧重点：一两句话总结治疗思路

### 任务3：古方核心思路总结
概括这些古方的共通治疗思路、偏重方向、适配病机。

### 古方核心思路总结

（一小段总结文字）

【约束】
- 严格按上述顺序输出三个部分
- 使用 Markdown 格式
- 不要输出无关解释或思考过程"""


async def analysis_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.4)
    messages = [
        SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
        HumanMessage(
            content=f"以下是古方列表：\n\n{state['ancient_formulas']}\n\n"
            "请进行高频药材统计和君臣佐使分析。"
        ),
    ]
    response = await llm.ainvoke(messages, config=config)
    return {
        "herb_analysis": response.content,
        "current_step": "herb_analysis",
    }
