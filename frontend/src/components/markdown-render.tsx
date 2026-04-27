"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRenderProps {
  content: string;
}

export function MarkdownRender({ content }: MarkdownRenderProps) {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>选择左侧步骤查看详细内容</p>
      </div>
    );
  }

  return (
    <div className="markdown-content prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
