---
title: Latex在线编辑工具Overleaf使用手册
date: '2025-04-08 13:37:39'
categories:
  - 知识管理
tags:
  - Latex
  - Overleaf
  - 论文写作工具
updated: '2025-04-09 23:38:16'
permalink: /post/latex-online-editing-tool-overleaf-user-manual-dqnk.html
comments: true
toc: true
---



# Latex在线编辑工具Overleaf使用手册

## 背景

 由于美赛的原因，我接触了LaTeX。当时的我抱着**速成**LaTeX且要学到东西的念头，打开各类学习平台，但总被各种奇奇怪怪却毫不实用的教程劝退。

1. 分享好用的编辑器Overleaf。
2. 分享LaTeX的基本语法。
3. 分享好用的网站减少不必要的学习量和工作量，同时保质达到效果。
4. 帮助你实现LaTeX入门，写出PDF成品。

 本帖主要借鉴梳理了**OverLeaf的官方入门贴+技术帖**。全文会以英文论文为例进行讲解，中文论文格式类似。

## **一、LaTeX和Overleaf的简单介绍**

### **1.为什么要用LaTeX**

 你可以将LaTeX理解为一种语言工具，帮助你敲击键盘就完成论文的**撰写**与**排版**，通过输入文本得到内容，输入命令控制格式，无需鼠标移来移去改字号、调格式。

 事实上，如果单纯关注文本，LaTeX没有什么好学的。你完全可以像在记事本中写东西一样，把文字简单地敲在编辑器里，它们也能够在屏幕里被看见。但是，写论文需要讲求**格式**，做到段首空两格或是各级标题加粗放大；也需要讲求**美观**，做到边距统一、让特定字符倾斜或是变成脚标......

 这些特定要求需要额外的操作来完成。在传统的Word或WPS等文本编辑器里，这些功能由页面上方长长的一栏实现，但在LaTeX里，我们通过加入各式各样的命令来完成，既优雅又简洁，这就是为什么我们选择LaTeX的原因。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/8a3e80a0ec89446b8d9e92951027c1f7-20250408133739-ecf3zqk.png)

 （WPS中的功能栏 是不是唤起了你被支配的感觉）

 通过敲代码、写命令，论文内容会按照指定格式排布，实现排版效果。它与Word等传统文本编辑器最大的不同点在于：

1. **强大的数学公式排版能力。**
2. **强大的标准化复刻能力。**

**数学公式方面**，最简单的例子是：Word中分数的排版格式总是以1/2的形式出现，但LaTeX可以轻松呈现出![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/e9a3b56e09e971fe7ff5251a63281e1c-20250408133739-pznnh9p.png)的形式。你完全可以认为​**没有LaTeX无法排版的数学公式**​。

 ​**标准化复刻方面**​，由于LaTeX通过代码控制内容排版，通过复制粘贴代码可以快速而准确地实现内容的复现，避免了Word复制文本潜在的格式混乱问题，比如错行、行间距不统一、稀奇古怪的缩进......

 我们需要着重学习的则是这门语言的**语法**和​**命令**​。

---

### 2.适用人群

 想要**快速**拥有一定的LaTeX**论文**排版技能且能够**联网**的朋友。

---

### 3.认识Overleaf

 Overleaf是一个联网使用的LaTeX**在线**排版网站（[Overleaf](https://www.overleaf.com/learn "Overleaf")），区别于其余的离线（单机）LaTeX编辑器，Overleaf无需安装、支持多人协作、辅助功能便捷，能为用户提供非常不错的使用体验，本文主要通过该网站实现。

 （友情提示，Overleaf网站有时候会抽风，所以有条件的同学挂个梯子体验会更好！）

 经过注册等流程后，我们可以看到主页：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/288a2d9cda610f1b6821b052ca023744-20250408133739-hssterf.png)

 点击绿色的“**New Project**”按钮创建项目，通过选择“​**Blank Project**​”并**自定义Project标题**即可看到如下初始页面：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/7a6bff926db39c1961f499f36ac422dc-20250408133739-m97w6nv.png)

 我用矩形框将页面分为三个部分。**红色框**我将其命名为操作栏；**黄色框**我将其命名为代码栏，**蓝色框**我将其命名为编译栏（接下来我都会这么称呼这三部分，今后不再赘述）。

 **操作栏：** 用于​**创建和管理文件夹及菜单**​。

 **代码栏：** 用于​**编辑代码**​。可以看到在创建项目以后，系统已经自动生成了一段代码。

 **编译栏：** 用于​**查看排版效果**​。在编译栏会出现预期内容的PDF文档页面。

 ***重要：***

 由于编辑内容与呈现效果​**并非同步**​，每当你需要查看代码带来的效果，必须点击“Recompile”进行**编译**查看最新的PDF效果。

 ***注意***：

1. 在使用部分命令排版内容、进行交叉引用时，需要对.tex源文件**编译两次**及以上，因此如果你发现你点击Compile后没有反应，试着再点击一次！
2. 点击“Recompile”处的倒三角，可以选中“​**Auto Compile**​”的“On”模式，开启自动编译，但我并不习惯也**不推荐**这样做，请尽可能保持默认。

---

### 4.从Overleaf中导出项目与文件

 无论论文质量与内容如何，我们都应该了解如何在Overleaf中导出**项目**和实实在在的的**PDF文件**。

 在操作栏我们可以点击**Menu**选项，可以看到，“**Download**”处有两个选项：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/e0aeea0a44f1465387ce3fc76d2a330b-20250408133739-uo790ja.png)

 点击“​**Source**​”选项可以下载整个项目，格式为zip文件；点击“**PDF**”选项可以下载PDF文档。根据需求，自行下载即可。

