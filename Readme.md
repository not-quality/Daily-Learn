## Vue-Daily Learn 项目结构

```text
Vue-Daily Learn/
├─ public/                       静态公开资源目录（构建时原样复制）
│  └─ favicon.ico                网站图标
├─ src/                          项目源代码主目录
│  ├─ assets/                    全局静态资源与样式
│  │  ├─ base.css                基础样式重置与通用样式
│  │  ├─ logo.svg                应用 Logo 资源
│  │  ├─ main.css                页面整体样式与布局
│  │  ├─ mobile-nav.css          手机端底部导航栏样式
│  │  ├─ navigation.css          通用导航栏样式
│  │  └─ style.json              样式/主题相关配置数据
│  ├─ components/                业务功能组件
│  │  ├─ DailyMission.vue        整体学习任务容器，整合句子、单词、日记等页面
│  │  ├─ DailyRecord.vue         日记编写与记录管理页面
│  │  ├─ DailyBrowse.vue         往日日记浏览与统计展示页面
│  │  ├─ DailySentence.vue       每日句子学习模块
│  │  ├─ DailyWords.vue          单词记忆与练习模块
│  │  └─ DiaryEntry.vue          单条日记编辑/查看页面
│  ├─ data/                      业务数据资源
│  │  ├─ CET4.json               四级词汇数据
│  │  ├─ CET6.json               六级词汇数据
│  │  └─ tasks.json              默认任务与示例数据
│  ├─ stores/                    状态管理相关模块
│  │  └─ counter.js              示例计数 Store（Pinia 使用示例）
│  ├─ utils/                     工具函数与存储服务
│  │  ├─ storage/                IndexedDB 存储服务模块
│  │  │  ├─ index.js             数据库初始化与通用 CRUD 操作（含 localStorage 降级机制）
│  │  │  ├─ sentences.js         句子练习数据存储 API
│  │  │  ├─ words.js             单词学习数据存储 API
│  │  │  ├─ tasks.js             任务列表存储 API
│  │  │  ├─ diary.js             日记记录与模板存储 API
│  │  │  └─ settings.js          应用设置存储 API
│  │  └─ migration.js            localStorage → IndexedDB 数据迁移服务
│  ├─ App.vue                    根组件，挂载 DailyMission 入口
│  └─ main.js                    应用入口文件，创建并挂载 Vue 应用
├─ index.html                    Vite SPA 入口 HTML 模板
├─ jsconfig.json                 JS/TS 路径别名与编辑器智能提示配置
├─ package.json                  项目依赖与脚本配置
├─ package-lock.json             依赖锁定文件，保证安装一致性
├─ vite.config.js                Vite 构建与开发服务器配置
└─ .gitignore                    Git 忽略文件配置
```

---

## 构建与部署说明

### 1. H5 网页构建
本项目已配置适配 H5 移动端网页构建，支持在任何 Web 服务器或本地静态服务中运行。

**安装依赖**：
```bash
npm install
```

**构建生产环境文件**：
```bash
npm run build
```
构建完成后，生成的 `dist` 文件夹即为完整的 H5 网页应用。

**本地预览**：
```bash
npm run preview
```
该命令会启动一个本地服务器，并支持通过局域网（手机连接同一 WiFi）访问预览。

### 2. 移动端 App 打包 (HBuilderX)
本项目支持使用 HBuilderX 打包为 Android/iOS 应用。

**兼容性说明**：
- **存储降级**：已在 `src/utils/storage/index.js` 中实现了智能降级机制。当运行在不支持 IndexedDB 的环境（如某些 WebView 或直接文件访问）时，系统会自动切换到 `localStorage` 存储，确保 App 不会白屏或崩溃。
- **路由模式**：项目使用自定义页面切换逻辑，不依赖 history API，天然适配 App 打包（无需配置 Hash 模式）。

**打包步骤**：
1. 运行 `npm run build` 生成 `dist` 目录。
2. 打开 HBuilderX，新建 `5+App` 项目。
3. 将 `dist` 目录下的所有文件复制到 HBuilderX 项目根目录。
4. 在 `manifest.json` 中配置应用名称、图标等信息。
5. 选择 `发行` -> `原生App-云打包`。

