---
title: 提示词工程综述笔记
date: '2025-08-18 10:56:39'
categories:
  - 综述库
tags:
  - LLM
  - 提示词工程
updated: '2025-08-18 11:52:40'
permalink: /post/prompt-word-project-overview-notes-zpd2zm.html
comments: true
toc: true
---



# 提示词工程综述笔记

本文主要内容是参考一下综述完成：**郑明琪, 陈晓慧, 刘冰, 张兵, 张然.**  提示学习中思维链生成和增强方法综述[J]. 计算机科学, 2025, 52(1): 56-64.  
**Zhen Mingqi, Chen Xiaohui, Liu Bing, Zhang Bing, Zhang Ran.**  *A Survey on Chain-of-Thought Generation and Enhancement Methods in Prompt Learning*. *Computer Science*, vol. 52, no. 1, pp. 56–64, Jan. 2025.  
DOI/URL: [https://kns.cnki.net/kcms2/article/abstract?v=0xftKHkdwWTGZCjzekmswsk7uGT1OKfDNX7LjfC7uBWxrdcmgrN8o8IY-hAV9-YowRJZFmw_7mVQi6oevryAHrAJ5G_t9sKxOKNvjv67ARltFSZTnbqIYGtSXOJ18wD8uE5xMSr446r05IbDjiwUYE_l-GlNJpP6v2Vkwm-LXyf59weSkxwyqw **&amp;uniplatform=NZKPT&amp;language=CHS](https://kns.cnki.net/kcms2/article/abstract?v=0xftKHkdwWTGZCjzekmswsk7uGT1OKfDNX7LjfC7uBWxrdcmgrN8o8IY-hAV9-YowRJZFmw_7mVQi6oevryAHrAJ5G_t9sKxOKNvjv67ARltFSZTnbqIYGtSXOJ18wD8uE5xMSr446r05IbDjiwUYE_l-GlNJpP6v2Vkwm-LXyf59weSkxwyqw** &uniplatform=NZKPT&language=CHS)

提示词工程（Prompt Engineering）是一种通过设计和优化输入提示（Prompt）来引导大语言模型（Large Language Models, LLMs）完成特定任务的技术范式。它无需修改模型参数，仅通过调整输入文本的结构与内容，即可显著提升模型在推理、生成、分类等任务中的表现，具有成本低、部署快、适应性强等优势，已成为大模型时代人机交互的关键桥梁。

## 一、**核心范式：思维链（Chain-of-Thought, CoT）**

思维链是提示词工程中最具突破性的技术之一，旨在通过引导模型生成“中间推理步骤”来提升其复杂任务的解决能力，模拟人类“逐步思考”的过程。

- **少样本思维链（Few-shot CoT）** ：由 Wei 等人首次提出，在输入中提供若干包含“问题→推理过程→答案”的示例，使模型通过上下文学习模仿生成类似的推理链，显著提升数学、常识等推理任务的准确率。
- **零样本思维链（Zero-shot CoT）** ：Kojima 等人提出，仅通过一句如“让我们逐步思考”（Let’s think step by step）的提示语，即可激发模型自主生成推理过程，无需人工设计示例，极大提升了通用性与实用性。
- **黄金思维链（Golden CoT）** ：指在提示中直接提供正确的推理步骤，让模型“照着做”，用于分析模型推理能力的上限，揭示了模型在自主生成推理路径时仍存在较大改进空间。

在此基础上，研究者进一步发展出更复杂的推理结构：

- **思维树（Tree of Thoughts, ToT）** ：允许模型在推理过程中探索多条路径，进行“前瞻”与“回溯”，实现更全面的搜索与决策。
- **思维图（Graph of Thoughts, GoT）** ：构建图结构的推理网络，支持状态聚合、分支与反馈，更贴近人类灵活的思维模式。

## 二、**主要研究方向**

当前提示词工程的研究主要围绕**推理生成**与**推理增强**两大主线展开：

​**推理生成方法**​：

- ​**少样本思维链（Few-shot CoT）** ​：通过人工设计包含问题、推理过程与答案的示例，引导模型模仿生成推理链。其效果高度依赖示例质量与顺序。
- ​**零样本思维链（Zero-shot CoT）** ​：利用“让我们逐步思考”等通用指令，无需示例即可激发模型的分步推理能力，提升了通用性与部署效率。
- ​**自动提示生成**​：如 Auto-CoT、Active-Prompt 等方法，通过聚类、主动学习等策略自动选择或生成高质量提示样本，降低人工成本并提升适应性。

​**推理增强方法**​：

- ​**结果增强**​：如​**自我一致性**​（Self-Consistency），通过多次采样生成多条推理路径，采用投票机制选择最一致答案，提升稳定性。
- ​**逻辑增强**​：如​**多链推理**​（Multi-Chain Reasoning），生成多条独立推理链并进行综合分析，提升推理深度与相关性。
- ​**形式增强**​：如​**思维程序**​（Program of Thoughts, PoT）和​**程序辅助语言模型**​（PAL），将推理步骤转化为可执行代码，借助编程语言的精确性提升计算任务准确性。
- **结构增强**：发展出**思维树**（Tree of Thoughts, ToT）、**思维图**（Graph of Thoughts, GoT）等非线性推理结构，支持多路径探索、回溯与反馈，适用于更复杂的决策任务。

## 三、**存在的核心挑战与未来方向**

### 1. 核心挑战

尽管提示词工程取得了显著进展，但仍面临若干挑战：

- ​**模型规模依赖性**​：思维链等高级提示策略在小规模模型上效果有限，通常仅在百亿参数以上的大模型中表现显著。
- ​**上下文敏感性与偏差风险**​：提示中的微小变化（如示例顺序、措辞倾向）可能显著影响输出，甚至引导模型生成错误或有害内容，存在“提示攻击”风险。
- ​**幻觉与知识缺失**​：模型在知识盲区仍可能生成看似合理但错误的推理过程，提示本身无法完全消除“幻觉”问题。
- ​**可解释性与可控性不足**​：尽管思维链提升了透明度，但模型为何生成特定推理路径仍缺乏深层解释，难以实现精准干预。
- **成本与效率权衡**：如思维树、思维图等复杂方法虽性能优越，但需多次调用模型，推理成本高昂。

### 2. 未来方向

未来提示词工程的发展将聚焦以下几个方向：

- ​**提升可解释性与机制理解**​：深入探究提示如何激活模型内部知识与推理机制，建立“提示—行为”之间的因果解释模型。
- ​**多模态提示融合**​：将文本、图像、音频等多模态信息纳入提示设计，发展​**多模态思维链**​（Multimodal-CoT），实现更贴近人类感知的综合推理。
- ​**与外部知识系统结合**​：将提示工程与​**知识图谱**​、数据库等结构化知识源融合，通过“验证与编辑”（Verify-and-Edit）等框架，动态校正推理过程，弥补模型知识缺陷。
- ​**自动化与智能化提示生成**​：发展更智能的自动提示构建、优化与评估系统，实现提示的端到端学习与自适应调整。
- ​**轻量化与高效推理**​：探索适用于小模型的提示迁移学习方法（如 Fine-tune-CoT），推动提示技术在边缘设备与资源受限场景的应用。

‍
