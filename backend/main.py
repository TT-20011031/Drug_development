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

load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("product_dev")

STEP_LABELS = {
    "router": "智能理解",
    "chitchat": "智能回复",
    "followup": "追问回复",
    "revise": "需求修订",
    "requirement": "需求解析",
    "ancient_formulas": "古方检索",
    "herb_analysis": "药材分析",
    "formula_parse": "古方解析",
    "substitution": "替代分析",
    "regulatory_check": "法规审核",
    "new_formula": "配方设计",
    "product_spec": "产品规格",
    "rejected": "已拒绝",
}

INTENT_LABELS = {
    "research": "新研发需求",
    "followup": "方案追问",
    "revise": "报告修订",
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


def _build_event_generator(session_id: str, input_state):
    """构造 SSE 事件生成器。
    - input_state 为 dict 时，按新输入启动 graph
    - input_state 为 None 时，从 checkpoint 恢复（resume）
    """

    async def event_generator():
        def is_visible_step(step: str) -> bool:
            return step in VISIBLE_STEPS

        config = {"configurable": {"thread_id": session_id}}

        is_resume = input_state is None
        logger.info(
            f"[SSE] Start session={session_id} mode={'resume' if is_resume else 'new'}"
        )

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
                            "revise": "重新生成配方与产品规格",
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

                    if current_step == "chitchat":
                        yield {
                            "event": "chat_reply",
                            "data": json.dumps(
                                {"message": output.get("final_markdown", "")},
                                ensure_ascii=False,
                            ),
                        }

                    if current_step == "followup":
                        yield {
                            "event": "chat_reply",
                            "data": json.dumps(
                                {"message": output.get("followup_reply", "")},
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

            # 取 graph 中最终持久化的 state，避免依赖最后一个节点 output
            try:
                state_snapshot = await graph.aget_state(config)
                state_vals = state_snapshot.values if state_snapshot else {}
            except Exception:
                state_vals = {}

            final_intent = (state_vals.get("intent") or (final_state or {}).get("intent") or "")
            final_md = state_vals.get("final_markdown", "") or (final_state or {}).get("final_markdown", "")

            pdf_path = None
            doc_id = None
            # 仅当走到完整报告产出时（research/optimize/revise）才重生 PDF
            if final_md and final_intent in ("research", "optimize", "revise"):
                doc_id = uuid.uuid4().hex[:8]
                pdf_path = markdown_to_pdf(
                    final_md, f"product_dev_{doc_id}.pdf"
                )
                sessions[doc_id] = pdf_path
                await update_conversation(session_id, pdf_path=pdf_path)

            # revise 完成时追加一条简短提示，便于前端聊天区显示
            if final_intent == "revise":
                yield {
                    "event": "chat_reply",
                    "data": json.dumps(
                        {"message": "\u2705 \u5df2\u6839\u636e\u60a8\u7684\u6307\u4ee4\u91cd\u65b0\u751f\u6210\u914d\u65b9\u4e0e\u4ea7\u54c1\u89c4\u683c\uff0c\u8bf7\u67e5\u770b\u5de6\u4fa7\u62a5\u544a\u4e0e\u65b0\u7684 PDF\u3002"},
                        ensure_ascii=False,
                    ),
                }

            yield {
                "event": "complete",
                "data": json.dumps(
                    {
                        "doc_id": doc_id,
                        "doc_url": f"/api/download/{doc_id}" if doc_id else None,
                        "total_duration": total_elapsed,
                        "intent": final_intent,
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

    return event_generator


@app.post("/api/chat")
async def chat_endpoint(request: Request):
    body = await request.json()
    user_input = body.get("message", "")
    session_id = body.get("session_id", str(uuid.uuid4()))
    reset_pending = bool(body.get("reset_pending", False))

    if not user_input.strip():
        return JSONResponse({"error": "消息不能为空"}, status_code=400)

    conv = await get_conversation(session_id)
    if not conv:
        title = user_input[:30] + ("…" if len(user_input) > 30 else "")
        await create_conversation(session_id, title=title)
    else:
        await update_conversation(session_id)

    # 用户在暂停后选择「修改问题」时，先把上一次未完成的 checkpoint 清掉，避免新输入被并到旧 pending 任务上
    if reset_pending and graph is not None:
        try:
            await graph.checkpointer.adelete_thread(session_id)
            logger.info(f"[SSE] Checkpoint wiped (reset_pending) session={session_id}")
        except Exception as e:
            logger.warning(f"[SSE] Failed to wipe checkpoint: {e}")

    input_state = {
        "user_input": user_input,
        "messages": [("human", user_input)],
        "intent": "",
        "current_step": "",
        "revision_instruction": "",
        "followup_reply": "",
    }
    return EventSourceResponse(_build_event_generator(session_id, input_state)())


@app.post("/api/chat/resume")
async def chat_resume_endpoint(request: Request):
    body = await request.json()
    session_id = body.get("session_id", "")
    if not session_id:
        return JSONResponse({"error": "session_id required"}, status_code=400)

    config = {"configurable": {"thread_id": session_id}}

    # 检查是否有可继续的 pending 任务
    has_pending = False
    if graph is not None:
        try:
            snap = await graph.aget_state(config)
            has_pending = bool(snap and getattr(snap, "next", None))
        except Exception as e:
            logger.warning(f"[Resume] aget_state failed: {e}")

    if not has_pending:
        async def empty_gen():
            yield {
                "event": "session",
                "data": json.dumps({"session_id": session_id}),
            }
            yield {
                "event": "complete",
                "data": json.dumps(
                    {
                        "doc_id": None,
                        "doc_url": None,
                        "total_duration": 0,
                        "intent": "",
                        "message": "没有可继续的任务",
                    },
                    ensure_ascii=False,
                ),
            }
        return EventSourceResponse(empty_gen())

    return EventSourceResponse(_build_event_generator(session_id, None)())


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
            result["user_input"] = vals.get("user_input", "")
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

    uvicorn.run("main:app", host="0.0.0.0", port=9603, reload=True)