## 二、论文基础

### 1.普通论文

#### ①论文的格式和内容

 常见的论文**格式**包括但不限于：“摘要 - 背景 - 正文 - 结语 - 参考文献”这样的基础格式。

 当然，根据需要，你可以加入其他内容，比如“假设”、“稳定性分析”、“模型改进”等。但可以明确的是，我们总将论文写作分 **“部（分）”** 完成。

 常见的论文**内容**无外乎**序言**和**正文**两部分。

 论文序言应该申明论文的​**基本信息**​，包括作者、工作单位、完成时间等；论文正文应该有**目录，** 每一页应该有​**页码标注**​，甚者有**页眉**要求。

#### ②段落格式

 英文论文有​**两种常见的段落格式**​，你可以根据需要进行选择：

 1.每个段落开头有缩进，段落之间无空行。

 2.每个段落开头不缩进，段落之间有空行。（雅思要求，本文也将使用此种格式）

---

### 2.LaTeX论文

 LaTeX中完成论文同样分为**序言、正文**两个部分。

 **序言部分：** 主要负责​**申明论文文体**​、​**导入宏包**​（部分功能的实现需要导入其他的插件协助完成，将这些套件称为“宏包”）、​**表明文章的标题**​、**作者**及**时间**等信息。

 **正文部分：** 主要负责论文的**主体**内容书写。

## **三、序言内容**

### 1.分区

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/46f3c876baa3a53bed08b7d355848fbd-20250408133739-ibf47u8.png)

 序言部分即代码段​  **\begin{document}**  **前**​（红色框）的内容。系统已经生成了默认代码，我们可以对其进行微调。

---

### 2.申明文档类型

 通常情况下，我们将以下代码置于​**首行**​，申明文档​**类型、文章的基础字号、纸张类型**​。

```less
\documentclass[字号,纸张类型]{文本类型}
```

* **文本类型：** 可选参数有article、book、report等，我们选择article。
* **字号：** 可选参数有9pt、10pt、11pt、12pt，默认为10pt。
* **纸张类型：** 可选参数有letter paper、a4paper、legal paper等。通常缺省选择默认值。

---

### 3.导入宏包

 **宏包**是 **Latex** 发行版的插件功能，通过安装**宏包**可以扩展或提供更多的功能。多数情况下，我们简称宏包为“​**包**​”。我们需要通过以下代码导入宏包。

```less
\usepackage[可选选项]{包名}
```

 由于包的数量庞大，该导入哪些包反而不需要我们格外操心。当你需要完成某项功能时（如导入图片），直接在搜索引擎上搜索相关宏包的代码即可。

 在此附上一些​**基础宏包**​：

```erlang
%文档的编码选择utf8。
\usepackage[utf8]{inputenc}

%使用graphicx包添加图片
\usepackage{graphicx}

%设置字体为Times New Roman（英文论文的经典字体）
\usepackage{times}
\usepackage{mathptmx}

%数学包
\usepackage{amsmath}
```

 感兴趣的小伙伴可以根据需要，查阅学习站里一位大佬总结的宏包引用及常用宏包简介：[宏包链接](https://blog.csdn.net/qq_37556330/article/details/106190148 "宏包链接")

---

### 4.信息申明

 通过以下三行代码，我们可以实现对论文**标题、作者、日期**的申明。

```bash
\title{标题名称}
\author{作者}
\date{日期}
```

* **标题名称：** 任意内容。（有其他编程语言经验的同学无需担心使用所谓“字符串”格式。直接输入即可，LaTeX十分友好，下同）
* **作者：** 任意内容。
* **日期：** 可以用“月份英文 年份”的格式表示，如：March 2022；也可以在{ }中输入 **\today**表明日期为今天（​**暂时无需理解命令的含义**​），如果有其他需要直接上搜索引擎查就行。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/4a5b03558e365e238dbe2f84526bed5c-20250408133739-8occ5y0.png)

 （可以看到"\\today"生效，自动输出当前日期）

## 四、正文内容

 本文采用“零件组装”的思想对LaTeX的编辑方法进行讲解，具体来说就是，你需要完成什么功能就去学习相应的实现方法，像拼零件一样完成自己的论文。

### 1.分区

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/46f3c876baa3a53bed08b7d355848fbd-20250408133739-ibf47u8.png)

 正文部分即代码段​  **\begin{document}到** ​ **\end{document}**  （蓝色框）的内容，默认代码已经给出架构，我们可以直接进行编辑。

 我们可以看到正文部分的以下代码：

```undefined
\maketitle
```

 这段代码使我们在**序言部分**设置的标题、作者、日期​**得以显示**​，具有重要的作用。

---

### **2.LaTeX中的“ \”**

 LaTeX可以认为由**普通文本**和**命令**组成，其中 **\** 是LaTeX命令的核心。LaTeX中，几乎所有命令都需要依赖于“ \\”符。其格式为：

```undefined
\命令名称{}
```

 大到导包操作\\usepackage，小到添加空格\\quad，都需要使用到这个符号。但具体到每个命令，我们也无需格外留意，根据需要拷贝命令即可。

 唯一需要注意的是不要搞错**斜线的方向**。

---

