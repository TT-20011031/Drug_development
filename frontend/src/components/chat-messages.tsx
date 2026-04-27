"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FileText } from "lucide-react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  onViewPipeline?: () => void;
}

export function ChatMessages({ messages, onViewPipeline }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2.5">
              <span className="text-white text-[10px] font-bold">寿</span>
            </div>
          )}
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-green-600 text-white rounded-tr-sm"
                : "bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-sm"
            }`}
          >
            {msg.role === "assistant" ? (
              <>
                <div className="prose prose-sm prose-gray max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.content.includes("研发报告已生成") && onViewPipeline && (
                  <button
                    onClick={onViewPipeline}
                    className="mt-2.5 flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    查看报告详情
                  </button>
                )}
              </>
            ) : (
              <span className="whitespace-pre-wrap">{msg.content}</span>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
