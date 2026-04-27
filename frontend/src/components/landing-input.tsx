"use client";

import { useState, useRef, useEffect } from "react";
import { FlaskConical, Shield, Leaf, Sparkles, BookOpen, Microscope, Scale, Settings } from "lucide-react";

interface LandingInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  { Icon: FlaskConical, text: "开发一款清热解毒的含片产品" },
  { Icon: Shield, text: "设计针对中老年人的免疫调节保健品" },
  { Icon: Sparkles, text: "研发灵芝孢子粉+西洋参配方产品" },
  { Icon: Leaf, text: "开发改善睡眠的草本功能食品" },
];

const FEATURES = [
  { Icon: BookOpen, title: "古方检索", desc: "智能匹配经典古方" },
  { Icon: Microscope, title: "配方设计", desc: "现代化配伍方案" },
  { Icon: Scale, title: "法规审查", desc: "合规性自动校验" },
  { Icon: Settings, title: "工程规格", desc: "生产工艺与成本" },
];

export function LandingInput({ onSend, isLoading }: LandingInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
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
    <div className="flex-1 flex flex-col items-center justify-center w-full relative overflow-hidden">
      {/* Subtle radial background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/40 via-white to-gray-50 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-200/50 mb-4">
            <span className="text-white text-xl font-bold">寿</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">智能产品研发助手</h1>
          <p className="text-sm text-gray-400 mt-1.5">寿仙谷 · AI 驱动的中医药产品全流程研发</p>
        </div>

        {/* Input Card */}
        <div
          className={`w-full bg-white rounded-2xl border transition-all duration-300 ${
            focused
              ? "shadow-xl shadow-green-100/50 border-green-200"
              : "shadow-lg shadow-gray-100/80 border-gray-150"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="描述您的产品研发需求…"
            disabled={isLoading}
            rows={3}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed px-5 pt-5 pb-2 focus:outline-none disabled:text-gray-400 placeholder:text-gray-300"
          />
          <div className="flex items-center justify-between px-5 pb-4 pt-1">
            <span className="text-xs text-gray-300 select-none">Shift+Enter 换行</span>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium hover:from-green-700 hover:to-green-600 transition-all disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              )}
              开始研发
            </button>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mt-5 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              onClick={() => onSend(s.text)}
              disabled={isLoading}
              className="group flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white border border-gray-100 text-gray-500 hover:border-green-200 hover:text-green-700 hover:bg-green-50/50 hover:shadow-sm transition-all disabled:opacity-50"
            >
              <s.Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 transition-colors" />
              {s.text}
            </button>
          ))}
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-4 gap-3 mt-10 w-full">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center py-3 px-2 rounded-xl bg-white/60 border border-gray-50">
              <f.Icon className="w-5 h-5 text-green-600 mb-1.5" />
              <span className="text-xs font-semibold text-gray-700">{f.title}</span>
              <span className="text-[11px] text-gray-400 mt-0.5">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