### **3.环境**

 LaTeX中有一个重要的概念“​**环境**​”，即使用 **\begin{ }** 和 **\end{ }** 两个命令包裹代码块，使**文本内容具有特殊格式**或​**对内容进行标识**​。其格式如下：

```erlang
\begin{类型}
......
\end{类型}
```

 类型则根据个人需求决定，通常可分为三类：

* **标识文本属类：** 如正文部分的类型为document；摘要部分的类型为abstract。
* **标识特殊内容：** 如图片类型为figure；列表类型为itemize；表格类型为table、tabular；公式类型为equation。
* **标识特殊格式：** 如居中格式为center；左对齐为flushleft；右对齐为flushrightt。

---

### **4.内容与注释**

 其实如果不讲究所谓格式与排版，我们可以在**document环境**中编辑任意内容，与正常的Word输入没有两样。凡是在document环境中的内容，都是论文的正文。

 值得一提的是，我们通常会将不愿意呈现在最终文档里，但起到提示作用的内容进行**注释**，只需在文本前加上 **%** 即可，格式为：

```html
% 任意内容
```

 以一段简单的文本输入为例。可以看到：没有加“%”进行注释的内容经过编译后得以呈现，但注释行则无法显示。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/c28462b67cdf7d36299de436a14e28a3-20250408133739-na3899w.png)

---

### 5.空格、换行、强制换页

 空格、换行、强制换页是文本操作中三个重要的操作。

#### ①空格

 对于空格，在LaTeX中无论多少个空格（space键）都会被认为是​**一个空格**​。因而当我们需要行内键入一段空白时，需要通过其他命令实现。

 不同命令对应的空格|\\qquad|更更大空格|  
| -----------------------| ------------|  
|\\quad|更大空格|  
|\\+space键|大空格|  
|\\;|中空格|  
|\\,|小空格|

 感兴趣的可以参考另一位大佬给出的总结：[Latex中的空格](https://blog.csdn.net/seaskying/article/details/51316607 "Latex中的空格")。

#### ②换行

 对于换行，在LaTeX中​**单个“Enter”键并没有真正的换行效果**​。我们在编辑区键入“Enter”，在编辑栏可以看到文本内容被分割，但实际上并没有空格效果。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/a305708ff6c52c80576a80b2fef81c69-20250408133739-55z6pa1.png)

 （第13行与第14行在编辑栏用“Enter”进行分割，但编译栏并没有换行）

 LaTeX中，正常的段间换行需要键入​**两个“Enter”键**​。也就是在编辑区的内容与内容之间加入空行。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/bd8c97145a958f8d83e53da902e202c4-20250408133739-5zc7te6.png)

 除此以外，常见的换行方法有以下三种：

1.  **\** 命令
2.  **\newline**命令
3.  **\par**命令

 我个人比较推荐 **\\命令**，简单且功能强大：

```less
\\[字体大小]
```

* **字体大小：** 可以输入不同的参数，实现不同宽度的空行，宽度与对应字体同高。如果不填，即为默认值，与两个“Enter”键效果相同。

 此外，我们可以在序言部分输入这行代码，使得段落间会自动产生与文档字体**同高**的空行。其中，**1em**（element）即字体的单倍高度。

```cobol
\setlength{\parskip}{1em}
```

 举个栗子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/4120cbf9d1fd48c8d610c851ef2b7840-20250408133739-3webdq8.png)

 因此，如果你习惯第二种论文段落格式，建议帮 **\setlength{\parskip}{1em}** 在序言部分买房。

 最后要强调的是：采用**任意环境**后，环境的上下两侧自动换行，无需格外操心。

#### ③强制换页

 对于摘要页等特殊内容页面，我们通常令其独立成页。这就需要用到 **\newpage**命令：

```undefined
\newpage
```

 在任意内容后使用该命令，即可使得接下来的内容呈现在PDF的​**下一页**​，当前内容独立成页。

---

### 6.缩进与行高

#### ①缩进

 论文中的两种段落格式都与缩进有着紧密的关系。

 LaTeX很有趣，它会默认部分命令后的文本**需要缩进**或**无需缩进**。比如在以后要提到的\\section命令，LaTeX默认其后的首段强制不缩进，后续段落缩进两格。因此，缩进的相关命令非常重要。

 缩进的相关命令分为全局命令与局部命令，且局部命令优先级高于全局命令。

* **全局命令：** 设置后，全局文字都将采用该缩进方式，用在序言部分。
* **局部命令：** 设置后，该段文字将采用该缩进方式，用在正文部分（不）需要缩进的段首。

```erlang
%全局命令：
\setlength{\parindent}{0em}           %段首不缩进
\setlength{\parindent}{2em}           %段首缩进两字符

%局部命令：
\noindent                             %取消缩进
\indent\setlength{\parindent}{2em}    %缩进两字符
```

 举个栗子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/3ee3c802b3966a9673b7dccb0a1f799c-20250408133739-ns4asqe.png)

 可以看到，我们实现了**全局缩进两字符，但第三段取消缩进**的效果。

 灵活使用缩进相关命令，可以帮助我们适应各种格式需求。

 最后要提的一点是：面对\\section命令带来的首段不缩进问题，可导入以下宏包解决：

```undefined
\usepackage{indentfirst}
```

#### ②行高

 对于段落，我们还有一个重要的参数没有涉及，那就是行高。

 通常情况下，我们无需另外设置行高，只需使用**默认值**即可。但面对特殊需求，我们可以在序言部分加入以下命令修改行高：

```undefined
\renewcommand{\baselinestretch}{行距倍数}
```

