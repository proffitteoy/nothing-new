// src/app/about/page.tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm'; // 🌟 引入 GFM 以支持 ~~删除线~~
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// 引入高亮主题
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

import PageTransition from '../../components/PageTransition';
import AboutClient, { type GitHubContributions } from '../../components/AboutClient';
import { Suspense } from 'react';
import styles from '../../components/AboutClient.module.css';

const GITHUB_CONTRIBUTIONS_URL = 'https://github.com/users/proffitteoy/contributions';

export const revalidate = 43200;

export const metadata = {
  alternates: { canonical: "/about" },
};

async function getGitHubContributions(): Promise<GitHubContributions | null> {
  try {
    const response = await fetch(GITHUB_CONTRIBUTIONS_URL, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'nothing-new.cn',
      },
      next: { revalidate: 43200 },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      throw new Error(`GitHub contributions returned ${response.status}`);
    }

    const html = await response.text();
    const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/i);
    const total = totalMatch ? Number(totalMatch[1].replaceAll(',', '')) : Number.NaN;
    const countsByCellId = new Map<string, number>();

    for (const tooltip of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/gi)) {
      const cellIdMatch = tooltip[1].match(/\bfor="([^"]+)"/i);
      if (!cellIdMatch) continue;

      const countMatch = tooltip[2].match(/([\d,]+)\s+contributions?/i);
      if (countMatch) {
        countsByCellId.set(cellIdMatch[1], Number(countMatch[1].replaceAll(',', '')));
      } else if (/no contributions?/i.test(tooltip[2])) {
        countsByCellId.set(cellIdMatch[1], 0);
      }
    }

    const daysByDate = new Map<string, GitHubContributions['days'][number]>();

    for (const cell of html.matchAll(/<td\b[^>]*>/gi)) {
      const dateMatch = cell[0].match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/i);
      const cellIdMatch = cell[0].match(/\bid="([^"]+)"/i);
      const levelMatch = cell[0].match(/\bdata-level="([0-4])"/i);
      if (!dateMatch || !cellIdMatch || !levelMatch) continue;

      const count = countsByCellId.get(cellIdMatch[1]);
      if (count === undefined) continue;

      daysByDate.set(dateMatch[1], {
        date: dateMatch[1],
        count,
        level: Number(levelMatch[1]) as 0 | 1 | 2 | 3 | 4,
      });
    }

    if (!Number.isFinite(total) || daysByDate.size === 0) {
      throw new Error('GitHub contributions response format changed');
    }

    return {
      total,
      days: [...daysByDate.values()].sort((left, right) => left.date.localeCompare(right.date)),
    };
  } catch (error) {
    console.error('读取 GitHub 贡献数据失败', error);
    return null;
  }
}

export default async function AboutPage() {

  const fullPath = path.join(process.cwd(), 'app', 'about', 'about.md');
  let contentHtml = "博主很懒，还没有写自我介绍哦...";
  let coverImage = "https://bu.dusays.com/2026/03/24/69c23dc278c78.jpg";

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    // 🌟 改为 let，以便进行文本预清洗
    const parsed = matter(fileContents);
    const { data } = parsed;
    let { content } = parsed;
    if (data.cover) coverImage = data.cover;

    // ==========================================
    // 🌟 解析前物理清洗区
    // ==========================================
    // 1. 强行给没有语言标记的代码块加上 cpp 标签，防止侦测失败
    content = content.replace(/^```\s*$/gm, '```cpp');
    // 2. 强行修复数字列表缺少空格导致无法渲染为列表的 Bug (1.百度 -> 1. 百度)
    content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');

    // 3. 🌟 拯救被 Markdown 引擎吞噬的“连续空行” (同步前台展示页的阵法)
    content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');
    const blocks = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
    content = blocks.map((block, index) => {
      if (index % 2 === 1) return block; // 代码块绝对不碰
      return block.replace(/\n{3,}/g, (match) => {
        const brCount = match.length - 2;
        return '\n\n' + '<br>'.repeat(brCount) + '\n\n';
      });
    }).join('');
    // ==========================================

    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkGfm) // 🌟 挂载 GFM 解析
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      // 🌟 核心修复：开启自动语言侦测，并限制语言白名单！
      .use(rehypeHighlight, {
        detect: true,
        ignoreMissing: true,
        subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml']
      })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);

    contentHtml = processedContent.toString();
  } catch (e) {
    console.error("读取 about.md 失败", e);
  }

  const githubContributions = await getGitHubContributions();

  return (
    <div className={styles.page}>
      <PageTransition>
        <main className={styles.main}>
          <Suspense fallback={<div className={styles.loading}>正在载入档案...</div>}>
            <AboutClient
              contentHtml={contentHtml}
              coverImage={coverImage}
              githubContributions={githubContributions}
            />
          </Suspense>
        </main>
      </PageTransition>
    </div>
  )
}
