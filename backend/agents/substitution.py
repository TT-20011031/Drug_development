from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

SUBSTITUTION_SYSTEM_PROMPT = """你是一位精通中药替代与现代药理学的中医药研发专家。

【你的任务】
根据上游提供的原方解析结果，对所有标记为 ⚠️ 稀缺或 ❌ 禁用/已无的药材，逐一推荐替代药材。

【替代分析维度】
对每个需要替代的药材，从以下维度分析：
1. **性味归经相似度** — 替代药材的性味归经应与原药材尽量接近
2. **功效等效性** — 核心功效方向一致
3. **现代药理依据** — 有现代研究支持的药理等效性
4. **市场可得性** — 替代药材必须在市场上容易采购
5. **配伍安全性** — 替代后不产生配伍禁忌（十八反、十九畏）

【输出格式（必须严格遵守）】

### 药材替代方案

对每个问题药材输出：

#### [原药材名]（[原角色]）→ 推荐替代

| 替代选项 | 性味归经 | 核心功效 | 药理依据 | 可得性 | 推荐度 |
|----------|----------|----------|----------|--------|--------|
| 替代药1 | 性味/归经 | 功效说明 | 现代研究支持 | ✅ 易得 | ⭐⭐⭐ |
| 替代药2 | 性味/归经 | 功效说明 | 现代研究支持 | ✅ 易得 | ⭐⭐ |

**推荐首选**：XXX
**替代理由**：简要说明为什么首选该药材

---

（多个问题药材依次输出）

### 替代后配伍评估

- 替代后整体配伍是否协调
- 是否存在新的配伍禁忌
- 对原方核心治法的影响评估
- 替代后的方剂整体功效变化

### 替代后方剂组成

| 药材名 | 用量 | 角色 | 来源 |
|--------|------|------|------|
| 药材1 | Xg | 君药 | 原方保留 |
| 药材2 | Xg | 臣药 | 替代 XX |

【注意】
- 每个问题药材至少提供 2 个替代选项
- 推荐度用 ⭐ 表示（1-3星）
- 替代药材必须是药食同源目录或保健食品原料目录中的品种优先
- 使用 Markdown 格式输出"""


async def substitution_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.4)
    messages = [
        SystemMessage(content=SUBSTITUTION_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"以下是原方解析结果：\n\n{state['original_formula']}\n\n"
                "请对所有问题药材进行替代分析，并输出替代后的完整方剂组成。"
            )
        ),
    ]
    response = await llm.ainvoke(messages, config=config)
    return {
        "substitution_analysis": response.content,
        "current_step": "substitution",
    }
