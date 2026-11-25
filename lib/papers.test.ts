import assert from "node:assert/strict"
import { describe, it } from "node:test"
import seedReports from "../data/tda-reports.json"
import { compilePaperReports } from "./papers"

describe("TDA report publishing", () => {
  it("splits the real reports without losing reviews, links, or conclusions", async () => {
    const reports = await compilePaperReports([...seedReports].reverse())
    assert.deepEqual(
      reports.map((report) => [report.date, report.papers.length]),
      [
        ["2026-11-02", 6],
        ["2026-10-30", 3],
      ],
    )
    assert.match(reports[0].papers[0].html, /独立学术评价/)
    assert.equal(reports[0].papers[0].priority, "高")
    assert.deepEqual(reports[0].papers[0].authors, ["Junyan Chu", "Shizuo Kaji", "Meiyan Kang"])
    assert.equal(reports[0].papers[0].year, "2026")
    assert.equal(reports[0].papers[0].url, "https://arxiv.org/abs/2610.36843")
    assert.match(reports[1].papers[2].title, /^Spectral Braids/)
    assert.match(reports[1].conclusion, /综合判断/)
  })

  it("keeps published list metadata out of the authors while preserving it in the detail", async () => {
    const [report] = await compilePaperReports([
      {
        path: "reports/2026-11-23.md",
        markdown: [
          "# TDA 每周新论文报告｜2026-11-23",
          "",
          "### 1. Möbius Invertibility of Rank Invariants",
          "",
          "- **作者：** Nathaniel Clause、Woojin Kim、Facundo Mémoli",
          "- **首次公开：** 2026-11-16（arXiv v1）",
          "- **原文：** [arXiv:2611.20463](https://arxiv.org/abs/2611.20463) · [HTML 全文](https://arxiv.org/html/2611.20463)",
          "- **标识：** arXiv:2611.20463；[arXiv DOI](https://doi.org/10.48550/arXiv.2611.20463)（DataCite 登记状态以论文页面为准）",
          "",
          "**阅读优先级：最高。** 先读定理及反例。",
        ].join("\n"),
      },
    ])
    const paper = report.papers[0]
    assert.deepEqual(paper.authors, ["Nathaniel Clause", "Woojin Kim", "Facundo Mémoli"])
    assert.equal(paper.year, "2026")
    assert.equal(paper.priority, "最高")
    assert.equal(paper.url, "https://arxiv.org/abs/2611.20463")
    assert.match(paper.html, /<li><strong>首次公开：<\/strong> 2026-11-16/)
    assert.match(paper.html, /https:\/\/arxiv.org\/html\/2611.20463/)
    assert.match(paper.html, /DataCite 登记状态以论文页面为准/)
  })

  it("separates author fields across soft breaks, hard breaks, and paragraphs", async () => {
    for (const separator of ["\n", "  \n", "\n\n"]) {
      const [report] = await compilePaperReports([
        {
          path: "reports/2026-11-23.md",
          markdown: [
            "# TDA 每周新论文报告｜2026-11-23\n\n### 1. Metadata boundaries\n",
            [
              "**作者：** Tony Xiaocheng Xiao、Jose A. Perea",
              "**首次提交：** 2026-11-18",
              "**原文：** https://arxiv.org/abs/2611.23659",
            ].join(separator),
          ].join("\n"),
        },
      ])
      assert.deepEqual(report.papers[0].authors, ["Tony Xiaocheng Xiao", "Jose A. Perea"])
      assert.equal(report.papers[0].year, "2026")
    }
  })

  it("renders math and Markdown while discarding executable HTML and unsafe links", async () => {
    const [report] = await compilePaperReports([
      {
        path: "reports/2026-11-02.md",
        markdown:
          "# TDA 每周新论文报告｜2026-11-02\n\n导读\n\n### 1. Test\n\n**摘要** $H_1$\n\n作者研究一个问题。\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)\n\n## 综合判断\n\n结语",
      },
    ])
    assert.match(report.papers[0].html, /class="katex"/)
    assert.deepEqual(report.papers[0].authors, [])
    assert.match(report.papers[0].html, /<strong>摘要<\/strong>/)
    assert.doesNotMatch(report.papers[0].html, /<script|href="javascript:/)
    assert.match(report.introduction, /导读/)
    assert.match(report.conclusion, /结语/)
  })

  it("rejects invalid dates, duplicate reports, path traversal, and unsupported report layouts", async () => {
    for (const input of [
      [],
      [seedReports[0], seedReports[0]],
      [{ ...seedReports[0], path: "../reports/2026-11-02.md" }],
      [{ ...seedReports[0], path: "reports/2026-02-31.md" }],
      [{ ...seedReports[0], markdown: "# Wrong report" }],
      [
        {
          path: "reports/2026-11-02.md",
          markdown: "# TDA 每周新论文报告｜2026-11-02\n\nNo papers",
        },
      ],
    ]) {
      await assert.rejects(compilePaperReports(input))
    }
  })
})
