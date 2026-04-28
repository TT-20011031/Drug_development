from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

ENGINEER_SYSTEM_PROMPT = """你是一名中医药产品研发工程师，负责生成生产端技术配方方案。
此文档用于生产工艺、提取量计算和成本评估。

【结构要求】
你只能输出以下内容，顺序必须完全一致：

# {产品名称}

### 功效
不超过 2 行，根据上游信息提炼。

### 主治
不超过 3 行，描述主要病机方向。

### 适宜人群
不超过 3 行，与主治直接相关。

### 原料适配度说明
1～2 行：列出本配方包含的"用户指定原料"（来自上游【指定/必须包含原料】），并直白说明它们与本品主功效的关系。
- 若适配度高：简述协同作用，例如"灵芝补气安神 → 与本品助眠功效高度契合"
- 若适配度中/低：明确说明"X 的核心功效为 A，与本品 B 功效非直接对应，本品 B 功效主要由 Y、Z 等承担，X 在本方中起 C 作用（如扶正培本、辅助提升整体状态等）"
- 若上游标注无指定原料：本节写"本品无用户指定主原料约束，配方设计完全基于功能与古方思路"

### 配伍分析
按君药 → 臣药 → 佐药 → 使药解释本配方结构。最后 1 行总结适应证候。

### 新配方组成

| 药材 | 用量 |
|------|------|
| 药材1 | Xg |

服用量：每日X次，每次Xg/ml

### 含量预测

| 药材名称 | 活性成分 | 活性成分含量 | 转移率 |
|----------|----------|-------------|--------|
| 药材1 | 成分名 | X% | X% |

### 推荐工艺
（一行，箭头连接格式）
清洗 → 粉碎 → 提取（提取两次，8倍水每次1小时）→ 过滤 → 浓缩 → 干燥 → 混合 → 制粒 → 压片/包装

### 成本预测

| 原辅料 | 单价（元/kg） | 用量（g） | 小计（元） |
|--------|--------------|-----------|-----------|
| 原料1 | XXX | X | X.XX |
| **合计** | | | **X.XX元** |

每公斤成本：XXX元/kg
（给出计算过程）

【禁止内容】
- 产品市场定位、包装设计、竞品分析
- 创新亮点、安全性说明、注意事项
- 代码块（```）、mermaid、引用块（>）
- 任何未在模板中的额外段落

【要求】
- 产品名称根据配方特征自动生成（如：灵芝酸枣仁口服液、铁皮石斛清咽含片等）
- 含量和成本数据需基于合理推算
- 以标准 Markdown 格式输出"""


async def engineer_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.5)

    is_optimize = bool(state.get("substitution_analysis"))

    if is_optimize:
        input_content = (
            f"【原方解析】\n{state.get('original_formula', '')}\n\n"
            f"【新配方设计】\n{state['new_formula']}\n\n"
            "请根据以上信息，生成完整的产品技术文档。"
        )
    else:
        input_content = (
            f"【标准化研发需求】\n{state['standardized_req']}\n\n"
            f"【新配方设计】\n{state['new_formula']}\n\n"
            "请根据以上信息，生成完整的产品技术文档。"
        )

    messages = [
        SystemMessage(content=ENGINEER_SYSTEM_PROMPT),
        HumanMessage(content=input_content),
    ]
    response = await llm.ainvoke(messages, config=config)

    sep = "\n\n---\n\n"
    if is_optimize:
        sections = [
            state.get("original_formula", ""),
            state.get("substitution_analysis", ""),
            state.get("regulatory_check", ""),
            state.get("new_formula", ""),
            response.content,
        ]
    else:
        sections = [
            state.get("standardized_req", ""),
            state.get("ancient_formulas", ""),
            state.get("herb_analysis", ""),
            state.get("regulatory_check", ""),
            state.get("new_formula", ""),
            response.content,
        ]

    full_markdown = sep.join(s for s in sections if s)

    return {
        "product_spec": response.content,
        "final_markdown": full_markdown,
        "original_report": full_markdown,
        "current_step": "product_spec",
        "revision_instruction": "",
    }
