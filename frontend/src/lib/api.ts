const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function streamChat(
  message: string,
  sessionId: string,
  onEvent: (event: string, data: any) => void,
  onError: (error: Error) => void,
  onComplete: () => void
) {
  try {
    console.log("[SSE] Sending request via Next.js proxy /api/chat");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
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
    console.error("[SSE] Error:", error);
    onError(error as Error);
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
