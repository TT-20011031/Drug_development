import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "寿仙谷 · 智能产品研发助手",
  description: "基于 LangGraph 多 Agent 架构的中医药产品开发方案生成系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
