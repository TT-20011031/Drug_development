from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from state import ProductDevState
from llm import get_llm

FORMULA_SYSTEM_PROMPT = """你是一名擅长古今结合配方设计的中医药产品研发专家，具备用量换算与提取物计算能力。

【上游信息】
你会收到：标准化研发需求、古方列表、药材分析（高频+君臣佐使）、法规合规审查结果。

【你的任务】
在继承古方治法思路的前提下，结合法规合规性，设计一个新的现代产品配方。

【硬约束（必须严格遵守）】
若标准化研发需求中【指定/必须包含原料】非空（即不为"无"），这些原料**必须**完整出现在「一、生成新配方」表格的"品名"列中。
- 角色（君/臣/佐/使）由你根据中医配伍合理性判断，**可以是任意角色**
- 即使古方列表中没有这些原料，也要纳入并在「四、组方特色分析」中说明其角色与作用
- **不允许**以"功能不匹配""古方未出现"等理由删除指定原料
- 若适配度不高，应在配方中安排合理角色（如佐药、使药），并在第四节做出说明，而非剔除

【输出格式（必须严格遵守）】

### 一、生成新配方

| 品名 | 用量 | 功能定位 | 对应古方思路 |
|------|------|----------|-------------|
| 品名1 | Xg | 君/臣/佐/使 + 功能 | 承袭哪些古方思路 |

要求：
- 选取 3～6 味药食同源或保健食品允许的成分
- 标明君臣佐使角色
- 每味药关联到对应的古方思路；**指定原料**若不属于任何参考古方，可在该列填"用户指定主原料/辅料"
- 表格中必须显式包含【指定/必须包含原料】中的所有项

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

最后**必须**输出一项：

- **用户指定原料适配度**：逐一评估【指定/必须包含原料】中每味原料与本产品功效的契合度（高/中/低）。
  - 若适配度高：简述协同作用
  - 若适配度中或低：明确说明本配方的主要功效靠哪些其他药材承担，指定原料在此承担什么角色（如扶正培本、辅助提升整体免疫、调和诸药、引经等）
  - 表述要直白、不夸大，让读者清楚原料和功能的真实关系
  - 若【指定/必须包含原料】为"无"，本项写"无指定原料，不适用"

【约束】
- 必须考虑法规合规性，不可使用不合规的药材
- 所有表格用 Markdown 格式
- 不要输出思考过程"""


async def formula_agent(state: ProductDevState, config: RunnableConfig) -> dict:
    llm = get_llm(temperature=0.6)

    revision_instruction = (state.get("revision_instruction") or "").strip()
    is_revise = bool(revision_instruction) and bool(state.get("new_formula"))
    is_optimize = bool(state.get("substitution_analysis")) and not is_revise

    if is_revise:
        user_content = (
            f"【标准化研发需求】\n{state.get('standardized_req', '')}\n\n"
            f"【法规合规审查】\n{state.get('regulatory_check', '')}\n\n"
            f"【上一版配方（基线）】\n{state.get('new_formula', '')}\n\n"
            f"【用户最新修改指令】\n{revision_instruction}\n\n"
            "请在【上一版配方】基础上严格按【用户最新修改指令】进行最小化修订：\n"
            "- 仅调整指令涉及的内容（如增/删/替换药材、调整用量、修改含量指标、调整剂型等）；\n"
            "- 未提到的部分保持原有结构、君臣佐使分工与古方思路不变；\n"
            "- 若指令涉及成本或工艺约束，体现在「三、按组分数据库转化最终配方」的用量/选材取舍中，并在「四、组方特色分析」末尾追加一段【本轮修订说明】，列出本次具体改了什么、为什么；\n"
            "- 严格保留原有四节标题与表格格式。"
        )
    elif is_optimize:
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
