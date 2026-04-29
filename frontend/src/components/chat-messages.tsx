"use client";



import { useEffect, useRef, useState } from "react";

import ReactMarkdown from "react-markdown";

import { FileText, Feather, Leaf, ChevronDown } from "lucide-react";

import { PipelineStep } from "@/lib/types";

import { ProgressBubble, ThinkingBubble, PausedBubble } from "./progress-bubble";



export interface ChatMessage {

  role: "user" | "assistant";

  content: string;

  timestamp?: number;

}



interface LiveProgress {

  mode: "report" | "thinking";

  steps: PipelineStep[];

}



interface PausedInfo {

  lastUserInput?: string;

}



interface ChatMessagesProps {

  messages: ChatMessage[];

  onViewReport?: () => void;

  liveProgress?: LiveProgress | null;

  onStepClick?: (stepId: string) => void;

  onPause?: () => void;

  paused?: PausedInfo | null;

  onResume?: () => void;

  onModify?: () => void;

}



export function ChatMessages({

  messages,

  onViewReport,

  liveProgress,

  onStepClick,

  onPause,

  paused,

  onResume,

  onModify,

}: ChatMessagesProps) {

  const bottomRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const stuckToBottomRef = useRef(true);

  const autoScrollingRef = useRef(false);

  const [showJumpButton, setShowJumpButton] = useState(false);



  const handleScroll = () => {

    if (autoScrollingRef.current) return;

    const el = containerRef.current;

    if (!el) return;

    const nearBottom =

      el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    stuckToBottomRef.current = nearBottom;

    setShowJumpButton(!nearBottom);

  };



  const scrollToBottom = (smooth: boolean) => {

    autoScrollingRef.current = true;

    bottomRef.current?.scrollIntoView({

      behavior: smooth ? "smooth" : "auto",

    });

    window.setTimeout(

      () => {

        autoScrollingRef.current = false;

      },

      smooth ? 500 : 50

    );

  };



  const jumpToLatest = () => {

    stuckToBottomRef.current = true;

    setShowJumpButton(false);

    scrollToBottom(true);

  };



  // 新消息 / 暂停态变化：smooth 滚动

  useEffect(() => {

    if (stuckToBottomRef.current) scrollToBottom(true);

  }, [messages.length, paused]);



  // 流式 token 更新：即时滚动以避免 smooth 动画与高频更新打架

  useEffect(() => {

    if (stuckToBottomRef.current) scrollToBottom(false);

  }, [liveProgress]);



  if (messages.length === 0 && !liveProgress && !paused) return null;



  return (

    <div className="relative flex-1 flex flex-col min-h-0">

    <div

      ref={containerRef}

      onScroll={handleScroll}

      className="flex-1 overflow-y-auto px-6 py-8 pb-32 space-y-7 max-w-[920px] w-full mx-auto"

    >

      {messages.map((msg, i) => (

        <div

          key={i}

          className={`flex animate-ink-bleed ${

            msg.role === "user" ? "justify-end" : "justify-start"

          }`}

        >

          {msg.role === "assistant" && (

            <div className="seal-ring relative w-9 h-9 rounded-md bg-cinnabar/85 border border-cinnabar-dark/40 flex items-center justify-center flex-shrink-0 mt-1 mr-3 rotate-3 shadow-bubble">

              <span className="absolute inset-[3px] rounded-[3px] border border-bone/25 pointer-events-none" />

              <Leaf className="w-4 h-4 text-bone" strokeWidth={1.6} />

            </div>

          )}

          <div

            className={`max-w-[75%] text-[14px] leading-[1.85] rounded-2xl ${
              msg.role === "user"
                ? "bg-ochre/28 text-ink border border-ochre/45 rounded-tr-md px-4 py-3 ml-auto shadow-bubble"
                : "bg-qing/16 border border-qing/32 text-ink rounded-tl-md px-5 py-4 relative shadow-bubble"
            }`}

          >

            {msg.role === "assistant" && (

              <>

                {/* manuscript top tag */}

                <div className="absolute -top-2 left-4 bg-paper px-2 text-smallcaps text-[9px] text-qing-deep/60 font-display italic">

                  reply

                </div>

                {/* corner ticks */}

                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-ink/25" />

                <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ink/25" />

                <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-ink/25" />

                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-ink/25" />

              </>

            )}



            {msg.role === "assistant" ? (

              <>

                <div className="markdown-content max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>h1]:text-[18px] [&>h2]:text-[16px] [&>h3]:text-[14px]">

                  <ReactMarkdown>{msg.content}</ReactMarkdown>

                </div>

                {(msg.content.includes("研发报告已生成") ||

                  msg.content.includes("已根据您的指令重新生成")) &&

                  onViewReport && (

                    <button

                      onClick={onViewReport}

                      className="mt-3 inline-flex items-center gap-2 text-[12px] text-paper-light bg-qing-deep hover:bg-qing px-3.5 py-1.5 rounded-full shadow-bubble-ink transition-colors tracking-wide group"

                    >

                      <FileText className="w-3.5 h-3.5" />

                      <span>查看报告详情</span>

                      <span className="text-cinnabar-light group-hover:translate-x-0.5 transition-transform">

                        →

                      </span>

                    </button>

                  )}

              </>

            ) : (

              <span className="whitespace-pre-wrap font-sans">{msg.content}</span>

            )}

          </div>

          {msg.role === "user" && (

            <div className="relative w-9 h-9 rounded-md bg-paper-light/80 border border-ink/35 flex items-center justify-center flex-shrink-0 mt-1 ml-3 -rotate-3 shadow-bubble">

              <span className="absolute inset-[3px] rounded-[3px] border border-ink/20 pointer-events-none" />

              <Feather className="w-4 h-4 text-ink-soft" strokeWidth={1.6} />

            </div>

          )}

        </div>

      ))}



      {liveProgress?.mode === "report" && onViewReport && (

        <ProgressBubble

          steps={liveProgress.steps}

          onEnterReport={onViewReport}

          onStepClick={(sid) => {

            onStepClick?.(sid);

            onViewReport();

          }}

          onPause={onPause}

        />

      )}

      {liveProgress?.mode === "thinking" && <ThinkingBubble onPause={onPause} />}

      {paused && onResume && onModify && (

        <PausedBubble

          lastUserInput={paused.lastUserInput}

          onResume={onResume}

          onModify={onModify}

        />

      )}



      <div ref={bottomRef} />

    </div>

    {showJumpButton && (

      <button

        onClick={jumpToLatest}

        className="absolute right-6 bottom-28 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-paper-light/90 border border-ochre/40 text-[12px] font-serif text-ink-soft hover:text-ink hover:border-ochre/60 shadow-bubble-ink backdrop-blur-sm transition-all animate-fade-up tracking-[0.18em]"

        aria-label="跳到最新"

      >

        <ChevronDown className="w-3.5 h-3.5 text-cinnabar" strokeWidth={2} />

        <span>跳 到 最 新</span>

      </button>

    )}

    </div>

  );

}

