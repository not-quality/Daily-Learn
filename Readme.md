## Vue-Daily Learn 项目结构

Vue-Daily Learn/
├─ .vscode/                      VS Code 工作区配置
│  └─ extensions.json            推荐/使用的编辑器扩展配置
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
│  ├─ App.vue                    根组件，挂载 DailyMission 入口
│  └─ main.js                    应用入口文件，创建并挂载 Vue 应用
├─ index.html                    Vite SPA 入口 HTML 模板
├─ jsconfig.json                 JS/TS 路径别名与编辑器智能提示配置
├─ package.json                  项目依赖与脚本配置
├─ package-lock.json             依赖锁定文件，保证安装一致性
├─ vite.config.js                Vite 构建与开发服务器配置
└─ .gitignore                    Git 忽略文件配置

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
  - 使用本地 `tasks.json` 初始化数据，并将任务变更持久化到 `localStorage`
- 通过 `isMobile` 与 `shouldShowNavigation` 控制移动端底部导航在输入时收起，避免软键盘遮挡
- 负责日记编辑数据在 `DiaryEntry` 与其它视图之间的传递，并在保存后将日记写入 `localStorage('daily-records')`

### DailyRecord.vue

「每日一记」主界面组件，围绕日历驱动的日记记录与近期预览：

- 顶部复用统一导航栏，可在各模块之间切换
- 中部为三段联动的日历视图（上月 / 本月 / 下月），支持：
  - 高亮今日、选中日期
  - 禁用未来日期与起始日期之前的日期
  - 显示当天心情的 emoji；当有内容但未设置心情时，用问号提示
- 支持在移动端通过滑动切换月份（`touchstart / touchmove / touchend` 手势处理）
- 通过 `localStorage('daily-records')` 读取所有日记记录，提供：
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
- 通过 `localStorage('daily-records')` 读取所有带内容且已设置心情的记录，并计算：
  - 总记录数 `totalRecords`
  - 心情为积极表情（如 😊、😆）的「好心情」数量
  - 心情为消极表情的「差心情」数量
- 使用简易 `parseMarkdown` 函数，将日记内容中的 Markdown 语法（标题、加粗、斜体、删除线、链接、列表、引用等）转换为 HTML 预览
- 点击任意记录卡片会触发 `emit('editRecord')`，通知父组件在 `DailyRecord` 或 `DiaryEntry` 中打开该记录
- 将列表视图模式与排序方式持久化到本地 `localStorage('daily_browse_settings')`，下次打开时保留上次浏览习惯
- 移动端同样使用底部导航栏，方便在各模块间切换

### DailySentence.vue

句子填空练习与句库管理组件，帮助练习中英文句子表达：

- 顶部导航可在「单词学习 / 句子练习 / 每日一记 / 往日迹忆 / 任务管理」间切换，当前页面为 `sentence`
- 主练习区域按题目编号渲染句子：
  - 上方展示中文句子与完成/删除按钮
  - 下方根据英文句子词数自动生成输入框数组，支持按键切换焦点
  - 点击「查看答案」切换显示完整英文句子，再次点击可收起
- 使用 `localStorage('vue_daily_sentences')` 管理句库：
  - 首次运行时以内置 `initialSentences` 初始化本地数据
  - 后续所有修改（新增、删除、完成状态等）都写回本地
- 支持添加自定义句子：
  - 通过表单输入编号 / 中文句子 / 英文句子
  - 自动校验编号唯一性与必填字段
  - 添加成功后立即写入本地并刷新练习列表
- 为长句子或按钮区域提供自动换行控制，避免布局抖动，并通过状态位（如 `chineseWrapped`、`buttonWrapped`）记录 UI 适配效果

### DailyWords.vue

单词选择题练习组件，使用四/六级词汇数据实现分组学习与进度追踪：

- 顶部导航与其他页面保持一致，用于切换到句子、日记、浏览、任务等模块
- 依赖 `CET4.json` 与 `CET6.json` 提供词库数据，通过 `currentLevel` 在四级 / 六级之间切换
- 每轮学习流程：
  - 按配置的 `wordsPerGroup`（默认 10 个）抽取一组单词作为本轮题目
  - 每个单词生成多项选择题，选项顺序打乱
  - 记录用户选择、是否查看答案，以及每个单词的正确累计次数 `correctCount`
- 当某个单词的正确次数达到阈值（如 3 次）后，认为该单词已掌握，计入 `masteredWords` 与 `completedWordsList`
- 总览统计包括：学习单词总数、已掌握数量、答题次数与整体正确率 `correctRate`
- 本地持久化：
  - 以 `vue_daily_words_CET4 / CET6` 为 key 存储各级别的单词学习进度
  - 以 `vue_daily_words_settings` 存储每组单词数量等学习设置
- 提供「学习设置」弹窗，可调整每组单词数量，并支持「应用并重新开始」快速刷新一轮新学习

### DiaryEntry.vue

单条日记的富文本 / Markdown 编辑组件，支持图片与模板，作为 `每日一记` 的详细编辑页：

- 接收父组件传入的 `recordData`、`selectedDate` 和 `sourceView`，并在内部复制为可编辑的 `currentRecord`
- 顶部工具栏：
  - 返回按钮：触发 `emit('back')`，并将来源视图（记录页 / 浏览页）回传给父组件
  - 保存按钮：通过 `emit('save')` 将当前记录数据回传，由父组件负责写入 `localStorage('daily-records')`
- 三页面滑动架构（2025-01-17 更新）：
  - 采用三页面架构（前一天、当天、后一天）同时渲染，通过滑动在页面间切换
  - 前后页面添加了 Markdown 工具栏占位符，防止切换时因高度不一致导致的页面跳动
  - 统一了三个页面的内容区域最小高度（桌面端 500px，移动端 400px），确保切换动画流畅
- 手机端左右滑动切换日记：
  - 支持在移动端通过左右滑动切换前后一天的日记（`touchstart / touchmove / touchend` 手势处理）
  - 向右滑动切换到前一天，向左滑动切换到后一天
  - 滑动阈值为屏幕宽度的 20%，只在非编辑状态下启用滑动功能
  - 添加了日期边界限制：不允许滑动到未来日期（今天的日记无法左滑到明天）
  - 滑动时有平滑的动画效果，提升用户体验
- 图片管理：
  - 通过「拍照」与「选择图片」按钮采集图片，并以 `images` 数组形式挂在记录上
  - 支持点击图片全屏预览、在全屏预览中删除图片
- 心情选择：
  - 提供一组 emoji 作为心情选项
  - 再次点击已选中的心情会清空心情，增强操作灵活性
- Markdown 编辑体验：
  - 提供 Markdown 工具栏按钮，一键插入标题、加粗、斜体、删除线、链接、列表、引用等标记
  - 支持编辑模式与预览模式切换，预览中使用 `parseMarkdown` 将 Markdown 文本渲染为 HTML
  - 占位文案会根据当前日期动态变化（今天/历史某日）
- 模板系统：
  - 允许维护多条日记模板，包含名称与内容
  - 支持新建、编辑、删除模板，以及点击模板快速插入到当前内容中
- 通过 dayjs 处理日期显示（如编辑头部日期、占位提示），并统一使用中文本地化
