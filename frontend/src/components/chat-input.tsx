"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  prefill?: { text: string; token: number } | null;
}

export function ChatInput({ onSend, isLoading, prefill }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastPrefillToken = useRef<number>(-1);

  useEffect(() => {
    if (prefill && prefill.token !== lastPrefillToken.current) {
      lastPrefillToken.current = prefill.token;
      setInput(prefill.text);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          prefill.text.length,
          prefill.text.length
        );
      }, 0);
    }
  }, [prefill]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
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
    <div className="absolute bottom-5 left-0 right-0 z-10 flex justify-center px-4 pointer-events-none">
      <div
        className={`w-full max-w-3xl bg-paper-light rounded-2xl pointer-events-auto transition-all duration-200 relative ${
          focused
            ? "border border-ochre/55 shadow-bubble-ink"
            : "border border-ink/12 shadow-bubble"
        }`}
      >
        <div className="px-5 pt-3.5 pb-3.5">
          {isLoading && (
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-ink/8">
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 bg-cinnabar rounded-full animate-ink-drip"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-cinnabar rounded-full animate-ink-drip"
                  style={{ animationDelay: "180ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-cinnabar rounded-full animate-ink-drip"
                  style={{ animationDelay: "360ms" }}
                />
              </span>
              <span className="font-serif text-[12px] text-cinnabar tracking-[0.18em]">
                生成中
              </span>
            </div>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                isLoading
                  ? "请稍候，生成完成后可继续追问……"
                  : "继续撰写需求或追问问题……"
              }
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[14.5px] leading-[1.75] font-sans pt-1.5 pb-1
                focus:outline-none
                disabled:text-ink-faint
                placeholder:text-ink-faint placeholder:italic placeholder:font-serif"
            />

            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-ochre/55 text-ochre-dark border border-ochre/70 hover:bg-ochre/70 hover:border-ochre/85 shadow-bubble transition-all disabled:bg-paper-dark disabled:text-ink-faint disabled:border-ink/15 disabled:shadow-none disabled:cursor-not-allowed flex-shrink-0 group relative"
              aria-label="发送"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-30"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              )}
              {/* Cinnabar accent dot when there's content to send */}
              {!isLoading && input.trim() && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cinnabar rounded-full animate-ink-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

