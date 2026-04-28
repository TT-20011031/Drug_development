import type { Metadata } from "next";
import {
  Noto_Serif_SC,
  Noto_Sans_SC,
  Cormorant_Garamond,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const serifZh = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif-zh",
  display: "swap",
});

const sansZh = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans-zh",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "寿仙谷 · 智能产品研发助手",
  description: "基于 LangGraph 多 Agent 架构的中医药产品研发方案生成系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${serifZh.variable} ${sansZh.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