* **行距倍数：** 直接输入数字即可，如1.5即为1.5倍行距，和Word中的行距概念完全相同。

---

### 7.字体格式

 我认为字体有五要素：​**字体、字号、加粗、倾斜、下划线**​。我们逐一进行讲解：

* **字体：** 实际使用中我们更多是根据需求导入相关的字体包，以最为经典的Times New Roman字体为例，我们直接在序言区拷贝相关字体的LaTeX代码即可。

```cobol
%设置字体为Times New Roman
\usepackage{times}

%主体中正文和数学公式都将以 Times 字体排版，其他仍以默认字体排版
\usepackage{mathptmx}
```

* **字号：** 当我们在  **\docunment**{article} 选定基础字号后，就无需再关注全文的字体大小。（后续在章节部分也会讲到）
* **加粗：** LaTeX中的粗体文本使用  **\textbf**{...} 命令编写。
* **斜体：** LaTeX 中的斜体文本使用  **\textit**{...} 命令编写。
* **下划线：** LaTeX 中的下划线文本使用  **\underline**{...}命令编写。

```erlang
%粗体
\textbf{...} 

%斜体
\textit{...} 

%下划线
\underline{...}
```

 这里举一个最为简单的例子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/9e9131dd94aa1e05cbd5738bb7c93f34-20250408133739-d9flmx9.png)

 可以看到，通过不同的命令，我们实现了文本的简单格式控制。

 此外，还有众多的文本格式控制命令，包括但不限于： **\emph**{...}命令（根据上下文环境对文本格式化）等。感兴趣的小伙伴可以导入​**ulem宏包**​，了解相关的其他操作。

---

### 8.对齐方式

 无论是文本还是图片，都要面对“对齐”的审判。

 我们常见的对齐方式有两种，一种是​**添加环境**​，一种是段前添加**对齐命令**。

 添加环境的对齐方式更适合​**文本**​，其相关命令如下：

```erlang
\begin{对齐方式}
......
\end{对齐方式}
```

* **对齐方式：** 包括center、flushleft、flushleft三种。

 举个栗子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/cae0380d76aac4830a9460098da88a09-20250408133739-5iryf3w.png)

 添加命令的对齐方式更适合图片、表格等，其相关命令如下：

```scss
\raggedright  环境flushleft的替代方法
\raggedleft   环境flushright的替代方法
\centering    环境center的替代方法
```

 举个栗子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/eacc9543dde6c5742b6905482d7b08ad-20250408133739-ouj8ak3.png)

 无论哪种对齐方式，习惯和达到效果才是关键。

---

### 9.我写到哪里了？

 论文写作过程中，我们需要清楚地告诉编辑器现在写的内容属于论文的哪一部分。是摘要？还是第一章“背景”？还是 第三章“模型建立”……

* 这时候就需要我们编写相关**环境**代码。

 此外，章节经常会存在​**层次关系**​。比如，“第三章第一节”中，相比“第一节”，第三章应该是更高一级的概念，字号应该更大，且能够包含很多小节的内容。

* 这时候就需要我们编写相关**层级**代码。

#### ①正文

 通过建立document环境可以告诉编辑器，现在是**正文部分：**

```erlang
\begin{document}
......
\end{document}
```

#### 

#### ②摘要

 通过建立abstract环境可以告诉编辑器，现在是**摘要部分：**

```crystal
\begin{abstract}
......
\end{abstract}
```

#### 

#### ③章节

 LaTeX通常将论文分为三个层级，通常是**部分、子部分、子子部分**。对应的命令为：  **\section**{}、 **\subsection**{}、 **\subsubsection**{}，括号内为该部分的名称。

 LaTeX会自动根据层级关系为你适配内容的​**对应字号大小**​，父章节会比子章节字号大一些。总之，当我们通过命令申明内容对应的论文部分后，层级关系就会一目了然。

```erlang
%部分
\section{章节名称} 

%子部分
\subsection{子章节名称} 

%子子部分
\subsubsection{子子章节名称}
```

 对于子部分的嵌套，只需要在两个父级部分之间添加即可，系统会将子部分归于**上一个父级**。

 这里有一个简单的示例：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/90e4a366fb78f2a19cecaadf84e9bf52-20250408133739-qa0lhlk.png)

 可以看到，通过三种章节命令，可以基础地对论文进行​**层次排版**​。

#### ④其他

 在LaTeX中也有很多其他的申明内容对应的论文部分的命令，包括但不限于申明：​**附录**​（Appendix）、**参考文献**（References）等，感兴趣的小伙伴可以学习了解。

---

### 10.图片

 图片是论文中不可或缺的一部分。

 首先，我们需要在操作栏创建新的​**文件夹**​（New Folder），并对其进行命名，以images为例。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/c56234a1236d6d7145961bbde6d8d7d9-20250408133739-rbtocum.jpeg)

 可以看到我们已经创建了images文件夹。点击文件夹右端的图标，选择“**Upload**”上传图片即可。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/fb8d923c37e1043b353d5950c71df734-20250408133739-i5zvvwh.png)

 通过拖拽或选择将目标图片进行上传，成功后可以看到images文件夹中已经有了我们的图片：（我选择的是名为scenery的jpg格式的图片）

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/0a7b6153962095c413981dde22ab0b50-20250408133739-v8j6tx1.png)

 通过导入**graphicx宏包**可以完成添加图片功能，通过设置图片路径可以使得系统定位到图片所在的位置。如果是images文件夹，则图片位置为​ **\graphicspath**​{  **{images/}**  }，其余同理。

