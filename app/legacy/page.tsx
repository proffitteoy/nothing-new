import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import QuartzFrame from '../../components/QuartzFrame';
import { siteConfig } from '@/siteConfig';

export const metadata = {
  title: "博客 | " + siteConfig.title,
  description: "原有博客文章",
};

export default function LegacyBlogPage() {
  return (
    <div className="h-screen relative overflow-hidden">
      <Navbar />
      <PageTransition>
        <QuartzFrame src="/blog/index.html" title="Quartz 博客" />
      </PageTransition>
    </div>
  );
}