---

## components 目录下各组件说明
- 在修改代码之前需要先阅读 [Readme.md](Readme.md) 文件，了解项目中使用的所有物品的记录。
- 在更新项目后，需要更新 [Readme.md](Readme.md) 文件，记录项目中使用的所有物品。

### DailyMission.vue

整体「学习中心」容器组件，负责在不同学习模块之间切换，并承载「任务管理」功能：

- 维护 `currentPage` 状态，在「单词学习 / 句子练习 / 每日一记 / 往日迹忆 / 任务管理 / 日记编辑」之间切换视图
- 顶部导航（桌面端）与底部导航（移动端）统一在此控制，使用 `navigationItems` 配置导航项与图标
- 内部嵌套子组件：`DailySentence`、`DailyWords`、`DailyRecord`、`DailyBrowse`、`DiaryEntry`，通过事件实现页面跳转和数据回传
- 内置「任务管理」面板：
  - 支持新增、删除任务，统计总数 / 已完成 / 未完成
  - 任务列表支持拖拽排序、勾选完成状态
  - 使用本地 `tasks.json` 初始化数据，并将任务变更持久化到 IndexedDB
- 通过 `isMobile` 与 `shouldShowNavigation` 控制移动端底部导航在输入时收起，避免软键盘遮挡
- 负责日记编辑数据在 `DiaryEntry` 与其它视图之间的传递，并在保存后将日记写入 IndexedDB

### DailyRecord.vue

「每日一记」主界面组件，围绕日历驱动的日记记录与近期预览：

- 顶部复用统一导航栏，可在各模块之间切换
- 中部为三段联动的日历视图（上月 / 本月 / 下月），支持：
  - 高亮今日、选中日期
  - 禁用未来日期与起始日期之前的日期
  - 显示当天心情的 emoji；当有内容但未设置心情时，用问号提示
- 支持在移动端通过滑动切换月份（`touchstart / touchmove / touchend` 手势处理）
- 通过 IndexedDB 读取所有日记记录，提供：
  - 最近几天的「往日重现」列表预览
  - 点击列表项调用 `emit('openDiaryEntry')` 打开 `DiaryEntry` 进行详细编辑
- 提供「新增日记」悬浮按钮，快速以当前日期创建新记录
- 在移动端底部展示统一导航栏，通过 `navigationItems` 与父级联动切换页面

### DailyBrowse.vue

「往日迹忆」浏览与统计组件，聚焦历史日记的回顾与筛选：

- 顶部为统一导航栏，可在学习模块与任务管理之间切换
- 主内容区包括：
  - 视图模式切换：列表视图（纵向列表）与卡片网格视图
  - 排序切换：按日期升序 / 降序排列
- 通过 IndexedDB 读取所有带内容且已设置心情的记录，并计算：
  - 总记录数 `totalRecords`
  - 心情为积极表情（如 😊、😆）的「好心情」数量
  - 心情为消极表情的「差心情」数量
- 使用简易 `parseMarkdown` 函数，将日记内容中的 Markdown 语法（标题、加粗、斜体、删除线、链接、列表、引用等）转换为 HTML 预览
- 点击任意记录卡片会触发 `emit('editRecord')`，通知父组件在 `DailyRecord` 或 `DiaryEntry` 中打开该记录
- 将列表视图模式与排序方式持久化到 IndexedDB，下次打开时保留上次浏览习惯
- 移动端同样使用底部导航栏，方便在各模块间切换

### DailySentence.vue

每日句子学习模块：

- 每日更新一句英语名言/句子
- 支持查看释义和解析
- 记录学习打卡状态

### DailyWords.vue

单词记忆与练习模块：

- 基于 CET4/CET6 词库进行单词学习
- 支持单词拼写练习、选择题练习
- 记录单词掌握程度和学习进度
- 提供错题本功能，方便复习

### DiaryEntry.vue

单条日记编辑/查看页面：

- 支持 Markdown 格式编辑
- 支持选择心情 Emoji
- 自动保存编辑内容
- 适配移动端展示，优化输入体验
