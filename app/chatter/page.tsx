import fs from 'node:fs';
import path from 'node:path';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import QuartzFrame from '../../components/QuartzFrame';
import { siteConfig } from '@/siteConfig';

type ContentIndexEntry = {
  slug?: string;
  title?: string;
  filePath?: string;
};

const fallbackMiscArticle = {
  src: '/blog/misc/index.html',
  title: '杂谈',
};

function getFirstMiscArticle() {
  const contentIndexPath = path.join(
    process.cwd(),
    'public',
    'blog',
    'static',
    'contentIndex.json',
  );

  try {
    const contentIndex = JSON.parse(fs.readFileSync(contentIndexPath, 'utf8')) as Record<
      string,
      ContentIndexEntry
    >;
    const firstEntry = Object.values(contentIndex).find((entry) => {
      if (!entry.slug || !entry.filePath) return false;
      if (!entry.slug.startsWith('misc/') || !entry.filePath.startsWith('misc/')) return false;

      const filePathInMisc = entry.filePath.slice('misc/'.length);
      return filePathInMisc.endsWith('.md') && !filePathInMisc.includes('/');
    });

    if (!firstEntry?.slug) return fallbackMiscArticle;

    return {
      src: `/blog/${firstEntry.slug}`,
      title: firstEntry.title ?? fallbackMiscArticle.title,
    };
  } catch {
    return fallbackMiscArticle;
  }
}

export const metadata = {
  title: "杂谈 | " + siteConfig.title,
  description: "直接展示 Quartz misc 笔记中的第一篇文章",
};

export default function ChatterPage() {
  const miscArticle = getFirstMiscArticle();

  return (
    <div className="h-screen relative overflow-hidden">
      <Navbar />
      <PageTransition>
        <QuartzFrame src={miscArticle.src} title={`杂谈：${miscArticle.title}`} />
      </PageTransition>
    </div>
  );
}
