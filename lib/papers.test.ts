import assert from "node:assert/strict"
import { describe, it } from "node:test"
import seedReports from "../data/tda-reports.json"
import { compilePaperReports, renderPaperMarkdown } from "./papers"

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
    assert.match(
      reports[0].papers[0].html,
      /<a href="https:\/\/arxiv\.org\/abs\/2610\.36843" target="_blank" rel="noopener noreferrer">/,
    )
    assert.match(reports[1].papers[2].title, /^Spectral Braids/)
    assert.match(reports[1].conclusion, /综合判断/)
  })

  it("renders abstracts with the report renderer and opens navigation links in new tabs", async () => {
    const html = await renderPaperMarkdown(
      "**Abstract** with $H_1$ and `code`.\n\n- First\n- Second\n\n[paper](https://doi.org/10.1234/paper) [note](/blog/math/note) [section](#section)\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)",
    )
    assert.match(html, /<strong>Abstract<\/strong>/)
    assert.match(html, /class="katex"/)
    assert.match(html, /<code>code<\/code>/)
    assert.match(html, /<ul>\s*<li>First<\/li>\s*<li>Second<\/li>\s*<\/ul>/)
    assert.match(
      html,
      /<a href="https:\/\/doi\.org\/10\.1234\/paper" target="_blank" rel="noopener noreferrer">paper<\/a>/,
    )
    assert.match(
      html,
      /<a href="\/blog\/math\/note" target="_blank" rel="noopener noreferrer">note<\/a>/,
    )
    assert.match(html, /<a href="#section">section<\/a>/)
    assert.doesNotMatch(html, /<script|href="javascript:/)
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
