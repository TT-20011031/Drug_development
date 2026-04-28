"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRenderProps {
  content: string;
}

export function MarkdownRender({ content }: MarkdownRenderProps) {
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="ornament-rule-soft w-16 text-ink-faint mb-4" />
        <p className="font-serif italic text-ink-mute text-[16px]">
          选择左侧步骤查看详细内容
        </p>
      </div>
    );
  }

  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
