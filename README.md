# 🎓 Educational Course Feedback Card Generator

![GitHub license](https://img.shields.io/github/license/RoxyAsahi/Educational-Course-Feedback-Card-Generator?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/RoxyAsahi/Educational-Course-Feedback-Card-Generator?style=social)
![Vite](https://img.shields.io/badge/Powered%20by-Vite-3178C6?style=flat-square&logo=vite)
![React](https://img.shields.io/badge/Framework-React-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwindcss)

## 📖 项目描述

该项目是一个**全人学生课后反馈卡生成器**的前端原型。它提供了一个交互式的界面，允许用户输入学生的详细信息、日期、课程表现、知识点掌握情况，并基于这些数据生成一张美观、信息丰富的、可下载的 **PNG 格式反馈卡片**。

该工具专注于：
1.  **数据录入**：通过结构化表单快速录入学生表现数据。
2.  **可视化设计**：使用高度定制化、主题颜色可配置的卡片布局。
3.  **AI 辅助（待完成）**：预留了调用 Gemini API 生成综合点评的功能（目前已禁用以确保本地启动）。
4.  **模板管理**：支持保存、加载和重置用户自定义的反馈模板。

## 🚀 技术栈

本项目是一个现代化的前端应用，构建在以下技术之上：

*   **框架:** React (使用 TypeScript)
*   **构建工具:** Vite (提供快速的开发体验，包括热重载 HMR)
*   **样式:** Tailwind CSS (用于快速、原子化的 CSS 样式构建)
*   **状态管理:** React `useState` 和 `useRef` (局部状态管理)
*   **功能:** `html-to-image` (用于将渲染的 DOM 导出为 PNG 图片), `lucide-react` (图标库), `@google/genai` (AI 接口，客户端初始化已安全处理)。

## ⚙️ 运行指南

### 1. 安装依赖

您首先需要安装项目所需的所有依赖包（Node.js 和 npm/yarn/pnpm 必需）。

```bash
npm install
# 或者使用您偏好的包管理器：
# yarn install
# pnpm install
```

### 2. 启动开发服务器

本项目已将开发端口设置为冷门的 **5678**。

```bash
npm run dev
```

服务器启动后，您可以通过浏览器访问：`http://localhost:5678`

### 3. 生成/下载卡片

在应用界面中操作：
*   在左侧面板编辑所有数据。
*   在右侧预览区域调整卡片大小（自动缩放）。
*   点击 **"下载反馈卡"** 按钮将当前预览保存为 PNG 图片。

---

## 🏗️ 代码结构概述

| 文件/目录 | 描述 |
| :--- | :--- |
| `package.json` | 项目依赖、脚本 (`dev`, `build`, `lint`) 定义。 |
| `vite.config.ts` | Vite 配置，包含 Tailwind CSS 插件、路径别名、以及环境变量处理。 |
| `index.html` | 应用的 HTML 入口文件，包含 React 的挂载点 `<div id="root"></div>`。 |
| `src/main.tsx` | React 应用的根入口文件，负责挂载 `<App />`。 |
| `src/App.tsx` | **核心组件**。包含了所有的 UI 布局、表单逻辑、状态管理（模板、日期、数据）以及下载逻辑。 |
| `src/types.ts` | 定义了所有复杂数据结构 (`FeedbackData`, `KnowledgePoint` 等) 的 TypeScript 接口。 |
| `src/index.css` | 项目的全局 CSS 文件，其中包含了反馈卡片 (`.feedback-card-container` 及其内部组件，如 `.calendar-cell`, `.stats-col`, `.badge-yellow` 等) 所需的 **关键样式**。 |

## ⚠️ 注意事项

*   **样式依赖：** 反馈卡片的复杂布局和美观性**完全依赖**于 `src/index.css` 中定义的类。请勿随意删除或修改该 CSS 文件中的核心样式定义。
*   **AI 功能：** AI 评论生成功能需要配置后端服务和有效的 API 密钥。客户端代码已安全处理，但在当前状态下点击 AI 按钮会返回模拟文本。
*   **数据持久化：** 模板数据通过 `localStorage` 进行持久化存储。
