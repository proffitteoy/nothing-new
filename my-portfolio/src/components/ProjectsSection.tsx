import React from "react";
import { projects } from "@/lib/data";
import { CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Github } from "lucide-react";
import { GlassCard } from "./ui/glass-card";
import MotionWrapper from "./MotionWrapper";
import { motion } from "framer-motion";

const showcasePlaceholders = Array.from({ length: 6 }, (_, index) => index + 1);

function ProjectShowcase({ title }: { title: string }) {
  const duplicatedPlaceholders = [...showcasePlaceholders, ...showcasePlaceholders];
  const trackStyle = {
    "--showcase-duration": "19s",
  } as React.CSSProperties;

  return (
    <div className="project-showcase" aria-label={`${title} 项目展示`}>
      <div className="project-showcase-header">
        <span className="project-showcase-title">项目展示</span>
        <span className="project-showcase-tip">悬停可暂停</span>
      </div>
      <div className="project-showcase-viewport" role="region" aria-label={`${title} 项目展示照片`}>
        <div className="project-showcase-track" style={trackStyle}>
          {duplicatedPlaceholders.map((placeholderIndex, itemIndex) => (
            <figure
              key={`${title}-placeholder-${placeholderIndex}-${itemIndex}`}
              className="project-showcase-item project-showcase-placeholder"
              aria-label={`${title} 展示图占位 ${placeholderIndex}`}
            >
              <span className="project-showcase-placeholder-number">
                {String(placeholderIndex).padStart(2, "0")}
              </span>
              <span className="project-showcase-placeholder-text">图片待补充</span>
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
                  <ProjectShowcase title={project.title} />
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
