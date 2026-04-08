# Changelog

## 2026-04-08

### ✨ 嵌套 Tab + PC 端适配优化

- **content/health.md**：「情绪与激素」和「活动与激素」改为外层 Tab 嵌套内层 Tab 结构；「轴间关系」从最后一个内层 Tab 移出，独立放在 4 个内层 Tab 之后
- **css/style.css**：PC 端内容区 `max-width` 从固定 800px 改为 `min(960px, calc(100vw - 340px))`，宽屏自适应减少右侧留白；新增嵌套 Tab 样式（浅背景、细边框）
- **index.html**：CSS 缓存版本号 v2 → v3
- **md-h5-template/app.js**：`renderTabs` 中增加 `parseTabs` 递归调用，支持嵌套 Tab 渲染
- **md-h5-template/style.css**：同步 PC 端 max-width 自适应 + 嵌套 Tab 样式
- **MD网站模版.md**：补充嵌套 Tab 语法说明、renderTabs 递归要点
