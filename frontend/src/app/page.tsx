"use client";

import { useState, useCallback, useRef } from "react";
import { PipelineStep, PIPELINE_STEPS } from "@/lib/types";
import { streamChat, streamResume, getDownloadUrl, fetchConversation } from "@/lib/api";
import { PipelinePanel } from "@/components/pipeline-panel";
import { ContentPanel } from "@/components/content-panel";
import { ChatInput } from "@/components/chat-input";
import { LandingInput } from "@/components/landing-input";
import { HistorySidebar } from "@/components/history-sidebar";
import { ChatMessages, ChatMessage } from "@/components/chat-messages";
import { SealLogo } from "@/components/seal-logo";

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
  userInput: string;
  pinnedStepId: string | null;  // 用户手动选中的步骤 id，非 null 时不会被后端 step 事件覆盖
  paused: { lastUserInput: string } | null;
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
  const [viewMode, setViewMode] = useState<"chat" | "report">("chat");
  const [started, setStarted] = useState(false);
  const [chatResponse, setChatResponse] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [generatingSessionIds, setGeneratingSessionIds] = useState<Set<string>>(new Set());
  const [savedPipelineSteps, setSavedPipelineSteps] = useState<PipelineStep[] | null>(null);
  const [savedActiveStepId, setSavedActiveStepId] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [pausedInfo, setPausedInfo] = useState<{ lastUserInput: string } | null>(null);
  const [pinnedStepId, setPinnedStepId] = useState<string | null>(null);
  const [prefillInput, setPrefillInput] = useState<{ text: string; token: number } | null>(null);
  const [autoUploadToDeludata, setAutoUploadToDeludata] = useState(false);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const addGenerating = useCallback((sid: string) => {
    setGeneratingSessionIds((prev) => {
      if (prev.has(sid)) return prev;
      const next = new Set(prev);
      next.add(sid);
      return next;
    });
  }, []);
  const removeGenerating = useCallback((sid: string) => {
    setGeneratingSessionIds((prev) => {
      if (!prev.has(sid)) return prev;
      const next = new Set(prev);
      next.delete(sid);
      return next;
    });
  }, []);

  const sessionsRef = useRef(new Map<string, SessionData>());
  const displayedSessionRef = useRef("");
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;
  const abortControllersRef = useRef(new Map<string, AbortController>());

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
    setUserInput("");
    setPausedInfo(null);
    setPinnedStepId(null);
  }, [resetSteps]);

  const applyEvent = useCallback((buf: SessionData, event: string, data: any) => {
    const isKnown = (id: string) => PIPELINE_STEPS.some((s) => s.id === id);
    switch (event) {
      case "step_start":
        if (!isKnown(data.step)) break;
        buf.steps = buf.steps.map((s) => {
          if (s.id === data.step) return { ...s, status: "running" as const, content: "", duration: undefined };
          if (s.status === "running") return { ...s, status: "done" as const };
          return s;
        });
        // 只有在用户未手动固定某个步骤时，才自动跟随当前运行步骤；router 在报告 UI 中不展示，不抢占 activeStepId
        if (!buf.pinnedStepId && data.step !== "router") buf.activeStepId = data.step;
        break;
      case "step_content":
        if (!isKnown(data.step)) break;
        buf.steps = buf.steps.map((s) => {
          if (s.id === data.step) return { ...s, status: "running" as const, content: data.content };
          if (s.status === "running") return { ...s, status: "done" as const };
          return s;
        });
        if (!buf.pinnedStepId && data.step !== "router") buf.activeStepId = data.step;
        break;
      case "step_token":
        buf.steps = buf.steps.map((s) =>
          s.id === data.step
            ? { ...s, status: "running" as const, content: (s.content || "") + data.token }
            : s
        );
        if (!buf.pinnedStepId && data.step !== "router" && data.step !== buf.activeStepId) buf.activeStepId = data.step;
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
        const upload = data.deludata_upload;
        const uploadLine = upload?.enabled
          ? upload.ok
            ? `\n\n📚 已上传至知识库：${upload.folder_path || "研发部/新药研发报告"}`
            : `\n\n⚠️ 知识库上传失败：${upload.message || "请检查 DeluData_pro 配置"}`
          : "";
        // revise / followup / chitchat 完成时不再追加前端默认总结，由后端 chat_reply 控制
        const intent = data.intent || "";
        const isFreshReport = intent === "research" || intent === "optimize" || intent === "";
        if (isFreshReport) {
          const doneSteps = buf.steps
            .filter((s) => s.status === "done" || s.status === "running")
            .filter((s) => s.id !== "router");
          if (doneSteps.length > 0) {
            const stepList = doneSteps.map((s) => s.label).join(" \u2192 ");
            const summary = `\u2705 **\u7814\u53d1\u62a5\u544a\u5df2\u751f\u6210**\uff08${stepList}\uff09\n\n${
              data.doc_url ? "\ud83d\udcc4 PDF \u62a5\u544a\u53ef\u4e0b\u8f7d\u3002" : ""
            }\u53ef\u4ee5\u7ee7\u7eed\u8ffd\u95ee\u5bf9\u62a5\u544a\u5185\u5bb9\u8fdb\u884c\u4fee\u6539\u6216\u8865\u5145\u3002${uploadLine}`;
            buf.chatMessages = [...buf.chatMessages, { role: "assistant" as const, content: summary, timestamp: Date.now() }];
          }
        } else if (uploadLine) {
          buf.chatMessages = [...buf.chatMessages, { role: "assistant" as const, content: uploadLine.trim(), timestamp: Date.now() }];
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
    setUserInput(buf.userInput);
    setPausedInfo(buf.paused);
    setPinnedStepId(buf.pinnedStepId);
  }, []);

  const handleSend = useCallback(
    (message: string, opts: { resetPending?: boolean; autoUploadToDeludata?: boolean } = {}) => {
      const sid = sessionId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
      const uploadEnabled = opts.autoUploadToDeludata ?? autoUploadToDeludata;

      const freshSteps = PIPELINE_STEPS.map((s) => ({ ...s }));
      const existingBuf = sessionsRef.current.get(sid);
      const prevMessages = existingBuf ? existingBuf.chatMessages : chatMessagesRef.current;

      // 同一会话里继续发送时，沿用之前已完成的步骤状态作为基线，
      // 这样 revise / followup 不会让旧报告步骤显示为 pending
      // 但是「修改问题」(resetPending) 视为重新开始，使用 freshSteps
      const baseSteps = !opts.resetPending && existingBuf?.savedPipelineSteps
        ? existingBuf.savedPipelineSteps.map((s) => ({ ...s }))
        : freshSteps;

      const buf: SessionData = {
        steps: baseSteps,
        activeStepId: "",
        isLoading: true,
        pdfUrl: opts.resetPending ? null : existingBuf?.pdfUrl || null,
        chatMessages: [...prevMessages, { role: "user" as const, content: message, timestamp: Date.now() }],
        chatResponse: "",
        savedPipelineSteps: null,
        savedActiveStepId: "",
        errorMsg: "",
        userInput: message,
        pinnedStepId: null,
        paused: null,
      };
      sessionsRef.current.set(sid, buf);
      displayedSessionRef.current = sid;

      // 创建本轮的 abort controller
      const controller = new AbortController();
      abortControllersRef.current.set(sid, controller);

      setSessionId(sid);
      setStarted(true);
      setViewMode("chat");
      addGenerating(sid);
      syncToUI(buf);

      streamChat(
        message,
        sid,
        (event, data) => {
          const b = sessionsRef.current.get(sid);
          if (!b) return;
          if (event === "session") {
            // 后端已写入对话行，立即刷新左侧研发札记，让生成中的对话立刻出现
            setHistoryRefresh((n) => n + 1);
            return;
          }

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
          removeGenerating(sid);
        },
        () => {
          const b = sessionsRef.current.get(sid);
          if (b) b.isLoading = false;
          if (displayedSessionRef.current === sid) setIsLoading(false);
          abortControllersRef.current.delete(sid);
          removeGenerating(sid);
        },
        {
          signal: controller.signal,
          resetPending: opts.resetPending === true,
          autoUploadToDeludata: uploadEnabled,
          onAbort: () => {
            // 用户主动暂停：保留当前 steps 状态，转入 paused 视觉态
            const b = sessionsRef.current.get(sid);
            if (!b) return;
            b.isLoading = false;
            b.paused = { lastUserInput: b.userInput };
            abortControllersRef.current.delete(sid);
            removeGenerating(sid);
            if (displayedSessionRef.current === sid) syncToUI(b);
          },
        }
      );
    },
    [sessionId, autoUploadToDeludata, applyEvent, syncToUI, addGenerating, removeGenerating]
  );

  // 暂停当前生成
  const handlePause = useCallback(() => {
    const sid = displayedSessionRef.current;
    if (!sid) return;
    const controller = abortControllersRef.current.get(sid);
    controller?.abort();
  }, []);

  // 继续生成（从 checkpoint 恢复）
  const handleResume = useCallback(() => {
    const sid = displayedSessionRef.current;
    if (!sid) return;
    const buf = sessionsRef.current.get(sid);
    if (!buf) return;

    buf.isLoading = true;
    buf.paused = null;
    buf.errorMsg = "";
    addGenerating(sid);
    syncToUI(buf);

    const controller = new AbortController();
    abortControllersRef.current.set(sid, controller);

    streamResume(
      sid,
      (event, data) => {
        const b = sessionsRef.current.get(sid);
        if (!b) return;
        if (event === "session") {
          setHistoryRefresh((n) => n + 1);
          return;
        }
        applyEvent(b, event, data);
        if (event === "complete") setHistoryRefresh((n) => n + 1);
        if (displayedSessionRef.current === sid) syncToUI(b);
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
        removeGenerating(sid);
      },
      () => {
        const b = sessionsRef.current.get(sid);
        if (b) b.isLoading = false;
        if (displayedSessionRef.current === sid) setIsLoading(false);
        abortControllersRef.current.delete(sid);
        removeGenerating(sid);
      },
      {
        signal: controller.signal,
        autoUploadToDeludata,
        onAbort: () => {
          const b = sessionsRef.current.get(sid);
          if (!b) return;
          b.isLoading = false;
          b.paused = { lastUserInput: b.userInput };
          abortControllersRef.current.delete(sid);
          removeGenerating(sid);
          if (displayedSessionRef.current === sid) syncToUI(b);
        },
      }
    );
  }, [autoUploadToDeludata, applyEvent, syncToUI, addGenerating, removeGenerating]);

  // 修改问题：把暂停时的输入回填到对话框，等待用户编辑后发送（带 reset_pending=true）
  const handleModify = useCallback(() => {
    const sid = displayedSessionRef.current;
    if (!sid) return;
    const buf = sessionsRef.current.get(sid);
    if (!buf) return;
    setPrefillInput({ text: buf.paused?.lastUserInput || buf.userInput, token: Date.now() });
  }, []);

  // 用户在 ChatInput 中提交：若处于 paused 态则附带 reset_pending=true
  const handleChatInputSend = useCallback((message: string) => {
    const sid = displayedSessionRef.current;
    const buf = sid ? sessionsRef.current.get(sid) : null;
    const isPaused = !!buf?.paused;
    handleSend(message, isPaused ? { resetPending: true } : undefined);
  }, [handleSend]);

  // 用户点击流水线/进度气泡的某个步骤 → 固定显示该步骤
  const handleSelectStep = useCallback((stepId: string) => {
    const sid = displayedSessionRef.current;
    const buf = sid ? sessionsRef.current.get(sid) : null;
    if (buf) {
      buf.activeStepId = stepId;
      buf.pinnedStepId = stepId;
      if (displayedSessionRef.current === sid) syncToUI(buf);
    } else {
      setActiveStepId(stepId);
      setPinnedStepId(stepId);
    }
  }, [syncToUI]);

  // 取消固定，回到自动跟随
  const handleUnpinStep = useCallback(() => {
    const sid = displayedSessionRef.current;
    const buf = sid ? sessionsRef.current.get(sid) : null;
    if (buf) {
      buf.pinnedStepId = null;
      // 切回当前正在跑的步骤
      const running = buf.steps.find((s) => s.status === "running");
      if (running) buf.activeStepId = running.id;
      if (displayedSessionRef.current === sid) syncToUI(buf);
    } else {
      setPinnedStepId(null);
    }
  }, [syncToUI]);

  const loadConversation = useCallback(async (sid: string) => {
    displayedSessionRef.current = sid;
    setSessionId(sid);
    setStarted(true);
    setViewMode("chat");

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

    const loadedBuf: SessionData = {
      steps: loadedSteps,
      activeStepId: lastStep?.id || "",
      isLoading: false,
      pdfUrl: pUrl,
      chatMessages: [],
      chatResponse: "",
      savedPipelineSteps: hasDone ? loadedSteps : null,
      savedActiveStepId: lastStep?.id || "",
      errorMsg: "",
      userInput: detail.user_input || "",
      pinnedStepId: null,
      paused: null,
    };
    sessionsRef.current.set(sid, loadedBuf);
    syncToUI(loadedBuf);
  }, [syncToUI]);

  const handleNewConversation = useCallback(() => {
    displayedSessionRef.current = "";
    fullReset();
    setSessionId("");
    setStarted(false);
  }, [fullReset]);

  // 报告视图下：如果当前轮次还在跑，用实时 steps；否则展示上轮保存的 savedPipelineSteps
  const showSaved = !isLoading && !!savedPipelineSteps;
  const displaySteps = showSaved ? savedPipelineSteps! : steps;
  const displayActiveStepId = showSaved ? savedActiveStepId : activeStepId;

  const visibleSteps = displaySteps.filter(
    (s) =>
      s.id !== "router" &&
      (s.status === "running" || s.status === "done" || s.status === "error")
  );
  const activeStep = visibleSteps.find((s) => s.id === displayActiveStepId) || null;
  const hasPipelineSteps = visibleSteps.length > 0;
  // “可进入报告视图”：存在已保存的完整报告或当前正在生成报告中
  const canViewReport = savedPipelineSteps !== null || hasPipelineSteps;

  // 进度气泡状态计算
  const liveProgress: { mode: "report" | "thinking"; steps: PipelineStep[] } | null = isLoading
    ? hasPipelineSteps
      ? { mode: "report" as const, steps: visibleSteps }
      : { mode: "thinking" as const, steps: [] }
    : null;

  const enterReport = useCallback(() => {
    setViewMode("report");
  }, []);
  const enterChat = useCallback(() => {
    setViewMode("chat");
  }, []);

  return (
    <div className="h-screen flex flex-col relative">
      {/* Header — always rendered; minimal pre-started, full post-started */}
      <header className="border-b border-ink/10 px-6 py-3 flex items-center justify-between flex-shrink-0 bg-paper-light/80 backdrop-blur-sm relative">
        {/* hairline accent under header */}
        <div className="absolute bottom-0 left-0 right-0 h-px ornament-rule-soft text-ink-faint" />

        <div className="flex items-center gap-3">
          <SealLogo size={32} />
          <span className="font-serif text-[17px] text-ink tracking-[0.08em]">
            智能产品研发助手
          </span>
        </div>

        {started && (
          <div className="flex items-center gap-1.5">
            {viewMode === "chat" && canViewReport && (
              <button
                onClick={enterReport}
                className="text-[13px] font-serif text-ink-soft hover:text-ink px-4 py-1.5 rounded-full hover:bg-paper-dark/60 transition-colors tracking-wide flex items-center gap-1.5"
              >
                <span>查看报告</span>
                <span className="text-cinnabar">→</span>
              </button>
            )}
            {viewMode === "report" && (
              <button
                onClick={enterChat}
                className="text-[14px] font-serif text-ink hover:text-cinnabar px-4 py-1.5 rounded-full bg-paper-warm/60 hover:bg-paper-warm border border-ochre/30 hover:border-cinnabar/40 transition-colors tracking-wide flex items-center gap-1.5"
              >
                <span className="text-cinnabar">←</span>
                <span>返回对话</span>
              </button>
            )}
            <span className="w-px h-4 bg-ink/15 mx-1" aria-hidden />
            <button
              onClick={handleNewConversation}
              className="text-[13px] font-serif text-ink-mute hover:text-ink px-4 py-1.5 rounded-full hover:bg-paper-dark/60 transition-colors tracking-wide"
            >
              新建会话
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* History Sidebar — always visible */}
        <HistorySidebar
          currentSessionId={sessionId}
          onSelectConversation={loadConversation}
          onNewConversation={handleNewConversation}
          refreshTrigger={historyRefresh}
          generatingSessionIds={generatingSessionIds}
        />

        {!started ? (
          /* Landing page */
          <LandingInput
            onSend={handleSend}
            isLoading={isLoading}
            autoUploadToDeludata={autoUploadToDeludata}
            onAutoUploadChange={setAutoUploadToDeludata}
          />
        ) : viewMode === "report" && canViewReport ? (
          <>
            {/* Left: Pipeline Panel */}
            {hasPipelineSteps && (
              <div className="w-72 border-r border-ink/10 bg-paper-light/40 flex-shrink-0">
                <PipelinePanel
                  steps={visibleSteps}
                  activeStepId={displayActiveStepId}
                  onStepClick={showSaved ? setSavedActiveStepId : handleSelectStep}
                  pdfUrl={pdfUrl}
                />
              </div>
            )}
            {/* Right: Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* 固定查看提示 */}
              {isLoading && pinnedStepId && (
                <div className="flex items-center justify-end px-6 pt-3 flex-shrink-0">
                  <button
                    onClick={handleUnpinStep}
                    className="text-[12px] font-serif text-ochre-dark hover:text-ink bg-paper-honey/60 hover:bg-paper-honey border border-ochre/40 px-4 py-1.5 rounded-full transition-colors tracking-wide flex items-center gap-1.5"
                  >
                    <span>已锁定查看 · 回到当前步骤</span>
                    <span className="text-cinnabar">→</span>
                  </button>
                </div>
              )}
              <ContentPanel
                activeStep={activeStep}
                allSteps={visibleSteps}
                userInput={userInput}
                isLoading={isLoading}
                onSubmitRevision={handleSend}
              />
            </div>
          </>
        ) : (
          /* Chat-first view */
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatMessages
              messages={chatMessages}
              onViewReport={canViewReport ? enterReport : undefined}
              liveProgress={liveProgress}
              onStepClick={handleSelectStep}
              onPause={isLoading ? handlePause : undefined}
              paused={pausedInfo}
              onResume={pausedInfo ? handleResume : undefined}
              onModify={pausedInfo ? handleModify : undefined}
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-5 py-3 bg-paper-light border border-cinnabar/40 rounded-2xl text-[14px] text-cinnabar-dark flex items-center gap-3 shadow-bubble-ink max-w-md font-serif animate-ink-bleed">
          <span className="text-cinnabar text-lg leading-none">⚠</span>
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg("")}
            className="text-cinnabar/60 hover:text-cinnabar flex-shrink-0 transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Chat Input — only on the chat view (report view has no input) */}
      {started && viewMode === "chat" && (
        <ChatInput
          onSend={handleChatInputSend}
          isLoading={isLoading}
          prefill={prefillInput}
          autoUploadToDeludata={autoUploadToDeludata}
          onAutoUploadChange={setAutoUploadToDeludata}
        />
      )}
    </div>
  );
}
