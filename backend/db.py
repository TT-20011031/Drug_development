import os
import aiosqlite
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DB_DIR, exist_ok=True)

DB_PATH = os.path.join(DB_DIR, "app.db")
CHECKPOINT_DB_PATH = os.path.join(DB_DIR, "checkpoints.db")

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS conversations (
    session_id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '新对话',
    intent TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    pdf_path TEXT DEFAULT ''
);
"""


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_TABLE)
        await db.commit()


async def create_conversation(session_id: str, title: str = "新对话") -> dict:
    now = datetime.now().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR REPLACE INTO conversations (session_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (session_id, title, now, now),
        )
        await db.commit()
    return {"session_id": session_id, "title": title, "created_at": now, "updated_at": now}


async def update_conversation(session_id: str, **kwargs) -> None:
    fields = []
    values = []
    for key in ("title", "intent", "pdf_path"):
        if key in kwargs:
            fields.append(f"{key} = ?")
            values.append(kwargs[key])
    if not fields:
        return
    fields.append("updated_at = ?")
    values.append(datetime.now().isoformat())
    values.append(session_id)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"UPDATE conversations SET {', '.join(fields)} WHERE session_id = ?",
            values,
        )
        await db.commit()


async def list_conversations(limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT session_id, title, intent, created_at, updated_at, pdf_path "
            "FROM conversations ORDER BY updated_at DESC LIMIT ?",
            (limit,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_conversation(session_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT session_id, title, intent, created_at, updated_at, pdf_path "
            "FROM conversations WHERE session_id = ?",
            (session_id,),
        )
        row = await cursor.fetchone()
        return dict(row) if row else None


async def delete_conversation(session_id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM conversations WHERE session_id = ?",
            (session_id,),
        )
        await db.commit()
        return cursor.rowcount > 0
