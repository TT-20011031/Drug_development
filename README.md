# 智能产品研发助手

一个基于 LangGraph 多智能体架构的产品研发辅助系统，支持新产品研发需求分析、古方检索与优化、配方设计、法规审核及产品规格生成，实现端到端的智能化产品开发流程。

## ✨ 功能特性

- **智能意图识别**: 自动识别用户需求类型（新研发、古方优化、方案追问、日常闲聊）
- **多智能体协作**: 基于 LangGraph 构建的多 Agent 工作流，各环节专业分工
- **古方检索与分析**: 智能检索相关古方，分析药材功效与配伍关系
- **配方智能优化**: 支持古方现代化改良，药材替代建议
- **法规合规审核**: 自动进行保健食品法规合规性检查
- **产品规格生成**: 一键生成完整产品规格文档，支持 PDF 导出
- **实时流式输出**: SSE 流式传输，实时展示各步骤处理进度与内容
- **对话历史管理**: 支持多轮对话，历史记录持久化存储

## 🏗️ 技术栈

### 后端

- **FastAPI** - 高性能 Python Web 框架
- **LangGraph** - 多智能体工作流编排框架
- **LangChain** - LLM 应用开发框架
- **DashScope** - 阿里云通义千问大模型服务
- **SQLite** - 轻量级数据库（对话记录 + 检查点）
- **Playwright** - PDF 报告渲染引擎

### 前端

- **Next.js 14** - React 全栈框架
- **TypeScript** - 类型安全
- **TailwindCSS** - 原子化 CSS 框架
- **Lucide React** - 图标库
- **React Markdown** - Markdown 渲染

### 基础设施

- **SSE (Server-Sent Events)** - 实时流式通信
- **Uvicorn** - ASGI 服务器
- **Nginx** - 反向代理（生产环境）

## 📁 项目结构

```
langgraph_product_dev/
├── backend/                    # 后端服务
│   ├── main.py                 # FastAPI 主应用入口
│   ├── graph.py                # LangGraph 工作流定义
│   ├── state.py                # 状态定义
│   ├── db.py                   # 数据库操作
│   ├── requirements.txt        # Python 依赖
│   ├── .env                    # 环境变量配置
│   ├── agents/                 # 智能体模块
│   │   ├── router.py           # 意图路由 Agent
│   │   ├── requirement.py      # 需求分析 Agent
│   │   ├── ancient.py          # 古方检索 Agent
│   │   ├── analysis.py         # 药材分析 Agent
│   │   ├── formula_parser.py   # 配方解析 Agent
│   │   ├── substitution.py     # 药材替代 Agent
│   │   ├── regulatory.py       # 法规审核 Agent
│   │   ├── formula.py          # 新配方生成 Agent
│   │   ├── engineer.py         # 产品规格 Agent
│   │   ├── chitchat.py         # 闲聊 Agent
│   │   └── followup.py         # 追问回复 Agent
│   ├── output/                 # 输出处理
│   │   └── pdf_export.py       # PDF 导出
│   ├── data/                   # 数据目录（运行时生成）
│   │   ├── app.db              # 对话记录数据库
│   │   └── checkpoints.db      # LangGraph 检查点
│   └── generated_docs/         # 生成的文档
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   ├── components/         # React 组件
│   │   │   ├── chat-input.tsx
│   │   │   ├── chat-messages.tsx
│   │   │   ├── pipeline-panel.tsx
│   │   │   ├── step-card.tsx
│   │   │   └── history-sidebar.tsx
│   │   └── lib/                # 工具函数与类型
│   ├── package.json
│   └── tailwind.config.ts
├── start.bat                   # Windows 一键启动脚本
├── stop.bat                    # Windows 停止脚本
└── deploy.md                   # 部署说明
```

## 🚀 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- Google Chrome（PDF 导出依赖）

### 1. 配置后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
.\venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium

# 配置环境变量
# 编辑 .env 文件，填入 API Key
```

### 2. 启动后端服务

```bash
cd backend
python main.py
```

后端服务将运行在 `http://localhost:9527`

### 3. 配置并启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将运行在 `http://localhost:9528`

### 一键启动 (Windows)

```bash
.\start.bat
```

## ⚙️ 环境变量配置

在 `backend/.env` 文件中配置以下变量：

```env
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
```

## 📖 API 接口

| 端点                              | 方法   | 描述             |
| --------------------------------- | ------ | ---------------- |
| `/api/health`                     | GET    | 健康检查         |
| `/api/chat`                       | POST   | 智能对话（SSE）  |
| `/api/conversations`              | GET    | 获取对话列表     |
| `/api/conversations/{session_id}` | GET    | 获取对话详情     |
| `/api/conversations/{session_id}` | DELETE | 删除对话         |
| `/api/conversations/{session_id}` | PATCH  | 重命名对话       |
| `/api/download/{doc_id}`          | GET    | 下载 PDF 文档    |

## 🔄 工作流程

### 新产品研发流程

```
用户输入 → 智能理解(Router) → 需求分析 → 古方检索 → 药材分析 → 法规审核 → 新配方生成 → 产品规格
```

### 古方优化流程

```
用户输入 → 智能理解(Router) → 配方解析 → 药材替代分析 → 法规审核 → 新配方生成 → 产品规格
```

### 其他流程

- **方案追问**: 基于已有研发报告进行追问回复
- **日常闲聊**: 直接进行智能对话

## 🎯 智能体说明

| Agent          | 功能描述                               |
| -------------- | -------------------------------------- |
| Router         | 意图识别与流程路由                     |
| Requirement    | 需求标准化分析                         |
| Ancient        | 古方文献检索与匹配                     |
| Analysis       | 药材功效与配伍分析                     |
| Formula Parser | 古方配方解析                           |
| Substitution   | 药材现代化替代建议                     |
| Regulatory     | 保健食品法规合规审核                   |
| Formula        | 新配方设计与生成                       |
| Engineer       | 产品规格文档生成                       |
| Chitchat       | 日常闲聊回复                           |
| Followup       | 基于上下文的追问回复                   |

## 📝 开发计划

- [ ] 支持更多大模型接入
- [ ] 知识库增强检索
- [ ] 多用户权限管理
- [ ] 配方版本对比
- [ ] 批量研发任务

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！
