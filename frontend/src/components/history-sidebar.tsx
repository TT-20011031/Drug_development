"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
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
  research: { label: "研发", color: "bg-blue-100 text-blue-700" },
  followup: { label: "迭代", color: "bg-purple-100 text-purple-700" },
  optimize: { label: "优化", color: "bg-amber-100 text-amber-700" },
  chitchat: { label: "闲聊", color: "bg-gray-100 text-gray-500" },
  reject: { label: "拒绝", color: "bg-red-100 text-red-500" },
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
      <div className="w-10 bg-white border-r border-gray-100 flex flex-col items-center pt-3 flex-shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-50">
        <span className="text-xs font-medium text-gray-500">历史对话</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewConversation}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="新建对话"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-gray-400">
            暂无历史对话
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.session_id === currentSessionId;
            const badge = INTENT_BADGES[conv.intent];
            return (
              <button
                key={conv.session_id}
                onClick={() => onSelectConversation(conv.session_id)}
                className={`w-full text-left px-3 py-2 group transition-colors ${
                  isActive
                    ? "bg-green-50 border-r-2 border-green-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                    isActive ? "text-green-600" : "text-gray-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate leading-tight">
                      {conv.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {badge && (
                        <span className={`text-[10px] px-1.5 py-0 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conv.session_id)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
