# 她的名字 — Demo

这是基于 PRD 的前端 demo（纯静态）：SVG 词形脸、混词滚动、逐词可点击并打开词条详情（含时间轴占位）。

快速运行（推荐使用简单静态服务器，而不是直接用 `file://` 以免 fetch 失败）：

```bash
# Python 3
python -m http.server 8000
# 或者使用 node serve
npx serve .
```

然后在浏览器打开 http://localhost:8000

说明：
- 真实专辑封面 / 歌词字段为占位，请遵循 PRD 的版权建议在部署时替换或使用平台的 oEmbed。
- 无障碍：检测 `prefers-reduced-motion` 禁用滚动动画。

接下来可以做的事情：
- 美化字体与排版、替换更像手写的字体
- 改进行内混排算法以匹配 PRD 的密度/字号规则
- 将词条数据拆到单独 JSON 文件夹并实现管理脚本
