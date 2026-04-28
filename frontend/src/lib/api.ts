const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export interface StreamChatOptions {
  signal?: AbortSignal;
  resetPending?: boolean;
  onAbort?: () => void;
}

export async function streamChat(
  message: string,
  sessionId: string,
  onEvent: (event: string, data: any) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
  options: StreamChatOptions = {}
) {
  return _streamPost(
    "/api/chat",
    { message, session_id: sessionId, reset_pending: options.resetPending === true },
    onEvent,
    onError,
    onComplete,
    options
  );
}

export async function streamResume(
  sessionId: string,
  onEvent: (event: string, data: any) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
  options: StreamChatOptions = {}
) {
  return _streamPost(
    "/api/chat/resume",
    { session_id: sessionId },
    onEvent,
    onError,
    onComplete,
    options
  );
}

async function _streamPost(
  url: string,
  body: Record<string, unknown>,
  onEvent: (event: string, data: any) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
  options: StreamChatOptions
) {
  try {
    console.log(`[SSE] Sending request to ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    console.log("[SSE] Response status:", response.status);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    const processEventBlock = (block: string) => {
      if (!block.trim()) return;

      let eventName = "";
      let dataStr = "";

      for (const rawLine of block.split("\n")) {
        const line = rawLine.trimEnd();

        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataStr += (dataStr ? "\n" : "") + line.slice(5).trim();
        }
      }

      if (!eventName || !dataStr) return;

      console.log("[SSE] Event:", eventName, dataStr.substring(0, 100));
      try {
        const data = JSON.parse(dataStr);
        onEvent(eventName, data);
      } catch {
        onEvent(eventName, dataStr);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        processEventBlock(part);
      }
    }

    buffer += decoder.decode();
    buffer = buffer.replace(/\r\n/g, "\n");
    processEventBlock(buffer);

    console.log("[SSE] Stream complete");
    onComplete();
  } catch (error) {
    const err = error as Error;
    if (err.name === "AbortError") {
      console.log("[SSE] Aborted by client");
      options.onAbort?.();
      return;
    }
    console.error("[SSE] Error:", err);
    onError(err);
  }
}

export function getDownloadUrl(docId: string): string {
  return `${BACKEND_URL}/api/download/${docId}`;
}

export interface Conversation {
  session_id: string;
  title: string;
  intent: string;
  created_at: string;
  updated_at: string;
  pdf_path: string;
}

export interface ConversationDetail extends Conversation {
  steps: { id: string; label: string; content: string; status: string }[];
  final_markdown?: string;
  user_input?: string;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BACKEND_URL}/api/conversations`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations ?? [];
}

export async function fetchConversation(sessionId: string): Promise<ConversationDetail | null> {
  const res = await fetch(`${BACKEND_URL}/api/conversations/${sessionId}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function deleteConversation(sessionId: string): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/api/conversations/${sessionId}`, { method: "DELETE" });
  return res.ok;
}

export async function renameConversation(sessionId: string, title: string): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/api/conversations/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.ok;
}
