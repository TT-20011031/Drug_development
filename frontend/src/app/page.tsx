"use client";

import { useState, useCallback, useRef } from "react";
import { PipelineStep, PIPELINE_STEPS } from "@/lib/types";
import { streamChat, getDownloadUrl, fetchConversation } from "@/lib/api";
import { PipelinePanel } from "@/components/pipeline-panel";
import { ContentPanel } from "@/components/content-panel";
import { ChatInput } from "@/components/chat-input";
import { LandingInput } from "@/components/landing-input";
import { HistorySidebar } from "@/components/history-sidebar";
import { ChatMessages, ChatMessage } from "@/components/chat-messages";

interface SessionData {
  steps: PipelineStep[];
  activeStepId: string;
  isLoading: boolean;
  pdfUrl: string | null;
  chatMessages: ChatMessage[];
  chatResponse: string;
  savedPipelineSteps: PipelineStep[] | null;
  savedActiveStepId: string;
  errorMsg: string;
}

export default function Home() {
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s }))
  );
  const [activeStepId, setActiveStepId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [viewMode, setViewMode] = useState<"auto" | "pipeline" | "chat">("auto");
  const [started, setStarted] = useState(false);
  const [chatResponse, setChatResponse] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [savedPipelineSteps, setSavedPipelineSteps] = useState<PipelineStep[] | null>(null);
  const [savedActiveStepId, setSavedActiveStepId] = useState<string>("");

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const sessionsRef = useRef(new Map<string, SessionData>());
  const displayedSessionRef = useRef("");
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  const resetSteps = useCallback(() => {
    const fresh = PIPELINE_STEPS.map((s) => ({ ...s }));
    setSteps(fresh);
    setActiveStepId("");
    setPdfUrl(null);
    setErrorMsg("");
    setChatResponse("");
  }, []);

  const fullReset = useCallback(() => {
    resetSteps();
    setChatMessages([]);
    setSavedPipelineSteps(null);
    setSavedActiveStepId("");
  }, [resetSteps]);

  const applyEvent = useCallback((buf: SessionData, event: string, data: any) => {
    const isKnown = (id: string) => PIPELINE_STEPS.some((s) => s.id === id);
    switch (event) {
      case "step_start":
        if (!isKnown(data.step)) break;
        buf.steps = buf.steps.map((s) => {
          if (s.id === data.step) return { ...s, status: "running" as const };
          if (s.status === "running") return { ...s, status: "done" as const };
          return s;
        });
        buf.activeStepId = data.step;
        break;
      case "step_content":
        if (!isKnown(data.step)) break;
        buf.steps = buf.steps.map((s) => {
          if (s.id === data.step) return { ...s, status: "running" as const, content: data.content };
          if (s.status === "running") return { ...s, status: "done" as const };
          return s;
        });
        buf.activeStepId = data.step;
        break;
      case "step_token":
        buf.steps = buf.steps.map((s) =>
          s.id === data.step
            ? { ...s, status: "running" as const, content: (s.content || "") + data.token }
            : s
        );
        if (data.step !== buf.activeStepId) buf.activeStepId = data.step;
        break;
      case "step_done":
        buf.steps = buf.steps.map((s) =>
          s.id === data.step
            ? { ...s, status: "done" as const, ...(data.duration !== undefined ? { duration: data.duration } : {}) }
            : s
        );
        break;
      case "chat_reply":
        buf.chatResponse = data.message;
        buf.chatMessages = [...buf.chatMessages, { role: "assistant" as const, content: data.message, timestamp: Date.now() }];
        break;
      case "rejected":
        buf.errorMsg = data.message;
        buf.isLoading = false;
        break;
      case "complete": {
        if (data.doc_url) buf.pdfUrl = getDownloadUrl(data.doc_id);
        buf.isLoading = false;
        buf.savedPipelineSteps = [...buf.steps];
        buf.savedActiveStepId =
          buf.steps.find((s) => s.id === "product_spec" && s.status !== "pending")?.id ||
          buf.steps.filter((s) => s.status === "done").pop()?.id || "";
        const doneSteps = buf.steps
          .filter((s) => s.status === "done" || s.status === "running")
          .filter((s) => s.id !== "router");
        if (doneSteps.length > 0) {
          const stepList = doneSteps.map((s) => s.label).join(" \u2192 ");
          const summary = `\u2705 **\u7814\u53d1\u62a5\u544a\u5df2\u751f\u6210**\uff08${stepList}\uff09\n\n${
            data.doc_url ? "\ud83d\udcc4 PDF \u62a5\u544a\u53ef\u4e0b\u8f7d\u3002" : ""
          }\u53ef\u4ee5\u7ee7\u7eed\u8ffd\u95ee\u5bf9\u62a5\u544a\u5185\u5bb9\u8fdb\u884c\u4fee\u6539\u6216\u8865\u5145\u3002`;
          buf.chatMessages = [...buf.chatMessages, { role: "assistant" as const, content: summary, timestamp: Date.now() }];
        }
        break;
      }
      case "error":
        buf.errorMsg = data.message;
        buf.isLoading = false;
        break;
    }
  }, []);

  const syncToUI = useCallback((buf: SessionData) => {
    setSteps([...buf.steps]);
    setActiveStepId(buf.activeStepId);
    setIsLoading(buf.isLoading);
    setPdfUrl(buf.pdfUrl);
    setChatMessages([...buf.chatMessages]);
    setChatResponse(buf.chatResponse);
    setErrorMsg(buf.errorMsg);
    setSavedPipelineSteps(buf.savedPipelineSteps ? [...buf.savedPipelineSteps] : null);
    setSavedActiveStepId(buf.savedActiveStepId);
  }, []);

  const handleSend = useCallback(
    (message: string) => {
      const sid = sessionId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

      const freshSteps = PIPELINE_STEPS.map((s) => ({ ...s }));
      const existingBuf = sessionsRef.current.get(sid);
      const prevMessages = existingBuf ? existingBuf.chatMessages : chatMessagesRef.current;

      const buf: SessionData = {
        steps: freshSteps,
        activeStepId: "",
        isLoading: true,
        pdfUrl: existingBuf?.pdfUrl || null,
        chatMessages: [...prevMessages, { role: "user" as const, content: message, timestamp: Date.now() }],
        chatResponse: "",
        savedPipelineSteps: null,
        savedActiveStepId: "",
        errorMsg: "",
      };
      sessionsRef.current.set(sid, buf);
      displayedSessionRef.current = sid;

      setSessionId(sid);
      setStarted(true);
      setViewMode("auto");
      syncToUI(buf);

      streamChat(
        message,
        sid,
        (event, data) => {
          const b = sessionsRef.current.get(sid);
          if (!b) return;
          if (event === "session") return;

          applyEvent(b, event, data);
          if (event === "complete") setHistoryRefresh((n) => n + 1);

          if (displayedSessionRef.current === sid) {
            syncToUI(b);
          }
        },
        (error) => {
          const b = sessionsRef.current.get(sid);
          if (b) {
            b.errorMsg = `\u8fde\u63a5\u9519\u8bef\uff1a${error.message}`;
            b.isLoading = false;
          }
          if (displayedSessionRef.current === sid) {
            setErrorMsg(`\u8fde\u63a5\u9519\u8bef\uff1a${error.message}`);
            setIsLoading(false);
          }
        },
        () => {
          const b = sessionsRef.current.get(sid);
          if (b) b.isLoading = false;
          if (displayedSessionRef.current === sid) setIsLoading(false);
        }
      );
    },
    [sessionId, applyEvent, syncToUI]
  );

  const loadConversation = useCallback(async (sid: string) => {
    displayedSessionRef.current = sid;
    setSessionId(sid);
    setStarted(true);
    setViewMode("auto");

    const cached = sessionsRef.current.get(sid);
    if (cached) {
      syncToUI(cached);
      return;
    }

    const detail = await fetchConversation(sid);
    if (!detail) return;

    const loadedSteps = PIPELINE_STEPS.map((s) => {
      const loaded = detail.steps?.find((ls) => ls.id === s.id);
      if (loaded) return { ...s, status: "done" as const, content: loaded.content };
      return { ...s };
    });
    const lastStep = detail.steps?.[detail.steps.length - 1];
    let pUrl: string | null = null;
    if (detail.pdf_path) {
      const docId = detail.pdf_path.match(/product_dev_(\w+)\.pdf/)?.[1];
      if (docId) pUrl = getDownloadUrl(docId);
    }
    const hasDone = loadedSteps.some((s) => s.status === "done" && s.id !== "router");

    setSteps(loadedSteps);
    setActiveStepId(lastStep?.id || "");
    setIsLoading(false);
    setPdfUrl(pUrl);
    setChatMessages([]);
    setChatResponse("");
    setErrorMsg("");
    setSavedPipelineSteps(hasDone ? loadedSteps : null);
    setSavedActiveStepId(lastStep?.id || "");
  }, [syncToUI]);

  const handleNewConversation = useCallback(() => {
    displayedSessionRef.current = "";
    fullReset();
    setSessionId("");
    setStarted(false);
  }, [fullReset]);

  const isPipelineActive = viewMode === "pipeline" && savedPipelineSteps;
  const displaySteps = isPipelineActive ? savedPipelineSteps : steps;
  const displayActiveStepId = isPipelineActive ? savedActiveStepId : activeStepId;

  const activeStep = displaySteps.find((s) => s.id === displayActiveStepId) || null;
  const visibleSteps = displaySteps.filter(
    (s) => s.status === "running" || s.status === "done" || s.status === "error"
  );
  const hasPipelineSteps = visibleSteps.some((s) => s.id !== "router");
  const canViewPipeline = savedPipelineSteps !== null;

  return (
    <div className={`h-screen flex flex-col relative ${started ? "bg-gray-50" : "bg-white"}`}>
      {/* Header - only shown after started */}
      {started && (
        <header className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">寿</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">智能产品研发助手</span>
          </div>
          <button
            onClick={handleNewConversation}
            className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            新建会话
          </button>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* History Sidebar - always visible */}
        <HistorySidebar
          currentSessionId={sessionId}
          onSelectConversation={loadConversation}
          onNewConversation={handleNewConversation}
          refreshTrigger={historyRefresh}
        />

        {!started ? (
          /* Landing page */
          <LandingInput onSend={handleSend} isLoading={isLoading} />
        ) : (
          <>
            {/* Left: Pipeline Panel */}
            {hasPipelineSteps && (
              <div className="w-72 border-r border-gray-100 bg-white flex-shrink-0">
                <PipelinePanel
                  steps={visibleSteps}
                  activeStepId={displayActiveStepId}
                  onStepClick={isPipelineActive ? setSavedActiveStepId : setActiveStepId}
                />
              </div>
            )}

            {/* Right: Content / Chat */}
            <div className="flex-1 bg-white overflow-hidden flex flex-col">
              {(viewMode === "pipeline" || (viewMode === "auto" && hasPipelineSteps)) ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {chatMessages.length > 0 && (
                    <button
                      onClick={() => setViewMode("chat")}
                      className="mx-4 mt-2 self-end text-xs text-gray-400 hover:text-green-600 px-2.5 py-1 rounded-md hover:bg-green-50 transition-colors flex-shrink-0"
                    >
                      返回对话 →
                    </button>
                  )}
                  <ContentPanel activeStep={activeStep} allSteps={displaySteps} />
                </div>
              ) : (
                <ChatMessages
                  messages={chatMessages}
                  onViewPipeline={canViewPipeline ? () => setViewMode("pipeline") : undefined}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-3 shadow-lg max-w-md">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
        </div>
      )}

      {/* Floating Chat Input - only shown after started */}
      {started && <ChatInput onSend={handleSend} isLoading={isLoading} pdfUrl={pdfUrl} />}
    </div>
  );
}
