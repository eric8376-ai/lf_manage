# lf_manage - 生活管理系统

纯静态 H5 单页应用，无构建工具、无包管理器、无 Node 依赖。

## 架构

- `index.html` — 唯一入口，加载 `lib/marked.min.js`（Markdown 解析）和 `js/app.js`
- `js/app.js` — 全部应用逻辑（路由、Markdown 渲染、Tab 扩展、wiki-link、侧边栏、面包屑导航），单文件 IIFE
- `css/style.css` — 全局样式
- `content/` — Markdown 内容文件，按模块分目录
  - 顶层 `.md` 文件对应底部导航栏页面（`plan.md`, `health.md`, `fitness.md`, `mind.md`, `hobby.md`）
  - 子目录存放子页面（如 `content/fitness/chest.md`）

## 路由机制

- 使用 URL 查询参数 `?page=health` 路由，不是 hash 路由
- 底部导航栏对应 5 个页面：`plan`, `health`, `fitness`, `mind`, `hobby`
- 子页面通过 `[[wikilink]]` 语法跳转，用 `loadSubPage()` 加载

## 内容编辑约定

- 编辑 `content/` 下的 `.md` 文件即可更新内容，无需改代码
- 支持 Obsidian 风格双链语法：`[[文件名]]` 或 `[[文件名|显示文本]]`
- 支持自定义 Tab 语法：
  ```
  === "标签1"
      内容1
  ===+ "默认标签"
      内容2（+号表示默认激活）
  ```

## 本地开发

直接浏览器打开 `index.html` 即可（需 HTTP 服务才能 `fetch` 内容文件，可用 `python -m http.server`）。

## 部署

GitHub Pages，推送到 main 后自动更新。地址：`https://eric8376-ai.github.io/lf_manage/`

## Git 提交风格

提交信息使用 emoji + 中文，如 `✨ feat: 描述`。

## 注意事项

- 没有测试、lint、typecheck——纯手工静态项目
- `lib/marked.min.js` 是外部依赖的压缩文件，不要手动编辑
- 修改 `css/style.css` 后注意 URL 中的版本号 `?v=2` 需要递增以破缓存
- `docs/` 目录当前为空
