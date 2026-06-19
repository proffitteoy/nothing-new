import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import BackButton from '../../components/BackButton';

async function renderProjectsReadme() {
  const readmePath = path.join(process.cwd(), 'data', 'proffitteoy-readme.md');
  let markdown = '';

  try {
    markdown = fs.readFileSync(readmePath, 'utf8');
  } catch {
    markdown = '# 项目矩阵\n\n项目说明暂未找到。';
  }

  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return processed.toString();
}

export default async function ProjectsBoard() {
  const contentHtml = await renderProjectsReadme();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-10 py-10 relative z-10">
      <div className="w-full flex justify-start mb-6">
        <BackButton />
      </div>

      <section className="mb-8 rounded-3xl bg-slate-950/90 border border-indigo-400/20 shadow-2xl overflow-hidden">
        <div className="p-5 md:p-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black tracking-[0.35em] text-cyan-300 mb-4">
              代码主页
            </p>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              项目矩阵
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-8 text-slate-300">
              这里集中展示数学建模、拓扑数据分析、智能体工程和个人工具链相关的公开项目。
            </p>
          </div>
          <a
            href="https://github.com/proffitteoy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-5 py-2 text-sm font-black text-cyan-100 transition-colors duration-300 hover:bg-cyan-300/20"
          >
            查看公开仓库
          </a>
        </div>
      </section>

      <article className="rounded-3xl bg-slate-950/90 border border-indigo-400/20 shadow-2xl overflow-hidden p-4 md:p-8">
        <style dangerouslySetInnerHTML={{ __html: `
          .github-readme { color: #e2e8f0; }
          .github-readme h1, .github-readme h2, .github-readme h3 { color: #f8fafc !important; margin-top: 2rem; margin-bottom: 1rem; letter-spacing: 0; }
          .github-readme h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; margin-top: 0; }
          .github-readme h2 { font-size: 1.8rem; border-bottom: 1px solid rgba(148, 163, 184, 0.25); padding-bottom: 0.75rem; }
          .github-readme h3 { font-size: 1.2rem; }
          .github-readme p { margin: 1rem 0; line-height: 1.8; }
          .github-readme ul, .github-readme ol { margin: 1rem 0 1.5rem 1.25rem; line-height: 1.8; }
          .github-readme li { padding-left: 0.25rem; }
          .github-readme blockquote { margin: 1.5rem 0; border-left: 4px solid rgba(125, 211, 252, 0.7); padding: 0.5rem 0 0.5rem 1rem; color: #cbd5e1; background: rgba(14, 165, 233, 0.08); border-radius: 0.75rem; }
          .github-readme a { color: #7dd3fc; text-decoration: none; }
          .github-readme a:hover { color: #bae6fd; }
          .github-readme table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 1.5rem 0; overflow: hidden; border-radius: 1rem; border: 1px solid rgba(148, 163, 184, 0.18); }
          .github-readme td, .github-readme th { border: 1px solid rgba(148, 163, 184, 0.14); padding: 1rem; vertical-align: top; }
          .github-readme th { color: #f8fafc; background: rgba(14, 165, 233, 0.1); }
          .github-readme code { color: #bae6fd; background: rgba(14, 165, 233, 0.12); border-radius: 0.35rem; padding: 0.1rem 0.35rem; }
          .github-readme pre { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(125, 211, 252, 0.18); border-radius: 1rem; padding: 1.25rem; overflow-x: auto; }
          .github-readme pre code { background: transparent; padding: 0; color: #c4b5fd; }
          @media (max-width: 768px) {
            .github-readme h2 { font-size: 1.35rem; }
            .github-readme table, .github-readme tbody, .github-readme tr, .github-readme td { display: block; width: 100%; }
            .github-readme thead { display: none; }
          }
        `}} />
        <div
          className="github-readme"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  );
}
