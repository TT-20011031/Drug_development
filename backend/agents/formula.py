from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

FORMULA_SYSTEM_PROMPT = """你是一名擅长古今结合配方设计的中医药产品研发专家，具备用量换算与提取物计算能力。

【上游信息】
你会收到：标准化研发需求、古方列表、药材分析（高频+君臣佐使）、法规合规审查结果。

【你的任务】
在继承古方治法思路的前提下，结合法规合规性，设计一个新的现代产品配方。

【输出格式（必须严格遵守）】

### 一、生成新配方

| 品名 | 用量 | 功能定位 | 对应古方思路 |
|------|------|----------|-------------|
| 品名1 | Xg | 君/臣/佐/使 + 功能 | 承袭哪些古方思路 |

要求：
- 选取 3～6 味药食同源或保健食品允许的成分
- 标明君臣佐使角色
- 每味药关联到对应的古方思路

### 二、查找组分数据库

| 品名 | 提取得率 | 主要含量指标 |
|------|----------|-------------|
| 品名1提取物 | XX% | 关键成分含量说明 |

### 三、按组分数据库转化最终配方

| 品名 | 用量 |
|------|------|
| 品名1提取物 | 用量（原始×得率） |
| 辅料 | 用量 |

### 四、组方特色分析

对每个参考古方，说明：
- 保留了什么核心药对/思路
- 新增了什么、为什么
- 去除了什么、原因
- 最终整体评价

【约束】
- 必须考虑法规合规性，不可使用不合规的药材
- 所有表格用 Markdown 格式
- 不要输出思考过程"""


async def formula_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.6)

    is_optimize = bool(state.get("substitution_analysis"))

    if is_optimize:
        user_content = (
            f"【原方解析】\n{state.get('original_formula', '')}\n\n"
            f"【药材替代分析】\n{state['substitution_analysis']}\n\n"
            f"【法规合规审查】\n{state['regulatory_check']}\n\n"
            "请基于替代后的方剂组成，设计一个现代化产品配方。"
            "注意：在「四、组方特色分析」中，说明相对原方做了哪些替代、为什么。"
        )
    else:
        user_content = (
            f"【标准化研发需求】\n{state['standardized_req']}\n\n"
            f"【古方列表】\n{state['ancient_formulas']}\n\n"
            f"【药材分析】\n{state['herb_analysis']}\n\n"
            f"【法规合规审查】\n{state['regulatory_check']}\n\n"
            "请综合以上信息，设计一个新的现代产品配方。"
        )

    messages = [
        SystemMessage(content=FORMULA_SYSTEM_PROMPT),
        HumanMessage(content=user_content),
    ]
    response = await llm.ainvoke(messages, config=config)
    return {
        "new_formula": response.content,
        "current_step": "new_formula",
    }
