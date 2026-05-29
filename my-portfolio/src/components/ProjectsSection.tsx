import React from "react";
import { projects } from "@/lib/data";
import { CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Github } from "lucide-react";
import { GlassCard } from "./ui/glass-card";
import MotionWrapper from "./MotionWrapper";
import { motion } from "framer-motion";

const showcaseImagePool = [
  "/图片/1.1.png",
  "/图片/1.2.png",
  "/图片/1.3.png",
  "/图片/1.4.png",
  "/图片/1.5.png",
  "/图片/1.6.png",
  "/图片/2.1.png",
  "/图片/3.1.png",
  "/图片/3.2.png",
  "/图片/3.3.png",
  "/图片/3.4.png",
  "/图片/3.5.png",
  "/图片/4.1.png",
  "/图片/4.2.png",
  "/图片/5.1.png",
  "/图片/6.1.png",
  "/图片/7.1.png",
];

const showcaseFallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23d946ef'/%3E%3Cstop offset='1' stop-color='%236366f1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='400' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial,sans-serif' font-size='28'%3EProject Preview%3C/text%3E%3C/svg%3E";

function getProjectShowcaseImages(projectIndex: number): string[] {
  const windowSize = 6;
  const offset = (projectIndex * 2) % showcaseImagePool.length;
  return Array.from({ length: windowSize }, (_, idx) => {
    return showcaseImagePool[(offset + idx) % showcaseImagePool.length];
  });
}

function ProjectShowcase({ title, images }: { title: string; images: string[] }) {
  const duplicatedImages = [...images, ...images];
  const trackStyle = {
    "--showcase-duration": `${Math.max(16, images.length * 3.2)}s`,
  } as React.CSSProperties;

  return (
    <div className="project-showcase" aria-label={`${title} 项目展示`}>
      <div className="project-showcase-header">
        <span className="project-showcase-title">项目展示</span>
        <span className="project-showcase-tip">悬停可暂停</span>
      </div>
      <div className="project-showcase-viewport" role="region" aria-label={`${title} 项目展示照片`}>
        <div className="project-showcase-track" style={trackStyle}>
          {duplicatedImages.map((imageSrc, imageIndex) => (
            <figure key={`${title}-${imageSrc}-${imageIndex}`} className="project-showcase-item">
              <img
                src={imageSrc}
                alt={`${title} 展示图 ${((imageIndex % images.length) + 1).toString()}`}
                loading="lazy"
                decoding="async"
                className="project-showcase-image"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = showcaseFallbackImage;
                }}
              />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  return (
    <section id="projects" className="py-12 relative">
      <div className="container max-w-4xl mx-auto px-6 md:px-4">
        <MotionWrapper>
          <h2 className="text-2xl font-bold mb-8 text-center md:text-left">
            🚀 项目经历
          </h2>
        </MotionWrapper>

        <div className="grid grid-cols-1 gap-6">
          {projects.map((project, index) => (
            <MotionWrapper key={project.title} delay={index * 0.2}>
              <GlassCard className="group overflow-hidden dark:border-purple-500/10 h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                  <CardTitle className="text-center md:text-left group-hover:text-purple-500 transition-colors duration-300">
                    {project.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">时间：{project.period}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="list-disc ml-4 space-y-2 text-sm">
                    {project.description.map((desc, i) => (
                      <motion.li
                        key={i}
                        className="text-muted-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        {desc}
                      </motion.li>
                    ))}
                  </ul>
                  <ProjectShowcase title={project.title} images={getProjectShowcaseImages(index)} />
                </CardContent>
                <CardFooter className="flex justify-center md:justify-start items-center border-t border-border/30 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                  <motion.a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-purple-500 transition-colors group/link pt-8"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Github className="h-4 w-4 mr-2 group-hover/link:rotate-12 transition-transform duration-300" />
                    查看 GitHub：proffitteoy
                  </motion.a>
                </CardFooter>
              </GlassCard>
            </MotionWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