```erlang
%导入与图片相关的宏包
\usepackage{graphicx}

%设置图片路径
\graphicspath{图片位置}
```

 通过  **\includegraphics{}** 命令，我们可以插入图片。以scenery.jpg为例。

```less
\includegraphics[可选参数]{图片名称}
```

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/1b866e93eb5b4c995cc0ee36b1163347-20250408133739-0tyibrg.jpeg)

 可以看到，通过上述代码，我们确实成功插入了图片。但由于我们没有设置这个图片的大小、对齐方式等参数，这张图片并没有以理想的状态呈现出来，甚至出现了溢出（Overfull）。

 接下来我们对图片的**宽高**进行调整，通过在可选参数列表中指定参数即可调整图片的宽、高。

```less
\includegraphics[宽度,高度]{图片名称}
```

 一般有两种方法：

* ​**指定长度：** ​[width\=4cm,height\=5cm]
* **指定比例：**​[width=0.8\textwidth,height=0.5\textwidth](这里的“\\”是“作比”的意思，不要误解)

 通过指定长度，可以直接确定图片的​**精确长宽**​；而指定比例，则是根据页面整体的宽高确定图片在页面中的​**宽高占比**​。我比较推荐第二种。

 可以看到，我们已经成功调整了图片的大小。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/311b684a7a5b0cb8a69d99d421bfee53-20250408133739-13pcyfb.png)

 接下来我们对图片的**对齐方式**进行调整，与文本的对齐方式调整完全相同。我们对图片添加对齐方式环境即可,以居中（center）效果为例：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/1ce138627ca1637d5e8378a43dcb39b3-20250408133739-8q836f5.png)

 这样我们就基本完成了对图片参数的修改。

 事实上，在LaTeX中，我们有专门的**figure环境**来控制图片，格式如下：

```css
\begin{figure}
    \对齐方式
    \includegraphics[宽度，高度]{图片名称}
    \caption{图片标题}
    \label{fig:标签名称}
\end{figure}
```

* **对齐方式：** 包括 **\raggedright**、 **\raggedleft**、  **\centering**。
* **图片标题：** 通过figure环境添加的图片，可以通过添加**caption**附上图片标题。
* **图片标签：** 通过figure环境添加的图片，可以通过添加​**label**​，方便后续内容对该图片的引用。后续可以通过 **\ref**命令进行引用，可以自动获得图片索引。

 举个栗子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/8bb94fdd164a3cbec93f1908e8fdfa48-20250408133739-gpw5512.jpeg)

 可以看到我们成功添加图片、为其添加了标题，并成功在文本中引用该图片。

---

### 11.列表

 列表分为两类：**有序列表**和**无序列表**。有序列表在每个条目前会有递增的数字对内容进行排序，无序列表则在每个条目前用黑色圆点进行标识。

 **有序列表：**

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/babe209817838ea9cc2411c51f79ec8e-20250408133739-j5m048r.png)

 内容前会有1、2、3进行标识。

 **无序列表：**

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/05e1df7d88fca720230468f3ce1d92b0-20250408133739-wo1l86y.png)

 内容前会有黑色圆点进行标识。

 对于有序列表，我们使用**enumerate**环境；对于无序列表，我们需要使用**itemize**环境。但无论哪种类型，每个条目前面必须有控件序列 **\item**，作为条目标识符。

```crystal
\begin{enumerate}
  \item A
  \item B
  \item C
\end{enumerate}

\begin{itemize}
  \item A
  \item B
  \item C
\end{itemize}
```

 举个栗子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/e8ebe449e4d9d44ecdd73047805094f4-20250408133739-3g5edsk.png)

 可以看到通过使用不同的环境，我们成功创建了两类列表。

---

### 12.表格

 由于表格的**复杂**性，表格应该大讲特讲。在LaTeX中创建表格并不如Excel一样边编辑边可视，主要用到了**table环境**和**tabular**环境。

 举个简单的栗子：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/b2324f1e5e67e39bad8c96f9a5a88c24-20250408133739-4mj8d6a.png)

 创建上面这样的一个格式清晰，内容简单，长度友好的表格，便需要这么长的一段代码：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/d46b12d63c72ffa8451d9d03492a5d61-20250408133739-8nzck2t.png)

 这工作量着实让人头痛。如果创建表格全程都是**手动敲入**代码，很是麻烦。 如果可以在**Excel**中导出表格，直接把它用到LaTeX中就好了。

 [tableconvert](https://tableconvert.com/csv-to-latex "tableconvert")网站就可以满足你的诉求！它可以实现csv文件到LaTeX代码的转换！

 我们需要做的就是以下三步：

1. 创建表格对应的​**csv文件**​。
2. 将csv文件复制到**表格转换**网站中生成表格对应的LaTeX代码。
3. **复制代码**到Overleaf中。

 首先是创建csv文件。对csv文件不熟悉的小伙伴可以把csv当成一种二维表格式，通常我们用Excel或者记事本就可以创建。

 打开Excel，在Excel上输入你的目标表格：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/4a2173893d4c47cd9e3eba71de82d147-20250408133739-bbk933k.png)

 点击左上方的保存文件。在文件处千万要选择：​**csv文件**​，文件名无所谓。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/ed95bbd3fd29bb874953694bdd11bbef-20250408133739-2nf4qwt.png)

 打开tableconvert，找到你的文件并将其**拖拽（上传）** 到对应的区域：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/0ff798bde7ebe1e983f056e520a95dcc-20250408133739-47lvlq4.png)

 滚动鼠标滑轮，找到网站转译出的LaTeX代码进行复制。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/57a26ee99233f77b0603bf21eef95aa0-20250408133739-kg9q058.png)

 将其粘贴到你的Overlef编辑区中进行**编译**后，你会发现一个一模一样的美丽表格：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/453dbd071d8973dae926b3fdbe827bbf-20250408133739-e6lj7d9.png)

 这时候你会发现你的表格的大小可能并没有那么理想,我们便需要通过 **\resizebox**命令对表格**大小**进行调整，格式如下：

