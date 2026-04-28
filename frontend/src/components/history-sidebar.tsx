"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Conversation,
  fetchConversations,
  deleteConversation,
} from "@/lib/api";

interface HistorySidebarProps {
  currentSessionId: string;
  onSelectConversation: (sessionId: string) => void;
  onNewConversation: () => void;
  refreshTrigger: number;
}

const INTENT_BADGES: Record<string, { label: string; color: string }> = {
  research: { label: "研发", color: "bg-moss/15 text-moss border border-moss/30" },
  followup: { label: "迭代", color: "bg-qing/10 text-qing-deep border border-qing/30" },
  optimize: { label: "优化", color: "bg-ochre/15 text-ochre-dark border border-ochre/30" },
  chitchat: { label: "闲聊", color: "bg-qing-pale text-qing-deep border border-qing-mist" },
  reject: { label: "拒绝", color: "bg-cinnabar/15 text-cinnabar border border-cinnabar/40" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function HistorySidebar({
  currentSessionId,
  onSelectConversation,
  onNewConversation,
  refreshTrigger,
}: HistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const loadConversations = useCallback(async () => {
    const list = await fetchConversations();
    setConversations(list);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("确定删除此对话？")) return;
    const ok = await deleteConversation(sessionId);
    if (ok) {
      setConversations((prev) => prev.filter((c) => c.session_id !== sessionId));
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 border-r border-ink/10 bg-paper-mist flex flex-col items-center pt-4 flex-shrink-0 gap-3">
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 flex items-center justify-center text-ink-faint hover:text-ink hover:bg-qing-pale rounded-full transition-colors"
          aria-label="展开"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {/* Vertical wordmark */}
        <div className="vertical-rl text-ink-faint text-[12px] tracking-[0.4em] font-serif select-none mt-2">
          研&nbsp;&nbsp;发&nbsp;&nbsp;札&nbsp;&nbsp;记
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 border-r border-ink/10 bg-paper-mist flex flex-col flex-shrink-0 relative">
      {/* Vertical accent on the right edge */}
      <div className="absolute top-0 bottom-0 right-0 w-px ink-divider opacity-60" />

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-ink/10 relative">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[16px] text-ink tracking-[0.1em]">
              研发札记
            </span>
            <span className="font-mono text-[11px] text-qing-deep">
              {conversations.length.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onNewConversation}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-mute hover:text-cinnabar hover:bg-paper-light transition-colors"
              title="新建对话"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-paper-light transition-colors"
              aria-label="收起"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="ornament-rule-soft text-ink-faint w-12 mx-auto mb-3" />
            <p className="text-[14px] text-ink-faint font-serif italic">
              尚无札记
            </p>
          </div>
        ) : (
          conversations.map((conv, idx) => {
            const isActive = conv.session_id === currentSessionId;
            const badge = INTENT_BADGES[conv.intent];
            return (
              <button
                key={conv.session_id}
                onClick={() => onSelectConversation(conv.session_id)}
                className={`w-full text-left px-4 py-2.5 group transition-colors relative ${
                  isActive
                    ? "bg-ochre/30 shadow-bubble"
                    : "hover:bg-paper-light/70"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-cinnabar rounded-r shadow-[1px_0_0_rgba(168,65,42,0.35)]" />
                )}
                <div className="flex items-start gap-2.5">
                  {/* Manuscript numeral */}
                  <span
                    className={`font-mono text-[11px] mt-0.5 flex-shrink-0 tracking-tight ${
                      isActive ? "text-cinnabar" : "text-qing-deep/45"
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13.5px] truncate leading-snug font-serif ${
                        isActive ? "text-ink font-semibold" : "text-ink-mute"
                      }`}
                    >
                      {conv.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {badge && (
                        <span className={`text-[10.5px] px-2 py-[1px] rounded-full tracking-wide ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                      <span className="text-[10.5px] text-ink-faint font-serif">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conv.session_id)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full flex items-center justify-center text-ink-faint hover:text-cinnabar hover:bg-cinnabar/10 transition-all flex-shrink-0"
                    aria-label="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer — only English allowed: Shouxiangu brand mark */}
      <div className="px-4 py-3 border-t border-ink/10">
        <div className="ornament-rule-soft text-ink-faint mb-2" />
        <div className="text-smallcaps text-[10px] text-ink-faint text-center font-display italic tracking-[0.25em]">
          Shouxiangu
        </div>
      </div>
    </div>
  );
}
