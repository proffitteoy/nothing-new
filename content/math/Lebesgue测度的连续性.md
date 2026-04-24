---
tags:
  - math
  - 实分析
---

> [!question] 问题0：复旦大学2019考研实分析
> $E\subseteq \mathbb{R}^n$是一个Lebesgue可测集，证明集合$$\{m(F):F\subseteq E,F可测\}$$是一个区间。

### 1. 问题解决

通常来说，这种集合有关的问题想要通过分析学的方法处理，我们首先要做的就是把集合问题转换为函数问题。

#### 1.1 构造a

> [!tip] 想法1.1.1
> 在这个问题当中，我们可以构造$$E_r:=E\cap B(0,r)$$其中$B(0,r):=\{x\in \mathbb{R}^n:||x||<r\}$然后定义$$f(r):= m(E_r)$$因为$[0,\infty)$是一个区间，而连续函数保持连通性不变，因此如果函数连续，那么$f([0,\infty))$一定也是一个区间。然后我们考虑到$f(0)=0$以及$f(\infty)=m(E)$就可以完成全部证明。因此我们接下来只需要证明两件事：
> 1. $f$是一个连续函数
> 2. $\lim_{r\to \infty}f(r)=m(E)$
* 对于连续函数而言令$m=\inf_{x\in (0,\infty)} f(x),M=\sup_{x\in (0,\infty)} f(x)$那么$f((0,\infty))$只能是下面四种情况$$(m,M),[m,M),(m,M],[m,M]$$所以我们只需要证明$m=0,M=m(E)$，我们就能证明整个命题。

关于连续性：考虑$y>x\geq 0$于是$$\begin{aligned}f(y)-f(x)&=m(E_y)-m(E_x)\\&=m(E\cap (B(0,y)\setminus B(0,x)))\\&\leq m(B(0,y)\setminus B(0,x))\\&=\omega_n (y^n-x^n)\end{aligned}$$其中$\omega_n$是$\mathbb{R}^n$当中单位球的体积，是一个常数。也就是说我们可以得到$$|f(x)-f(y)|\leq \omega_n |x^n-y^n|$$ 因此函数$f$在$[0,\infty)$上连续。

然后由于$\bigcup_{n\geq 1}E_n=E$并且那么利用测度的自下而上的连续性(参考[[测度论的基础概念#^16fa84]])以及函数的单调不减性$$m(E)=\lim_{n\to \infty}m(E_n)=\lim_{n\to \infty} f(n)=\lim_{r\to \infty} f(r)$$基于以上信息我们知道$$f([0,+\infty))\cup \{m(E)\}=[0,m(E)]\tag{1}$$令$A:=\{m(F):F\subseteq E,F可测\}$那么首先我们知道$$A\subseteq [0,m(E)]$$另一方面由于$f([0,\infty))=\{m(E_r):r>0\}$是$A$的子集，并且$m(E)\in A$因此$$f([0,+\infty))\cup \{m(E)\}=[0,m(E)]\subseteq A$$因此在拓展实数当中$$A=[0,m(E)]$$

* 之所以写$(1)$而不是说$f([0,\infty))=[0,m(E)]$是因为，有可能$E$是一个有限测度的集合，但$E$无界。这时候就有可能出现，对任意$r>0$都有$E\setminus B(0,r)$的测度始终大于0的情况。此时相当于对所有的$r$都有$f(r)<m(E)$，只有在取极限的时候才是$m(E)$。
* 除了球体以外，立方体也是可行的。定义$$E_r = E\cap (-r,r)^n$$整个证明类似。







