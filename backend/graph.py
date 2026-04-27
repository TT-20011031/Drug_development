from langgraph.graph import StateGraph, END
import aiosqlite
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from db import CHECKPOINT_DB_PATH
from state import ProductDevState
from agents import (
    router_agent,
    chitchat_agent,
    requirement_agent,
    ancient_agent,
    analysis_agent,
    regulatory_agent,
    formula_agent,
    engineer_agent,
    formula_parser_agent,
    substitution_agent,
    followup_agent,
)


REJECT_MESSAGE = "抱歉，我目前仅专注于产品研发、配方设计等相关领域的问答。请围绕产品开发相关话题重新提问。"


async def reject_node(state: ProductDevState) -> dict:
    return {
        "final_markdown": REJECT_MESSAGE,
        "current_step": "rejected",
    }


def route_by_intent(state: ProductDevState) -> str:
    intent = state.get("intent", "")
    if intent == "reject":
        return "reject"
    if intent == "chitchat":
        return "chitchat"
    if intent == "optimize":
        return "formula_parser"
    if intent == "followup":
        return "followup"
    return "requirement"


def build_graph() -> StateGraph:
    workflow = StateGraph(ProductDevState)

    workflow.add_node("router", router_agent)
    workflow.add_node("chitchat", chitchat_agent)
    workflow.add_node("requirement", requirement_agent)
    workflow.add_node("ancient", ancient_agent)
    workflow.add_node("analysis", analysis_agent)
    workflow.add_node("regulatory", regulatory_agent)
    workflow.add_node("formula", formula_agent)
    workflow.add_node("engineer", engineer_agent)
    workflow.add_node("reject", reject_node)
    workflow.add_node("formula_parser", formula_parser_agent)
    workflow.add_node("substitution", substitution_agent)
    workflow.add_node("followup", followup_agent)

    workflow.set_entry_point("router")

    workflow.add_conditional_edges(
        "router",
        route_by_intent,
        {
            "requirement": "requirement",
            "formula_parser": "formula_parser",
            "followup": "followup",
            "chitchat": "chitchat",
            "reject": "reject",
        },
    )

    workflow.add_edge("requirement", "ancient")
    workflow.add_edge("ancient", "analysis")
    workflow.add_edge("analysis", "regulatory")
    workflow.add_edge("regulatory", "formula")
    workflow.add_edge("formula", "engineer")
    workflow.add_edge("engineer", END)

    # optimize branch: formula_parser → substitution → regulatory → formula → engineer
    workflow.add_edge("formula_parser", "substitution")
    workflow.add_edge("substitution", "regulatory")

    workflow.add_edge("followup", END)
    workflow.add_edge("chitchat", END)
    workflow.add_edge("reject", END)

    return workflow


async def get_compiled_graph():
    conn = await aiosqlite.connect(CHECKPOINT_DB_PATH)
    checkpointer = AsyncSqliteSaver(conn)
    await checkpointer.setup()
    workflow = build_graph()
    return workflow.compile(checkpointer=checkpointer)
