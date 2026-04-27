# 寿仙谷智能产品研发助手 — 部署说明

## 项目信息
- **目标域名**：zy.deluagent.com:8025
- **后端**：Python FastAPI（端口 9527）
- **前端**：Next.js React（端口 3000）
- **对外入口**：Nginx 监听 8025，反代前后端

## 服务器环境要求

| 依赖 | 最低版本 | 用途 |
|------|---------|------|
| Python | 3.10+ | 后端运行 |
| Node.js | 18+ | 前端构建和运行 |
| Google Chrome | 最新稳定版 | PDF 报告渲染（Playwright 调用） |
| Nginx | 任意 | 反向代理，统一 8025 入口 |

## 目录结构

```
langgraph_product_dev/
├── backend/              # FastAPI 后端
│   ├── main.py           # 入口
│   ├── requirements.txt  # Python 依赖
│   ├── .env              # API Key 配置（需手动确认）
│   ├── data/             # SQLite 数据库（运行时自动生成）
│   └── generated_docs/   # 生成的 PDF 文件
├── frontend/             # Next.js 前端
│   ├── package.json      # Node 依赖
│   └── .env.production   # 生产环境变量（已配好）
└── deploy.md             # 本文件
```

## 部署步骤概要

1. 上传压缩包到服务器，解压
2. 后端：创建 Python 虚拟环境 → `pip install -r requirements.txt` → 启动
3. 前端：`npm install` → `npm run build` → `npm start`
4. Nginx：8025 端口，`/api/*` 转发到 9527，`/` 转发到 3000
5. 建议用 systemd 管理两个进程，确保开机自启和崩溃重启

## 关键配置

### 后端 `.env`（已包含在压缩包中）
```
DASHSCOPE_API_KEY=sk-xxxxx
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
```

### 前端 `.env.production`（已包含）
```
BACKEND_URL=http://127.0.0.1:9527
NEXT_PUBLIC_BACKEND_URL=
```
`NEXT_PUBLIC_BACKEND_URL` 留空 = 使用相对路径，由 Nginx 统一代理。

### Nginx 要点
- `/api/*` → `proxy_pass http://127.0.0.1:9527`，需关闭 `proxy_buffering`（SSE 流式传输）
- `/` → `proxy_pass http://127.0.0.1:3000`
- `proxy_read_timeout` 建议 300s（研发流程耗时较长）

## 注意事项
- 服务器必须安装 **Google Chrome**，PDF 生成依赖 Playwright 调用 Chrome 无头模式
- 后端首次启动会自动创建 `data/` 目录存放 SQLite 数据库
- 如果 Linux 上 Chrome 路径不同，可能需要修改 `backend/output/pdf_export.py` 中的 `channel` 参数
