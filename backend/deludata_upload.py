from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any

try:
    import httpx
except ModuleNotFoundError:  # Keep PDF generation usable before requirements are installed.
    httpx = None


logger = logging.getLogger("product_dev.deludata_upload")

DELUDATA_USERNAME = "test1"
TARGET_DEPARTMENT_ID = 22
TARGET_DEPARTMENT_NAME = "研发部"
TARGET_FOLDER_NAME = "新药研发报告"
TARGET_FOLDER_PATH = (TARGET_DEPARTMENT_NAME, TARGET_FOLDER_NAME)
TARGET_FOLDER_LABEL = "/".join(TARGET_FOLDER_PATH)
INVALID_FILENAME_CHARS = re.compile(r'[\\/:*?"<>|\r\n\t]+')


class DeluDataUploadError(Exception):
    pass


def _normalize_upload_filename(filename: str | None, fallback: str) -> str:
    cleaned = INVALID_FILENAME_CHARS.sub("", (filename or "").strip())
    cleaned = cleaned.strip(" .")
    if not cleaned:
        cleaned = fallback
    if not cleaned.lower().endswith(".pdf"):
        cleaned += ".pdf"
    return cleaned


def _api_base_url() -> str:
    return os.getenv("DELUDATA_BASE_URL", "http://127.0.0.1:8031/api").rstrip("/")


def _extract_error(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None

    if isinstance(payload, dict):
        detail = payload.get("detail") or payload.get("error") or payload.get("message")
        if detail:
            return str(detail)
    text = response.text.strip()
    return text or f"HTTP {response.status_code}"


async def _checked_request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    **kwargs: Any,
) -> httpx.Response:
    response = await client.request(method, url, **kwargs)
    if response.status_code >= 400:
        raise DeluDataUploadError(_extract_error(response))
    return response


async def _login(client: httpx.AsyncClient, base_url: str) -> str:
    password = os.getenv("DELUDATA_TEST1_PASSWORD")
    if not password:
        raise DeluDataUploadError("缺少环境变量 DELUDATA_TEST1_PASSWORD")

    response = await _checked_request(
        client,
        "POST",
        f"{base_url}/auth/login",
        json={"username": DELUDATA_USERNAME, "password": password},
    )
    payload = response.json()
    token = payload.get("access_token") if isinstance(payload, dict) else None
    if not token:
        raise DeluDataUploadError("DeluData 登录成功但未返回 access_token")
    return str(token)


def _find_folder(nodes: list[dict[str, Any]], name: str) -> dict[str, Any] | None:
    for node in nodes:
        if node.get("type") == "folder" and node.get("name") == name:
            return node
    return None


async def _load_structure(
    client: httpx.AsyncClient,
    base_url: str,
    headers: dict[str, str],
    params: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    response = await _checked_request(
        client,
        "GET",
        f"{base_url}/knowledge/structure",
        headers=headers,
        params=params,
    )
    payload = response.json()
    if not isinstance(payload, list):
        raise DeluDataUploadError("DeluData 文件夹结构响应格式异常")
    return payload


async def _create_folder(
    client: httpx.AsyncClient,
    base_url: str,
    headers: dict[str, str],
    name: str,
    parent_id: str | None,
    dept_id: int | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"name": name, "parent_id": parent_id, "visibility": "dept"}
    if dept_id is not None:
        payload["dept_id"] = dept_id

    response = await _checked_request(
        client,
        "POST",
        f"{base_url}/knowledge/folders",
        headers=headers,
        json=payload,
    )
    payload = response.json()
    if not isinstance(payload, dict) or not payload.get("id"):
        raise DeluDataUploadError(f"创建文件夹“{name}”后未返回 id")
    return payload


async def _ensure_target_folder(
    client: httpx.AsyncClient,
    base_url: str,
    headers: dict[str, str],
) -> str:
    # DeluData's UI treats "研发部" as a department scope, not as a normal
    # folder. Scope to dept_22 so we hit the same folder tree users see.
    nodes = await _load_structure(
        client,
        base_url,
        headers,
        params={"scope": f"dept_{TARGET_DEPARTMENT_ID}"},
    )
    folder = _find_folder(nodes, TARGET_FOLDER_NAME)
    if folder is None:
        folder = await _create_folder(
            client,
            base_url,
            headers,
            TARGET_FOLDER_NAME,
            parent_id=None,
            dept_id=TARGET_DEPARTMENT_ID,
        )

    folder_id = folder.get("id")
    if not folder_id:
        raise DeluDataUploadError("目标知识库文件夹解析失败")
    return str(folder_id)


async def _upload_file(
    client: httpx.AsyncClient,
    base_url: str,
    headers: dict[str, str],
    pdf_path: str,
    folder_id: str,
    upload_filename: str | None = None,
) -> dict[str, Any]:
    path = Path(pdf_path)
    if not path.exists():
        raise DeluDataUploadError("PDF 文件不存在，无法上传")
    filename = _normalize_upload_filename(upload_filename, path.name)

    data = {
        "name": filename,
        "description": "Drug_development 自动上传的研发报告",
        "folder_id": folder_id,
        "target_dept_id": str(TARGET_DEPARTMENT_ID),
        "visibility": "dept",
        "document_type": "research_report",
        "business_domain": "新药研发",
    }
    with path.open("rb") as source:
        response = await _checked_request(
            client,
            "POST",
            f"{base_url}/knowledge/upload",
            headers=headers,
            data=data,
            files={"file": (filename, source, "application/pdf")},
        )

    payload = response.json()
    if not isinstance(payload, dict):
        raise DeluDataUploadError("DeluData 上传响应格式异常")
    return payload


async def upload_pdf_to_deludata(pdf_path: str, upload_filename: str | None = None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "enabled": True,
        "ok": False,
        "document_id": None,
        "task_id": None,
        "folder_path": TARGET_FOLDER_LABEL,
        "message": "",
    }

    if httpx is None:
        result["message"] = "缺少 Python 依赖 httpx，请先安装 backend/requirements.txt"
        return result

    base_url = _api_base_url()
    timeout = httpx.Timeout(90.0, connect=10.0)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            token = await _login(client, base_url)
            headers = {"Authorization": f"Bearer {token}"}
            folder_id = await _ensure_target_folder(client, base_url, headers)
            payload = await _upload_file(
                client,
                base_url,
                headers,
                pdf_path,
                folder_id,
                upload_filename=upload_filename,
            )

        result.update(
            {
                "ok": True,
                "document_id": payload.get("document_id"),
                "task_id": payload.get("task_id"),
                "message": "上传成功，正在入库处理",
            }
        )
    except DeluDataUploadError as exc:
        result["message"] = str(exc)
        logger.warning("DeluData upload failed: %s", exc)
    except httpx.RequestError as exc:
        result["message"] = f"DeluData_pro 服务不可达：{exc}"
        logger.warning("DeluData service unreachable: %s", exc)
    except Exception as exc:
        result["message"] = f"上传到 DeluData_pro 失败：{exc}"
        logger.exception("Unexpected DeluData upload error")

    return result
