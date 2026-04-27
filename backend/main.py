import asyncio
import json
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sse_starlette.sse import EventSourceResponse

from graph import get_compiled_graph
from output.pdf_export import markdown_to_pdf
from db import init_db, create_conversation, update_conversation, list_conversations, get_conversation, delete_conversation

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("product_dev")

STEP_LABELS = {
    "router": "智能理解",
    "chitchat": "智能回复",
    "followup": "追问回复",
    "requirement": "步骤一",
    "ancient_formulas": "步骤二",
    "herb_analysis": "步骤三",
    "formula_parse": "步骤一",
    "substitution": "步骤二",
    "regulatory_check": "步骤四",
    "new_formula": "步骤五",
    "product_spec": "步骤六",
    "rejected": "已拒绝",
}

INTENT_LABELS = {
    "research": "新研发需求",
    "followup": "方案追问/迭代",
    "optimize": "古方优化/替代",
    "chitchat": "日常闲聊",
    "reject": "非产品研发请求",
}

STEP_FIELDS = {
    "requirement": "standardized_req",
    "ancient_formulas": "ancient_formulas",
    "herb_analysis": "herb_analysis",
    "formula_parse": "original_formula",
    "substitution": "substitution_analysis",
    "regulatory_check": "regulatory_check",
    "new_formula": "new_formula",
    "product_spec": "product_spec",
}

STEP_NODE_MAP = {
    "router": "router",
    "requirement": "requirement",
    "ancient": "ancient_formulas",
    "analysis": "herb_analysis",
    "formula_parser": "formula_parse",
    "substitution": "substitution",
    "regulatory": "regulatory_check",
    "formula": "new_formula",
    "engineer": "product_spec",
}

VISIBLE_STEPS = {
    "router",
    "requirement",
    "ancient_formulas",
    "herb_analysis",
    "formula_parse",
    "substitution",
    "regulatory_check",
    "new_formula",
    "product_spec",
}

graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global graph
    await init_db()
    graph = await get_compiled_graph()
    yield


