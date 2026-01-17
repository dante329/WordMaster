# WordMaster 📚

**WordMaster** 是一款完全免费的、由 AI 驱动的沉浸式背单词应用。

它不同于传统的单词软件，WordMaster 允许你导入自己阅读过的**英文文章、笔记或文档**。利用 **DeepSeek** 或 **Google Gemini** 的强大能力，自动从你的上下文中提炼核心词汇、生成中文释义和例句，并存入你的专属词库。

应用内置了基于**艾宾浩斯遗忘曲线**的记忆算法（SRS），根据你对单词的熟悉程度智能推送复习，帮助你高效攻克生词。

## ✨ 主要特性

*   **🧠 AI 智能解析**: 支持接入 DeepSeek / Gemini，精准识别文本中的重点单词、短语和习语。
*   **📄 文档一键导入**: 支持粘贴文本或直接上传 `.txt`、`.docx` 文件，自动生成单词卡片。
*   **🔄 智能记忆算法**: 内置 SuperMemo-2 算法变体，根据遗忘曲线科学安排复习时间。
*   **🎯 上下文学习**: 单词释义和例句均保留原文语境，告别死记硬背。
*   **🔊 纯正发音**: 支持美音/英音自动发音（TTS）。
*   **🎹 沉浸式体验**: 优雅的 UI 设计，配合舒适的按键音效（Web Audio API合成，无需加载资源）。
*   **🔒 数据隐私**: 所有学习数据（词库、进度、设置）均存储在本地浏览器（IndexedDB/LocalStorage），无需注册登录。

---

## 🛠️ 本地部署 (使用 NPM)

如果你是开发者，或者想在本地电脑上运行：

### 1. 环境准备
确保你的电脑已安装 [Node.js](https://nodejs.org/) (建议版本 v18+)。

### 2. 获取代码
```bash
git clone https://github.com/your-username/word-master.git
cd word-master
```

### 3. 安装依赖
```bash
npm install
# 或者使用 yarn / pnpm
# yarn install
# pnpm install
```

### 4. 配置 API Key
在项目根目录创建一个 `.env` 文件（可以直接复制 `.env.example`）：

```bash
cp .env.example .env
```

打开 `.env` 文件，填入你的 DeepSeek API Key：

```env
# 你的 DeepSeek API Key
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> **注意**: 如果你使用的是 DeepSeek，请确保代码中 `services/geminiService.ts` 指向的是 DeepSeek 的 API 地址。

### 5. 启动项目
```bash
npm run dev
```
浏览器会自动打开 `http://localhost:5173`，你现在可以开始使用了！

---

## 🚀 部署到 Vercel (推荐)

你可以将这个应用免费部署到 Vercel，这样你就可以在手机、平板或任何电脑上通过网址访问它。

### 步骤 1: Fork 仓库
首先，将本仓库 **Fork** 到你自己的 GitHub 账号下。

### 步骤 2: 登录 Vercel
访问 [Vercel 官网](https://vercel.com/) 并使用 GitHub 账号登录。

### 步骤 3: 导入项目
1. 在 Vercel 控制台点击 **"Add New..."** -> **"Project"**。
2. 在列表中找到你刚刚 Fork 的 `word-master` 仓库，点击 **"Import"**。

### 步骤 4: 配置环境变量 (重要!)
在 **Configure Project** 页面，找到 **Environment Variables** 选项卡：

*   **Key**: 输入 `VITE_DEEPSEEK_API_KEY`
*   **Value**: 输入你的 DeepSeek API Key (以 `sk-` 开头)
*   点击 **Add**。

> **提示**: 如果你使用的是 Google Gemini，请根据代码情况修改变量名为对应的 Key。

### 步骤 5: 部署
点击 **"Deploy"** 按钮。等待约 1 分钟，Vercel 会自动构建并发布。
完成后，你会获得一个类似 `https://word-master-yourname.vercel.app` 的访问地址。

---

## ⚙️ 常见问题

**Q: 为什么解析文档时提示失败？**
*   检查 `.env` 中的 API Key 是否正确。
*   检查网络连接（部分 API 服务可能需要网络代理）。
*   确保上传的 `.docx` 文件未损坏。

**Q: 数据会丢失吗？**
*   数据存储在你的浏览器本地。如果你**清除浏览器缓存**或**更换设备**，数据会丢失。
*   建议定期在“设置”页面使用 **"备份数据 (导出)"** 功能将数据保存为 JSON 文件。

**Q: 如何修改 AI 模型提示词？**
*   你可以修改 `src/services/geminiService.ts` 文件中的 prompt 内容，以此来调整 AI 提取单词的风格或释义语言。

## 📄 License

MIT License. 免费开源，欢迎学习交流。
