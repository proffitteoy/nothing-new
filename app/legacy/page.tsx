import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import QuartzFrame from '../../components/QuartzFrame';
import { siteConfig } from '@/siteConfig';

export const metadata = {
  title: "博客 | " + siteConfig.title,
  description: "原版 Quartz 博客文章",
};

export default function LegacyBlogPage() {
  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <QuartzFrame src="/blog/" title="Quartz 博客" />
      </PageTransition>
    </div>
  );
}