app = FastAPI(title="寿仙谷智能产品研发助手", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

sessions: dict[str, str] = {}


@app.post("/api/chat")
async def chat_endpoint(request: Request):
    body = await request.json()
    user_input = body.get("message", "")
    session_id = body.get("session_id", str(uuid.uuid4()))

    if not user_input.strip():
        return JSONResponse({"error": "消息不能为空"}, status_code=400)

    conv = await get_conversation(session_id)
    if not conv:
        title = user_input[:30] + ("…" if len(user_input) > 30 else "")
        await create_conversation(session_id, title=title)
    else:
        await update_conversation(session_id)

    async def event_generator():
        def is_visible_step(step: str) -> bool:
            return step in VISIBLE_STEPS

        config = {"configurable": {"thread_id": session_id}}
        input_state = {
            "user_input": user_input,
            "messages": [("human", user_input)],
            "intent": "",
            "standardized_req": "",
            "ancient_formulas": "",
            "herb_analysis": "",
            "original_formula": "",
            "substitution_analysis": "",
            "regulatory_check": "",
            "new_formula": "",
            "product_spec": "",
            "final_markdown": "",
            "current_step": "",
        }

        logger.info(f"[SSE] Start session={session_id} input={user_input[:50]}")

        yield {
            "event": "session",
            "data": json.dumps({"session_id": session_id}),
        }

        last_step = ""
        step_start_time = time.time()
        final_state = None
        total_start = time.time()
        current_node = ""
        node_step_map = {}
        token_buffer = {}

        try:
            async for ev in graph.astream_events(
                input_state, config=config, version="v2"
            ):
                kind = ev["event"]
                metadata = ev.get("metadata", {})
                node = metadata.get("langgraph_node", "")

                if kind == "on_chain_start" and node and node != current_node:
                    current_node = node
                    step_id = STEP_NODE_MAP.get(node, "")
                    if step_id and is_visible_step(step_id) and step_id != last_step:
                        if last_step and is_visible_step(last_step):
                            elapsed = round(time.time() - step_start_time, 1)
                            yield {
                                "event": "step_done",
                                "data": json.dumps(
                                    {
                                        "step": last_step,
                                        "label": STEP_LABELS.get(last_step, last_step),
                                        "duration": elapsed,
                                    },
                                    ensure_ascii=False,
                                ),
                            }
                        step_start_time = time.time()
                        yield {
                            "event": "step_start",
                            "data": json.dumps(
                                {
                                    "step": step_id,
                                    "label": STEP_LABELS.get(step_id, step_id),
                                },
                                ensure_ascii=False,
                            ),
                        }
                        last_step = step_id

                if kind == "on_chain_end" and node:
                    output = ev.get("data", {}).get("output", {})
                    if not isinstance(output, dict):
                        continue

                    current_step = output.get("current_step", "")
                    if not current_step:
                        continue
                    node_step_map[node] = current_step
                    logger.info(f"[SSE] chain_end node={node} step={current_step}")

                    if current_step != last_step:
                        if last_step and is_visible_step(last_step):
                            elapsed = round(time.time() - step_start_time, 1)
                            yield {
                                "event": "step_done",
                                "data": json.dumps(
                                    {
                                        "step": last_step,
                                        "label": STEP_LABELS.get(last_step, last_step),
                                        "duration": elapsed,
                                    },
                                    ensure_ascii=False,
                                ),
                            }

                        step_start_time = time.time()
                        last_step = current_step

                    if current_step and is_visible_step(current_step) and current_step != "router":
                        field = STEP_FIELDS.get(current_step, "")
                        content_md = output.get(field, "") if field else ""
                        if content_md:
                            yield {
                                "event": "step_content",
                                "data": json.dumps(
                                    {"step": current_step, "content": content_md},
                                    ensure_ascii=False,
                                ),
                            }

                    if current_step == "router" and output.get("intent"):
                        intent = output["intent"]
                        await update_conversation(session_id, intent=intent)
                        route_map = {
                            "research": "进入产品研发流程",
                            "followup": "基于已有报告回复追问",
                            "optimize": "进入古方优化流程",
                            "chitchat": "直接回复闲聊",
                            "reject": "终止流程",
                        }
                        route_target = route_map.get(intent, "终止流程")
                        yield {
                            "event": "step_content",
                            "data": json.dumps(
                                {
                                    "step": "router",
                                    "content": (
                                        "### 智能理解结果\n"
                                        f"- **分类**：{INTENT_LABELS.get(intent, intent)}\n"
                                        f"- **路由结果**：{route_target}"
                                    ),
                                },
                                ensure_ascii=False,
                            ),
                        }

                    if current_step in ("chitchat", "followup"):
                        yield {
                            "event": "chat_reply",
                            "data": json.dumps(
                                {"message": output.get("final_markdown", "")},
                                ensure_ascii=False,
                            ),
                        }

                    if current_step == "rejected":
                        yield {
                            "event": "rejected",
                            "data": json.dumps(
                                {"message": output.get("final_markdown", "")},
                                ensure_ascii=False,
                            ),
                        }

                    final_state = output

                if kind == "on_chat_model_start" and node:
                    step_id = STEP_NODE_MAP.get(node, "")
                    if step_id and is_visible_step(step_id):
                        if step_id != last_step:
                            if last_step and is_visible_step(last_step):
                                elapsed = round(time.time() - step_start_time, 1)
                                yield {
                                    "event": "step_done",
                                    "data": json.dumps(
                                        {
                                            "step": last_step,
                                            "label": STEP_LABELS.get(last_step, last_step),
                                            "duration": elapsed,
                                        },
                                        ensure_ascii=False,
                                    ),
                                }
                            step_start_time = time.time()
                            yield {
                                "event": "step_start",
                                "data": json.dumps(
                                    {
                                        "step": step_id,
                                        "label": STEP_LABELS.get(step_id, step_id),
                                    },
                                    ensure_ascii=False,
                                ),
                            }
                            last_step = step_id
                            token_buffer[step_id] = ""

                if kind == "on_chat_model_stream" and node:
                    chunk = ev.get("data", {}).get("chunk")
                    if chunk:
                        token = chunk.content if hasattr(chunk, "content") else str(chunk)
                        if token:
                            step_id = STEP_NODE_MAP.get(node, "")
                            if step_id and is_visible_step(step_id):
                                token_buffer.setdefault(step_id, "")
                                token_buffer[step_id] += token
                                yield {
                                    "event": "step_token",
                                    "data": json.dumps(
                                        {"step": step_id, "token": token},
                                        ensure_ascii=False,
                                    ),
                                }

            if last_step and is_visible_step(last_step):
                elapsed = round(time.time() - step_start_time, 1)
                yield {
                    "event": "step_done",
                    "data": json.dumps(
                        {
                            "step": last_step,
                            "label": STEP_LABELS.get(last_step, last_step),
                            "duration": elapsed,
                        },
                        ensure_ascii=False,
                    ),
                }

            total_elapsed = round(time.time() - total_start, 1)

            final_md = ""
            if final_state and "final_markdown" in final_state:
                final_md = final_state["final_markdown"]

            pdf_path = None
            doc_id = None
            if final_md and final_md != "":
                doc_id = uuid.uuid4().hex[:8]
                pdf_path = markdown_to_pdf(
                    final_md, f"product_dev_{doc_id}.pdf"
                )
                sessions[doc_id] = pdf_path
                await update_conversation(session_id, pdf_path=pdf_path)

            yield {
                "event": "complete",
                "data": json.dumps(
                    {
                        "doc_id": doc_id,
                        "doc_url": f"/api/download/{doc_id}" if doc_id else None,
                        "total_duration": total_elapsed,
                    },
                    ensure_ascii=False,
                ),
            }
            logger.info(f"[SSE] Complete total={total_elapsed}s doc={doc_id}")

        except Exception as e:
            logger.error(f"[SSE] Error: {e}", exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps(
                    {"message": f"处理出错：{str(e)}"},
                    ensure_ascii=False,
                ),
            }

    return EventSourceResponse(event_generator())


@app.get("/api/download/{doc_id}")
async def download_doc(doc_id: str):
    filepath = sessions.get(doc_id)
    if not filepath or not os.path.exists(filepath):
        return JSONResponse({"error": "文件不存在"}, status_code=404)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=os.path.basename(filepath),
    )


