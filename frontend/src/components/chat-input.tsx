"use client";

import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  pdfUrl: string | null;
}

export function ChatInput({ onSend, isLoading, pdfUrl }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-3">
        {isLoading && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="text-xs text-gray-400 ml-1">AI 正在处理中…</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "AI 处理中，完成后可继续输入…" : "输入产品研发需求或问题，按 Enter 发送…"}
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed
              focus:outline-none
              disabled:text-gray-400
              placeholder:text-gray-400"
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center
                  text-green-600 hover:bg-green-50 transition-colors"
                title="下载 PDF 报告"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                bg-green-600 text-white
                hover:bg-green-700 transition-colors
                disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