```crystal
\resizebox{宽度}{高度}{
    \begin{tabular}{}
        ......
    \end{tabular}
}
```

 **宽度**和**高度**的参数设置与图片的参数设置相同，如图：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/7e850eb69473f6ab7fb9bbbf44f77c84-20250408133739-wato4zn.png)

 此外，表格也有**表格标题**和​**表格标签**​：

```css
\caption{表格标题}
\label{table:表格标签}
```

 根据需要，你也可以将其加入table环境中，方便个人使用。

 ***注意：***

 对于图片和表格，系统会**自动**寻找合适的位置进行​**放置**​。因而经常会出现图片（表格）“到处乱蹿”的问题，一般通过修改其宽高参数即可矫正。

 如果对图片等的位置有较严格的位置要求可以进一步深入学习。

 最后的最后，也许有朋友会纳闷，折腾半天，**为什么不能我自己做好Excel表截个图**呢？我这边来一个不太正经的回答：

 因为并不能保证图片状态下的表格与LaTeX代码呈现的文本是格式相符的，而且很有可能图会糊。

---

### 13.生成目录

 摘要和目录是我们粗略了解一篇论文的关键。

 如何为一篇论文​**添加目录**​，在LaTeX中是一件重要但容易的事。你只需要使用 **\tableofcontents**这行命令即可。

```erlang
%添加目录
\tableofcontents
```

 LaTeX会**根据**你使用的 **\section、\subsection、\subsubsection**帮助你自动生成目录：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/b54f22ac0e070bc505e794ae2bc35560-20250408133739-fqccikg.png)

 这是一篇我曾经写过的论文模板，系统已经帮我生成了目录。

## 五、数学公式

### 1.与数学相关的宏包

 虽然但是，每次写论文在序言部分不分青红皂白地导入​**数学包**​，可以帮助你省很多事：

```erlang
%数学包
\usepackage{amsmath}
```

 问就是很香！

---

### 2.公式模式

 终于到了我们的重中之重——数学公式的模式。

 请直接忽略本部分涉及到的公式的具体内容（上标、下标等）。

 数学公式根据排版类型可以分为：**内联模式**和**显示模式**两种。内联模式将数学公式与普通文本排版于​**同行**​；而显示模式则将数学公式​**单独成行**​，加以强调。

 此处借用***Learn LaTeX in 30 minutes***中的示例进行表示：

 ​**内联模式**​：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/d01a45d3282d6f46894f57269ea36b70-20250408133739-r6eole6.png)

 对于​**内联模式**​，我们有许多方法可以表示，我推荐使用一对美元符号（ **$**   **...**   **$**  ）包裹目标公式：

 以上述内容为例，对应的LaTeX代码如下：

```cobol
In physics, the mass-energy equivalence is stated 
by the equation $E=mc^2$, discovered in 1905 by Albert Einstein.
```

 ​**显示模式**​（分为两类）：

* 无编号公式（下述的E\=mc²）
* 有编号公式（下述的E\=m）

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/8d9a6b5017e6daed4ae01fda03543876-20250408133739-d1tbu43.png)

 对于**无编号的显示模式**，我推荐使用 **“**   **\[ ”**  和 **“**   **]**   **”** 包裹目标公式：

 以上述内容为例，对应的LaTeX代码如下：

```cobol
The mass-energy equivalence is described by the famous equation
\[ E=mc^2 \] discovered in 1905 by Albert Einstein. 
```

 对于**有编号的显示模式**，我推荐使用**equation环境**包裹目标公式，系统会自动帮你编号：

```erlang
\begin{equation}
......
\end{equation}
```

 以上述内容为例，对应的LaTeX代码如下：

```crystal
In natural units ($c = 1$), the formula expresses the identity
\begin{equation}
E=m
\end{equation}
```

 一般情况下，我们都会选择**有编号的显示模式**表示数学公式，也方便我们进行引用。

---