@app.get("/api/conversations")
async def api_list_conversations():
    convs = await list_conversations()
    return {"conversations": convs}


@app.get("/api/conversations/{session_id}")
async def api_get_conversation(session_id: str):
    conv = await get_conversation(session_id)
    if not conv:
        return JSONResponse({"error": "对话不存在"}, status_code=404)

    result = {**conv, "steps": []}

    config = {"configurable": {"thread_id": session_id}}
    try:
        state = await graph.aget_state(config)
        if state and state.values:
            vals = state.values
            steps_data = []
            intent = vals.get("intent", "")
            if intent in ("research", "followup"):
                step_ids = ["router", "requirement", "ancient_formulas", "herb_analysis",
                            "regulatory_check", "new_formula", "product_spec"]
            elif intent == "optimize":
                step_ids = ["router", "formula_parse", "substitution",
                            "regulatory_check", "new_formula", "product_spec"]
            else:
                step_ids = ["router"]

            for sid in step_ids:
                field = STEP_FIELDS.get(sid)
                content = ""
                if sid == "router":
                    content = f"意图：{INTENT_LABELS.get(intent, intent)}"
                elif field and vals.get(field):
                    content = vals[field]
                if content:
                    steps_data.append({
                        "id": sid,
                        "label": STEP_LABELS.get(sid, sid),
                        "content": content,
                        "status": "done",
                    })
            result["steps"] = steps_data
            result["final_markdown"] = vals.get("final_markdown", "")
    except Exception as e:
        logger.warning(f"Failed to load state for {session_id}: {e}")

    return result


@app.delete("/api/conversations/{session_id}")
async def api_delete_conversation(session_id: str):
    deleted = await delete_conversation(session_id)
    if not deleted:
        return JSONResponse({"error": "对话不存在"}, status_code=404)
    return {"ok": True}


@app.patch("/api/conversations/{session_id}")
async def api_rename_conversation(session_id: str, request: Request):
    body = await request.json()
    title = body.get("title", "").strip()
    if not title:
        return JSONResponse({"error": "标题不能为空"}, status_code=400)
    await update_conversation(session_id, title=title)
    return {"ok": True}


@app.get("/api/health")
async def health():
    return {"status": "ok", "model": os.getenv("QWEN_MODEL", "qwen-plus")}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=9527, reload=True)
