---
tags:
  - math
  - 实分析
---
### 1. 非负序列和的Carleman不等式

> [!note] Carleman不等式(Carleman 1923)
> $a_n$是一列非负实序列，令$G_n:=(\prod_{k=1}^na_k)^{1/n}$为此序列的几何平均值序列。如果$a_n$组成的级数$\sum_{k\geq 1}a_k$收敛，那么$G_n$组成的级数$\sum_{n\geq 1}G_n$也收敛并且被$\sum_{k\geq 1}a_k$控制起来：$$\sum_{n\geq 1}G_n<e\sum_{k\geq 1}a_k$$其中$e$是自然底数。

#### 1.1 不等式的证明

我们本质上想要得到$\sum_n G_n$这个和的一个上界估计，整个估计采用的方法是[[逐项估计]]。这里我们借助[[Power mean及其性质]]当中的符号来阐述这里的逐项估计思路。

按照[[Power mean及其性质]]中的记号，$G_n=M_0(a_1,\cdots,a_n)$，这种权重为1的几何平均值可以被$M_1(a_1,2a_2,\cdots,na_n)$控制起来，因为$$M_0(a_1,\cdots,a_n)=(n!)^{-\frac{1}{n}}M_0(a_1,2a_2,\cdots,na_n)\leq (n!)^{-\frac{1}{n}}M_1(a_1,2a_2,\cdots,na_n)$$
然后利用[[Stirling渐近公式及不等式#4.不等式关系]],我们可以把系数$(n!)^{-\frac{1}{n}}$做一个放缩得到一个更简单的上界：$$(n!)^{-\frac{1}{n}}=[(\sqrt{2\pi n})^{-1/n} e^{-\frac{r_n}{n}}]\frac{e}{n}< \frac{e}{n+1}$$其中$\frac{1}{12n+1}<r_n<\frac{1}{12n}$。

* 这里一个较为粗糙的放缩是$(n!)^{-\frac{1}{n}}<\frac{e}{n}$。如果采用这样精度的放缩，那么后面在进行逐项估计的时候误差会达不到我们想要的结果。具体体现在，如果用上面的$\frac{e}{n+1}$作为上界，那么最后我们会得到$$\sum_{n\geq k}\frac{1}{n(n+1)}=\frac{1}{k}$$这恰好满足Carleman不等式的要求。但如果是$\frac{e}{n}$作为上界，那么由于$$\sum_{n\geq k}\frac{1}{n^2}>\frac{1}{k}$$最后则不能得到Carleman不等式的结果。

现在我们得到$$M_0(a_1,\cdots,a_n)<\frac{e}{n+1}M_1(a_1,2a_2,\cdots,na_n)$$按照求和以及$G_n$的定义写出来就是$$G_n<\frac{e}{n(n+1)}\sum_{k=1}^n ka_k$$从而$$\sum_{n=1}^NG_n<\sum_{n=1}^N\frac{e}{n(n+1)}\sum_{1\leq k\leq n} ka_k$$但是这样的上界还不是最简单的，我们还可对上界做进一步化简。首先我们交换求和次序$$\begin{aligned}\sum_{n=1}^N\frac{e}{n^2}\sum_{1\leq k\leq n} ka_k&=e\sum_{n\leq N}\sum_{k\leq N}1_{k\leq n}\frac{1}{n(n+1)}ka_k\\&=e\sum_{k\leq N}\sum_{n\leq N}1_{k\leq n}\frac{1}{n(n+1)}ka_k\\&=e\sum_{k\leq N}ka_k\sum_{k\leq n\leq N}\frac{1}{n(n+1)}\\&=e\sum_{k\leq N}ka_k\sum_{k\leq n\leq N}\frac{1}{n(n+1)}\\&<e\sum_{k\leq N}ka_k\sum_{k\leq n}\frac{1}{n(n+1)}\\&= e\sum_{k\leq N}a_k\end{aligned}$$因此$$\sum_{n\leq N}G_n< e\sum_{k\leq N}a_k$$如果$a_k$组成的级数收敛，那么两边取极限便得到$$\sum_{n\geq 1}G_n\leq  e\sum_{k\geq 1}a_k$$然而在$\sum_k a_k$收敛的情况下上面不等式不能取等，因为等式成立需要$a_k = \frac{C}{k}$，但倘若$a_k$具有这种形式其对应的级数不可能收敛。因此$$\sum_{n\geq 1}G_n< e\sum_{k\geq 1}a_k$$
#### 1.2 一些典型的应用

> [!note] 命题1.2.1
> 对于正实数序列$a_n$，如果级数$\sum_{n\geq 1}\frac{1}{a_n}$收敛，那么级数$$\sum_{n\geq 1}\left(\frac{n}{a_1+\cdots+a_n}\right)^p,p\geq 1$$也是收敛的。

^d22522

* 令$b_n:=\frac{1}{a_n}$那么我们就是要用$\sum_n b_n$控制目标的级数，不过Carleman不等式控制的是序列的几何平均值的和，而目标的和是关于$b_n$的调和平均值。这里与Carleman不等式的联系基于[[Power mean及其性质]]，因为$$\left(\frac{n}{a_1+\cdots+a_n}\right)^p=M_{-1}(b_1,\cdots,b_n)^p\leq M_0(b_1,\cdots,b_n)^p$$令$G_n:=M_0(b_1,\cdots,b_n)$根据条件以及Carleman不等式，于是我们知道$\sum_{n\geq 1}G_n$是收敛的，因此$G_n\to 0$。因此对于足够大的$n$,$G_n^p\leq G_n$于是$\sum_n G_n^p$也是收敛的，于是$$\sum_{n\geq 1}\left(\frac{n}{a_1+\cdots+a_n}\right)^p\leq \sum_{n\geq 1}G_n^p<\infty$$
* 这个不等式其中$p=1$才是关键。因为如果$p>1$，令$A_n:=\sum_{k\leq n}a_k,S_n:=\sum_{k=1}^n \frac{1}{a_k}\to S$。那么柯西不等式告诉我们$$A_nS_n\geq n^2$$于是$$F_n:=\frac{n}{A_n}\leq \frac{S_n}{n}\leq \frac{S}{n}$$所以$$\sum_n F_n^p \leq S^p\sum_n\frac{1}{n^p}$$因此只要$p>1$后者当然是收敛的，关键在于$p=1$的情况。