### 3.学着“写”公式

 我们已经提到，你需要表达的所有数学公式，LaTeX都可以生成。编写和生成公式是最为关键的一环，但也正因为它关键，使得速成LaTeX变得困难。

 所以我推荐一个好用的网站：[latexlive.com](https://www.latexlive.com/ "latexlive.com")。

 【补】根据我后续的使用经验，这个网站会有每日转换限制次数，可以考虑多用几个手机号注册来回薅转换次数，没太大必要充值会员；也可以尝试别的转换网站，原理和效果应该是类似的，在搜索引擎里直接搜“LaTeX识别公式”找免费的网站用即可

 它并**不需要**你有任何使用LaTeX对数学公式进行排版的基础，你只需要把期望得到的公式​**图片**​（手写也可）粘贴到指定区域，系统会快速识别内容并帮你生成LaTeX代码。

 ​**首先**​，打开网站，点击右上角完成​**注册**​。（没有注册的用户无法进行图片识别功能。我PS掉了自己的信息）

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/8236a5ced270fdcf9f75faba7bad61a3-20250408133739-x7vqnia.png)

 点击上图中的“​**图片识别**​”，任意选择自己的目标数学公式的图片：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/bf6037b7212d02519756071c642ab76c-20250408133739-1nmv5so.png)

 将其上传以后，系统会快速生成**对应LaTeX代码**，将其复制即可。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/9e78572c88c30c1be0d00de276ce2c89-20250408133739-qjpmjb8.png)

 如果对其正确性存疑，可以返回“​**快捷工具**​”页面，系统会将刚刚生成的代码自动粘贴到输入区域，并在输出区域给出代码对应的编译结果，借此我们可以对结果进行检查：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/a5504d8e737921e95532f7c27ff09901-20250408133739-xmxs7zn.png)

 这样，我们就可以“零基础”直接拿到公式对应的代码了。

 对于想要**从头学习（拒绝偷懒）** 数学公式书写的小伙伴，建议跳转这里：![](undefined "Mathematical_expressions")

 对该页及最后的“进一步阅读”的其他内容 进行认真且深入的学习！

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/950bfba846f1dcffd7fafd93a304d499-20250408133739-flpl3b5.png)

## 六、页面的小装饰

### 1.页眉和页码

 顾名思义，**页眉**就是页面上端的内容；**页码**就是用来标注“这是哪一页”的数字。页眉和页码设置同样分为**全局命令**和**局部命令**。

 对于全局命令，通常使用 **\pagestyle{}** 对页眉和页码共同设置：

```php
\pagestyle{empty}        不显示页眉、页脚(默认值)
\pagestyle{plain}        不显示页眉、页脚在页面下端中部
\pagestyle{myheadings}   不显示页眉、页脚在页面上端中部
\pagestyle{headings}     页眉、页脚都在页面上端
```

 通常情况下，我们使用**默认值**即可即可。

 对于局部命令，通常使用 **\thispagestyle{}** 进行单独设置，修改有特殊要求的页面的显示。

```php
\thispagestyle{empty}        不显示页眉、页脚(默认值)
\thispagestyle{plain}        不显示页眉、页脚在页面下端中部
\thispagestyle{myheadings}   不显示页眉、页脚在页面上端中部
\thispagestyle{headings}     页眉、页脚都在页面上端
```

 通常情况下，论文的前几页为摘要、目录等内容，​**而非正文**​。

 但我们更习惯从正文开始对页码计数。因此，我们倾向于不显示前几页的页码，并将正文的第一页作为计数的首页。

 对前几页，添加如下命令，设置不显示页码（但​**不是不计数**​）：

```php
\thispagestyle{empty}
```

 对正文部分，添加如下命令，设置当前页为计数首页：

```cobol
\setcounter{page}{1}
```

---

### 2.页码标识符

 如果你厌倦了​**页码形式**​，你可以在序言部分添加以下命令进行更换：

```undefined
\pagenumbering{roman}  小写罗马字母
\pagenumbering{Roman}  大写罗马字母
\pagenumbering{alph}   小写字母
\pagenumbering{Alph}   大写字母
\pagenumbering{arabic} 阿拉伯数字（默认）
```

---

### 3.脚注

 **脚注**的添加方式有许多种。我最推荐的是以下命令：

```undefined
普通文本\footnote{脚注文本}
```

 这样的添加方式使得系统能够自行进行**顺序**标注。

## 七、参考文献

 在这里，我推荐大家选用BibLaTeX快速入门[LaTeX参考文献](https://so.csdn.net/so/search?q=LaTeX%E5%8F%82%E8%80%83%E6%96%87%E7%8C%AE&spm=1001.2101.3001.7020)部分。

### 1. 记录文献信息的bib文件

 首先，我们需要定义一个**bib格式**的文件用于存放参考文献信息。

 点击左侧操作栏的“​**New File**​”按键，创建一个**bib格式**的文件，即xxx.bib，在这里我将其命名为Referencces.bib，点击“​**Create**​”完成创建。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/21ea672c3f674e87b390337563b212e8-20250408133739-doaolml.png)

 值得注意的是，这样创建后会将该文件放到main.tex的同级目录下，可以根据自己的需要自行安排文件位置。但要保证后续找该文件的路径时，能明确并找到该bib文件！

### 2.如何寻找文献信息

 然后，我们需要到任意文献网站找到文献信息，以谷歌学术为例（如果打不开谷歌学术，可以尝试谷歌学术镜像网站），找到你想要的文献，以这篇经典的文献为例：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/673b2d7a86004d4eb1dd00a3763d9bb6-20250408133739-rtef7z9.png)

 点击“**引用**”会弹出窗口，需要我们指定文献信息格式，点击“​**BibTex**​”后会跳转到新页面，显示相关内容。我们将该段内容全部选中，复制粘贴到刚刚的文件Referencces.bib中：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/2aa523d17430439c97ff6def99343e52-20250408133739-lz5a3fu.png)

 要注意，系统帮我们将这段引用信息默认记作“vaswani2017attention”（见上图），我们可以根据个人喜好重新命名，这是我们后续引用该文献的重要标识。

 类似地，IEEE中获得相关文献信息的流程如下：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/af3296df31e740d0978e7d507e783fd5-20250408133739-9ndjbcz.png)

---

### 3.实现文献引用

 接下来，我们需要在序言部分导入BibLaTeX包并指明文献信息路径。

 首先是引入宏包：

