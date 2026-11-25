import assert from "node:assert/strict"
import { describe, it } from "node:test"
import seedReports from "../data/tda-reports.json"
import snapshot from "../data/paper-library.json"
import { compilePaperReports, normalizePaperMarkdown, renderPaperMarkdown } from "./papers"

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

  it("cleans the real latest report's formula notation, including nested functions and half-open intervals", async () => {
    const markdown = String.raw`维数 (d\leq2) 与 (d\geq3)，系数 (mathbb F_2)，曲线 (mathcal M) 和 (gamma)。

递归 (Q^n,Q^{n-1},\ldots,Q^1)，映射 (B^nG\simeq K(G,n))，区间 ([a,b)) 和尺度 (alpha\in[a,b/2))。

带宽 (h_n=n^{-1/(2N+2)})，上界 (O(n^{-2/(2N+2)}))；裸公式 SW_1、p≥1、2^(1/p)d_p≤d_p^r≤2d_p。`
    const normalized = normalizePaperMarkdown(markdown)
    for (const formula of [
      String.raw`$d\leq2$`,
      String.raw`$\mathbb F_2$`,
      String.raw`$\mathcal M$`,
      String.raw`$\gamma$`,
      String.raw`$B^nG\simeq K(G,n)$`,
      String.raw`$[a,b)$`,
      String.raw`$\alpha\in[a,b/2)$`,
      String.raw`$h_n=n^{-1/(2N+2)}$`,
      String.raw`$O(n^{-2/(2N+2)})$`,
      String.raw`$2^{1/p}d_p≤d_p^r≤2d_p$`,
    ])
      assert.ok(normalized.includes(formula), `${formula} missing from ${normalized}`)
    const html = await renderPaperMarkdown(markdown)
    assert.doesNotMatch(html, /katex-error/)
    assert.equal((html.match(/class="katex"/g) ?? []).length, 14)
    assert.equal(normalizePaperMarkdown(normalized), normalized)
  })

  it("separates the real November 16 URLs from Chinese punctuation and adjacent strong labels", async () => {
    const [report] = await compilePaperReports([
      {
        path: "reports/2026-11-16.md",
        markdown:
          "# TDA 每周新论文报告｜2026-11-16\n\n### 1. Relevant pairs\n\n**原文：** https://arxiv.org/abs/2611.09610；**HTML 全文：** https://arxiv.org/html/2611.09610；**标识：** arXiv:2611.09610；预印本 DOI：https://doi.org/10.48550/arXiv.2611.09610（注册状态以论文页为准）。**分类：** math.AT。",
      },
    ])
    const paper = report.papers[0]
    assert.equal(paper.url, "https://arxiv.org/abs/2611.09610")
    assert.match(paper.html, /<strong>HTML 全文：<\/strong>/)
    assert.match(paper.html, /<strong>标识：<\/strong>/)
    assert.match(paper.html, /<strong>分类：<\/strong>/)
    assert.match(paper.html, /href="https:\/\/doi.org\/10.48550\/arXiv.2611.09610"/)
    assert.doesNotMatch(paper.html, /%EF%BC|\*\*/)
  })

  it("cleans imported abstract TeX prose and backslash-wrapped formulas from the actual snapshot", async () => {
    const persistent = snapshot.papers.find(
      (paper) => paper.title === "Persistent Laplacians: properties, algorithms and implications",
    )!
    const statistics = snapshot.papers.find(
      (paper) =>
        paper.title === "Two-sample tests for relevant differences in persistence diagrams",
    )!
    const mapping = snapshot.papers.find((paper) => paper.abstract.includes("øverline"))!
    assert.match(await renderPaperMarkdown(persistent.abstract), /<em>persistent Laplacian<\/em>/)
    const prose = await renderPaperMarkdown(statistics.abstract)
    assert.match(prose, /Fréchet/)
    assert.doesNotMatch(prose, /Fr\{é\}chet|w\.r\.t\.\\/)
    const html = await renderPaperMarkdown(mapping.abstract)
    assert.doesNotMatch(html, /katex-error|øverline/)
    assert.match(html, /f: S \\rightarrow S/)
    assert.match(html, /\\overline M_f/)
  })

  it("normalizes explicit TeX delimiters and PDF Chinese line wraps while preserving source boundaries", async () => {
    const markdown = String.raw`正文 \(H_1(X)\)。

\[x^2 + y^2 = 1\]

非正截面曲率度量构
成的空间。

下一段。`
    const normalized = normalizePaperMarkdown(markdown)
    assert.ok(normalized.includes("$H_1(X)$"))
    assert.ok(normalized.includes("\n\n$$\nx^2 + y^2 = 1\n$$\n\n"))
    assert.ok(normalized.includes("度量构成的空间。\n\n下一段。"))
    assert.doesNotMatch(await renderPaperMarkdown(markdown), /katex-error/)
    assert.equal(normalizePaperMarkdown(normalized), normalized)
  })

  it("preserves code, existing math, explicit destinations, ordinary prose and ambiguous broken formulas", async () => {
    const markdown = [
      String.raw`$\text{Fr{é}chet} + x_1$ and $$H_0$$`,
      "Inline `(d\\leq2) https://example.com；**label**`",
      "~~~tex\n\\(H_0\\)\nSW_1\n~~~",
      "[label](https://example.com/a_(b)?x_1=2&name=；) and <https://example.com/a_(b)>",
      "(NLP) (or, in more generality, sequences) (arXiv v1) snake_case foo_bar",
      "(i) AI-generated text, (ii) ordinary prose; flattened ∑n=0∞ and 1<α<∞.",
      String.raw`C:\temp\file.txt and (\unknown{X}) and unmatched \(H_1`,
      "Price $20 and $30. [unsafe](javascript:alert%281%29)",
    ].join("\n\n")
    const normalized = normalizePaperMarkdown(markdown)
    assert.equal(normalized, markdown)
    assert.doesNotMatch(await renderPaperMarkdown(markdown), /href="javascript:|katex-error/)
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
