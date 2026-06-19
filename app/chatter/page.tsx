import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import QuartzFrame from '../../components/QuartzFrame';
import { siteConfig } from '@/siteConfig';

export const metadata = {
  title: "杂谈 | " + siteConfig.title,
  description: "保留 Quartz 原版渲染的 misc 笔记",
};

export default function ChatterPage() {
  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <QuartzFrame src="/blog/misc/" title="杂谈" />
      </PageTransition>
    </div>
  );
}
