// Original screen studies and printed details; no third-party screenshots or covers.
import sharp from "sharp"
import { fileURLToPath } from "node:url"
import { writeFile, unlink } from "node:fs/promises"

if (process.argv.includes("--surfaces")) {
  const keys = []
  const add = (label, x, row, units = 1) => keys.push({ label, x, row, units })
  const row = (index, items) => {
    let x = 0
    for (const item of items) {
      const [label, width = 1] = Array.isArray(item) ? item : [item]
      add(label, x, index, width)
      x += width
    }
  }
  row(4, [..."`1234567890-=", ["Backspace", 2]])
  row(3, [["Tab", 1.5], ..."QWERTYUIOP[]", ["\\", 1.5]])
  row(2, [["Caps", 1.75], ..."ASDFGHJKL;'", ["Enter", 2.25]])
  row(1, [["Shift", 2.25], ..."ZXCVBNM,./", ["Shift", 2.75]])
  row(0, [
    ["Ctrl", 1.25],
    ["Win", 1.25],
    ["Alt", 1.25],
    ["", 6.25],
    ["Alt", 1.25],
    ["Fn", 1.25],
    ["Menu", 1.25],
    ["Ctrl", 1.25],
  ])
  add("Esc", 0, 5)
  for (let i = 0; i < 12; i++) add(`F${i + 1}`, 2 + i + Math.floor(i / 4) * 0.5, 5)
  for (const [r, labels] of [
    [5, ["PrtSc", "ScrLk", "Pause"]],
    [4, ["Ins", "Home", "PgUp"]],
    [3, ["Del", "End", "PgDn"]],
    [0, ["←", "↓", "→"]],
  ])
    labels.forEach((label, i) => add(label, 15.5 + i, r))
  add("↑", 16.5, 1)
  const books = [
    ["TOPOLOGY", "#344d60"],
    ["ANALYSIS", "#c6b89b"],
    ["GEOMETRY", "#775341"],
    ["PROBABILITY", "#5c6961"],
    ["ALGORITHMS", "#303740"],
    ["LINEAR ALGEBRA", "#9b6c4e"],
    ["PERSISTENCE", "#454768"],
    ["GRAPH THEORY", "#b8b3a1"],
    ["MEASURE THEORY", "#53626e"],
    ["RESEARCH NOTES", "#947c68"],
    ["NUMERICAL METHODS", "#62634e"],
    ["TOPOLOGICAL DATA", "#44505a"],
  ]
  const surfaces = {
    campus: [3072, 0, 1024, 576],
    iris: [3072, 592, 1024, 640],
    topp: [3072, 1248, 768, 1344],
  }
  const escaped = (value) =>
    String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  const rect = (x, y, w, h, fill, radius = 0) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`
  const text = (x, y, value, size = 16, fill = "#263747", extra = "") =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escaped(value)}</text>`
  const line = (x1, y1, x2, y2, color, width = 1) =>
    `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none"/>`
  const circle = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`
  const pieces = []
  const place = (id, body) => {
    const [x, y, w, h] = surfaces[id]
    pieces.push(
      `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
    )
  }
  let campus = rect(0, 0, 1024, 576, "#e7ebef") + rect(0, 0, 1024, 35, "#d3d8df")
  campus += rect(13, 6, 220, 29, "#f7f8fa", 8) + text(30, 25, "学院竞赛平台", 14)
  campus +=
    rect(0, 35, 1024, 39, "#f7f8fa") +
    text(19, 60, "‹   ›   ↻", 20) +
    rect(108, 42, 780, 24, "#e7ebef", 12) +
    text(125, 59, "competition / dashboard", 13, "#536270")
  campus +=
    rect(0, 74, 184, 502, "#1e2b40") +
    text(23, 118, "竞赛工作台", 23, "#f5f6f8") +
    text(24, 146, "CAMPUS  /  PORTAL", 10, "#b5bdcb")
  for (const [i, label] of ["赛事总览", "报名管理", "作品提交", "通知公告", "个人中心"].entries()) {
    if (!i) campus += rect(12, 175, 159, 42, "#394d70", 5)
    campus += text(29, 201 + i * 55, label, 17, i ? "#bec7d2" : "#ffffff")
  }
  campus +=
    text(211, 112, "赛事总览", 23) +
    text(211, 143, "从报名到作品归档，让组织与参与更清楚。", 15, "#687786")
  campus +=
    rect(211, 165, 783, 41, "#fff", 5) +
    text(231, 191, "全部赛事      数学建模      程序设计      学科竞赛", 15)
  for (const [i, title] of ["数学建模", "程序设计", "学科创新"].entries()) {
    const x = 211 + i * 265
    campus +=
      rect(x, 225, 252, 228, "#fafbfc", 6) +
      rect(x, 225, 252, 70, ["#dce4eb", "#dfe4e1", "#e8e1d9"][i], 6)
    campus += text(
      x + 18,
      269,
      ["MODEL / EXPLORE", "BUILD / SOLVE", "LEARN / SHARE"][i],
      16,
      "#47596a",
    )
    campus += text(x + 18, 326, title, 23) + text(x + 18, 357, "赛事说明 · 报名须知", 14, "#687786")
    campus +=
      text(x + 18, 382, "时间与规则以正式公告为准", 13, "#687786") +
      line(x + 18, 403, x + 232, 403, "#dce0e5") +
      text(x + 18, 433, "查看赛事信息  →", 15, "#4b6183")
  }
  campus +=
    rect(211, 473, 782, 53, "#fafbfc", 5) +
    text(229, 505, "通知公告    /    报名、提交与评审流程说明", 15)
  campus += text(211, 556, "界面示意 · 非在线赛事数据", 12, "#74808b")
  place("campus", campus)
  let iris = rect(0, 0, 1024, 640, "#182027") + rect(0, 0, 1024, 35, "#27313a")
  iris +=
    text(18, 24, "Iris Terminal", 15, "#d8e1e6") + text(851, 24, "—     □     ×", 16, "#9babb5")
  iris += rect(0, 35, 226, 576, "#1e2831") + text(20, 69, "WORKSPACE", 12, "#91a5b4")
  for (const [i, label] of [
    "⌄  research",
    "   sessions",
    "   topology-notes",
    "   project-planning",
    "⌄  conversations",
    "   main-thread",
    "   proof-sketch",
    "   implementation",
  ].entries())
    iris += text(19, 106 + 29 * i, label, 15, i === 6 ? "#a9cad6" : "#93a5b4")
  iris += rect(238, 46, 162, 30, "#31414c", 4) + text(254, 66, "research / main", 13, "#d2e0e7")
  iris +=
    text(251, 112, "A workspace for connected ideas", 22, "#e0e6e8") +
    text(251, 142, "Session tree  /  branch context", 14, "#899fad")
  for (const [x, y, label] of [
    [332, 210, "Question"],
    [526, 283, "Proof sketch"],
    [750, 210, "Implementation"],
  ]) {
    iris += rect(x - 76, y - 25, 158, 53, "#273641", 6) + text(x - 60, y + 7, label, 15, "#c5d9df")
  }
  iris += line(413, 212, 451, 275, "#648597", 2) + line(605, 277, 675, 214, "#648597", 2)
  iris +=
    rect(242, 346, 753, 205, "#111a22", 4) +
    text(260, 375, "TERMINAL    ·    research", 12, "#91a5b4")
  const terminal = [
    "$ cd research",
    "$ git status --short",
    "",
    "# keep notes, code and context together",
    "$ _",
  ]
  terminal.forEach(
    (value, i) =>
      (iris += text(
        260,
        409 + i * 26,
        value,
        16,
        i === 3 ? "#789a89" : "#c0cfda",
        'font-family="Consolas,monospace"',
      )),
  )
  iris +=
    text(246, 585, "WORKSPACE STUDY · illustrative session", 12, "#8ba0ad") +
    rect(0, 611, 1024, 29, "#355063") +
    text(17, 631, "Iris  /  workspace     •     UTF-8", 12, "#deeaed")
  place("iris", iris)
  let topp =
    rect(0, 0, 768, 1344, "#f0f2f3") +
    rect(0, 0, 768, 39, "#d7dce0") +
    text(19, 27, "Topp  /  diagram-distance.ipynb", 17)
  topp +=
    rect(0, 39, 768, 61, "#e7ebed") +
    text(21, 76, "File   Edit   View   Run   Kernel", 19, "#4c5b64")
  topp +=
    text(47, 159, "Persistence diagram distances", 29) +
    text(48, 199, "Topp  /  bottleneck · Wasserstein", 20, "#6b7a85")
  topp +=
    rect(42, 231, 684, 164, "#e2e7eb", 6) +
    text(59, 263, "[ ]  import topp", 21, "#314b66", 'font-family="Consolas,monospace"') +
    text(115, 304, "# Pairing two diagrams", 20, "#6c7e6e") +
    text(115, 346, "# Schematic points below", 20, "#6c7e6e")
  topp += rect(42, 423, 684, 597, "#fcfcfb", 6) + text(77, 468, "Diagram matching", 23)
  for (let i = 0; i < 6; i++) {
    topp +=
      line(116 + i * 104, 512, 116 + i * 104, 928, "#e1e5e8") +
      line(116, 928 - i * 83, 636, 928 - i * 83, "#e1e5e8")
    topp += text(111 + i * 104, 957, (i / 5).toFixed(1), 16, "#788793")
  }
  topp +=
    line(116, 512, 116, 928, "#647681", 2) +
    line(116, 928, 636, 928, "#647681", 2) +
    line(116, 928, 636, 512, "#9caeb6", 2)
  for (const [x, y, dx, dy] of [
    [173, 790, 22, -24],
    [224, 652, 18, 28],
    [338, 567, -26, 12],
    [418, 641, 17, -30],
    [299, 732, 16, -18],
    [516, 538, 20, -9],
  ])
    topp +=
      line(x, y, x + dx, y + dy, "#bcc5ca", 3) +
      circle(x, y, 6, "#516c88") +
      circle(x + dx, y + dy, 5, "#ae785a")
  topp += text(323, 995, "birth", 19, "#586b78") + text(73, 540, "death", 16, "#586b78")
  topp +=
    circle(96, 1074, 6, "#516c88") +
    text(116, 1081, "Diagram A", 20) +
    circle(352, 1074, 6, "#ae785a") +
    text(373, 1081, "Diagram B", 20)
  topp +=
    text(47, 1153, "Distances compare diagram structure.", 22) +
    text(47, 1191, "Pairing shown for explanation only.", 20, "#687d87") +
    text(47, 1276, "示意图 · 非项目截图或实测结果", 17, "#788791")
  place("topp", topp)
  // Individually allocated print patches keep illumination distinct per physical object.
  const allKeys = [
    ...keys.map((k) => ({ ...k, laptop: false })),
    ...keys.filter((k) => k.x < 15).map((k) => ({ ...k, laptop: true })),
  ]
  allKeys.forEach((key, index) => {
    key.surface = `key-${index}`
    surfaces[key.surface] = [(index % 64) * 64, 3072 + Math.floor(index / 64) * 64, 64, 64]
    const labelSize = key.label.length > 3 ? 11 : key.label.length > 1 ? 14 : 24
    place(
      key.surface,
      rect(0, 0, 64, 64, key.laptop ? "#202830" : "#e2dfd3") +
        text(
          8,
          29,
          key.label,
          labelSize,
          key.laptop ? "#c7ccce" : "#394148",
          'font-family="Consolas,monospace"',
        ),
    )
  })
  const volumes = Array.from({ length: 36 }, (_, index) => {
    const [title, color] = books[index % books.length]
    const id = `book-${index}`
    surfaces[id] = [index * 96, 3456, 96, 576]
    const pale = [1, 7, 9].includes(index % books.length)
    const print = pale ? "#373e41" : "#e9e2ce"
    place(
      id,
      rect(0, 0, 96, 576, color) +
        rect(4, 0, 2, 576, pale ? "#afa18a" : "#28313a") +
        rect(88, 0, 2, 576, pale ? "#dbd0b9" : "#6f7879") +
        line(17, 40, 77, 40, print) +
        text(48, 83, String((index % 12) + 1).padStart(2, "0"), 19, print, 'text-anchor="middle"') +
        `<g transform="translate(52,125) rotate(90)">${text(0, 0, title, 22, print)}</g>` +
        line(17, 486, 77, 486, print) +
        text(48, 518, "STUDY", 13, print, 'text-anchor="middle"') +
        text(48, 541, "LIBRARY", 10, print, 'text-anchor="middle"'),
    )
    return { id, title, color }
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" font-family="Microsoft YaHei,Segoe UI,sans-serif">${pieces.join("")}</svg>`
  await sharp(Buffer.from(svg))
    .png()
    .toFile(fileURLToPath(new URL("../design/projects-room/study-details.png", import.meta.url)))
  await writeFile(
    new URL("../design/projects-room/study-details.json", import.meta.url),
    JSON.stringify({ surfaces, keys: allKeys, books: volumes }, null, 2) + "\n",
  )
  console.log(
    `Original detail atlas: 3 displays, ${allKeys.length} key legends, ${volumes.length} book spines`,
  )
} else {
  for (const name of ["day", "night", "detail", "mobile", "mobile-night"]) {
    const source = new URL(`../public/projects-room/${name}.png`, import.meta.url)
    const target = new URL(`../public/projects-room/${name}.webp`, import.meta.url)
    await sharp(fileURLToPath(source))
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(fileURLToPath(target))
    await unlink(source)
  }
  await unlink(new URL("../public/projects-room/study-day.jpg", import.meta.url))
}
