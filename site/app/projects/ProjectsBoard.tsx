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
    markdown = '# proffitteoy\n\n项目 README 暂未找到。';
  }

  markdown = markdown.replaceAll('./assets/', '/proffitteoy/assets/');

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
        <div className="p-5 md:p-8">
          <p className="text-[11px] font-black tracking-[0.35em] uppercase text-cyan-300 mb-4">
            GitHub Profile
          </p>
          <a
            href="https://github.com/proffitteoy/proffitteoy"
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-[480px] transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src="https://github-readme-stats.vercel.app/api/pin/?username=proffitteoy&repo=proffitteoy&theme=tokyonight&hide_border=true"
              alt="proffitteoy/proffitteoy pinned repository card"
              className="w-full rounded-2xl"
            />
          </a>
        </div>
      </section>

      <article className="rounded-3xl bg-slate-950/90 border border-indigo-400/20 shadow-2xl overflow-hidden p-4 md:p-8">
        <style dangerouslySetInnerHTML={{ __html: `
          .github-readme { color: #e2e8f0; }
          .github-readme h1, .github-readme h2, .github-readme h3 { color: #f8fafc !important; margin-top: 2rem; margin-bottom: 1rem; letter-spacing: 0; }
          .github-readme h2 { font-size: 1.8rem; border-bottom: 1px solid rgba(148, 163, 184, 0.25); padding-bottom: 0.75rem; }
          .github-readme h3 { font-size: 1.2rem; }
          .github-readme p { margin: 1rem 0; line-height: 1.8; }
          .github-readme a { color: #7dd3fc; text-decoration: none; }
          .github-readme a:hover { color: #bae6fd; }
          .github-readme img { display: inline-block; max-width: 100%; height: auto; margin: 0.35rem; vertical-align: middle; }
          .github-readme table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 1.5rem 0; overflow: hidden; border-radius: 1rem; border: 1px solid rgba(148, 163, 184, 0.18); }
          .github-readme td, .github-readme th { border: 1px solid rgba(148, 163, 184, 0.14); padding: 1rem; vertical-align: top; }
          .github-readme code { color: #bae6fd; background: rgba(14, 165, 233, 0.12); border-radius: 0.35rem; padding: 0.1rem 0.35rem; }
          .github-readme pre { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(125, 211, 252, 0.18); border-radius: 1rem; padding: 1.25rem; overflow-x: auto; }
          .github-readme pre code { background: transparent; padding: 0; color: #c4b5fd; }
          @media (max-width: 768px) {
            .github-readme h2 { font-size: 1.35rem; }
            .github-readme table, .github-readme tbody, .github-readme tr, .github-readme td { display: block; width: 100%; }
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