```less
\usepackage[参数]{biblatex}
```

 在这里，我们关注这两个参数（也可以根据需要选择其他参数）：

* **backend=biber**    指定使用biber
* **sorting=none**      指定引用文献按文中出现的顺序排列，而不是按照作者或年份等方式排序

 同时，我们通过 **\addbibresource{ }** 命令指定参考文献信息来源，即我们最初创建的文件（我将其命名为了Referencces.bib）。

```undefined
\addbibresource{文件路径}
```

 接着，我们使用 **\cite{ }** 命令在想要指明引用文献的正文内容位置处进行引用，在这里我们使用前面提到的默认名称“vaswani2017attention”。

```undefined
\addbibresource{文献标识}
```

 最后，我们需要使用命令 **\printbibliography**表明需要​**显示参考文献列表**​。

```undefined
\printbibliography
```

 此处给出一个简单的示例供大家了解具体使用：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/31ff6098dce94605bc0c1d2702737323-20250408133739-0a01mwn.png)

 具体的效果如下：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/a68ec7c7ae8c41f98c359ac7e21d49c7-20250408133739-ssx8ag9.png)

 这样，我们就完成了引用参考文献。当然，也有许多其他的宏包可以帮助我们完成引用，鼓励大家积极探索\~

## 八、一些好用的小功能

### 1. 多人协作编辑

 编译栏上方有“**Share**”按键，点击后可以邀请团队伙伴与你共同进行项目编辑。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/325afbb444d54b46a4b805e3a30bfcab-20250408133739-2obj345.png)

 通过填入想要邀请的团队伙伴的注册邮箱即可发起邀请：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/1b92f0f7ed1443c0ab7f371cfa3e3123-20250408133739-6oidecu.png)

 通常在被邀请方的主页中会出现邀请提示，点击即可加入：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/6da80168050f4026a1f4c8939fcea74e-20250408133739-os5j0z0.png)

 在“​**Shared with you**​”即“**与您共享的**”项目中可以找到该项目，进入后即可共同编辑，实时看到键入内容。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/3c68e8d371d1479d9f8464ab6d792793-20250408133739-w6j1i5i.png)

 以我本机开两个账号为例：

 **右边**账号正在输入的内容会被同步到**左边**，这极大地方便了多方的共同工作。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/a9e244470fd24510ae863cb819d8c456-20250408133739-iqt6be0.png)

---

### 2. 历史编辑记录

 如果你在完成一些非常重要的工作，可以考虑开通Overleaf的会员，在享受较快的编译速度的同时，记录24小时内的历史编辑记录，实现及时追溯。

 点击编译栏上方的“​**History**​”即可查看。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/db1e05a316cb42c796dab1581f392113-20250408133739-aynz2af.png)

---

### 3. 使用[LaTeX模板](https://so.csdn.net/so/search?q=LaTeX%E6%A8%A1%E6%9D%BF&spm=1001.2101.3001.7020)

 我们提到过，LaTeX具有非常好的复现性，因此许多机构或者企业会提供LaTeX模板供使用者按照官方指定的格式编辑文本。

 以获取并使用北京理工大学学位论文模板为例，简单分享如何套用模板\~

 找到对应模板的压缩包，确定我们想要的**项目的zip**压缩包（不包含使用手册等其他文件）：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/2e66f158576e4de680464514309b849f-20250408133739-kae2lqn.png)

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/8878e6100cf741ab8a5aa6eaa37fff3d-20250408133739-asyl91b.png)

 如何确定项目对应的zip压缩包呢？只需要预览压缩包，层级目录呈现出类似下方的层级结构即可：

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/417cb063da4147a0a63366801c1058f0-20250408133739-2nhep99.png)

然后到主页选择“​**New Project**​”创建新的项目，选中“​**Upload Project**​”上传项目模板压缩包，之后将目标zip文件**选中**或**拖拽**到页面中：![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/7e5c81d6be4746f0a1a631547eef5ecb-20250408133739-2hmgbqi.png)

 上传完成后会**自动打开**项目，认真阅读注释处的要求，了解文档基本信息。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/26f5c004f7774c0b83d1163983d74228-20250408133739-1hujlcv.png)

 这里要注意一个**非常常见**的问题，因为默认的编译器是​**pdfLaTeX**​，但许多项目选用**XeLaTeX**（可以看到上面的项目就有这个要求），导致初次编译出现上面的报错，因此我们需要进行调整。

 点击操作栏的“​**Menu**​”，修改“​**Setting**​”中的“**Compiler**”，改为XeLaTeX，再次编译即可。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/d61195b8aba84f09b76d01e70d6c2ed7-20250408133739-2cufdkp.png)

 这样，我们就将模板导入了Overleaf，可以进行后续编辑啦\~

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/67fe371ced5f458e825d4d0e0335f697-20250408133739-i3nohth.png)

## 九、总结

 对于LaTeX，我们或许应该明白，它只是一种提供更多可能的​**工具**​，并非必需品。

 LaTeX有其优点，也有明显的缺点。

* 当面对​**排版没有精确要求**​，**数学内容简单且篇幅较短**的论文时，请直接打开你的Word。
* 当面对**限时的论文撰写工作**时，修改LaTeX代码也不如直接修改Word文档来得直观方便。

 言而总之，先权衡，再选择。

 附上本人学习过程中用到的Overleaf资料文档的链接：

 [在30分钟内学习LaTeX](https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes "在30分钟内学习LaTeX")

 [官方的超仔细学习文章](https://www.overleaf.com/learn "官方的超仔细学习文章")
