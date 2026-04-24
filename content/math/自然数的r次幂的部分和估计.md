---
tags:
  - math
  - 微积分
---

> [!question] 问题0
> 求极限:
> $$\lim_{N \to \infty} N\sum_{n>N} \frac{1}{n^2}$$

如果我们可以直接观察到，和的渐近展开的$1/N$项的系数是1，在这个前提我们可以使用Stolz-Cesaro的方法：

$$\lim_{n\to\infty}\frac{\sum_{k\geq n}\frac{1}{k^2}}{\frac{1}{n}}=\lim_{n\to\infty}\frac{\frac{1}{n^2}}{\frac{1}{n(n+1)}}=1$$
因此这个问题的答案就是1.不过这里我们重点是通过另外一条途径：

如果我们知道巴塞尔问题的结果，也就是$$\sum_{n\geq 1} \frac{1}{n^2}=\zeta(2)$$那么实际上这个问题问的是:

> [!question] 转换以后的问题
> 求$$S(N):=\zeta(2)-\sum_{n\leq N}\frac{1}{n^2}$$的精确到$\frac{1}{N}$系数的渐近展开。

我们实际上可以通过Euler-Maclaurin求和估计的办法得到一般的结果。

> [!note] 关于广义调和数一般的渐近结果
> 如果$r>0,r \neq 1$的时候，
> $$\sum_{k=1}^n k^{-r}=\zeta(r)+\frac{1}{1-r} n^{1-r}+\frac{1}{2} n^{-r}-\frac{r}{12} n^{-r-1}+O\left(n^{-r-3}\right)$$
> 如果$r=1$的时候,$$\sum_{k=1}^n k^{-1}=\gamma+\log(n) + \frac{1}{2} n^{-1}-\frac{1}{12} n^{-2}+O\left(n^{-4}\right)$$


### 1. 广义的调和级数部分和$r>1$时的渐近展开结果

> [!note] r>1时候渐近展开前几项
> 如果$r>1$，
> $$\sum_{k=1}^n k^{-r}=\zeta(r)+\frac{1}{1-r} n^{1-r}+\frac{1}{2} n^{-r}-\frac{r}{12} n^{-r-1}+O\left(n^{-r-3}\right)$$

最后的结果表明，实际上从$n^{-r-1}$开始往后都是每次降低2次，这是因为Bernoulli数从$B_3$开始奇数项都是0.

实际上$r=2$的时候的情况，本身就是Euler创立Euler-Maclaurin求和估计方法的原始动机。
#### 1.1 问题的答案

如果我们假设这个结果是对的，那么上面的问题可以直接用结果得到

$$\begin{aligned}\sum_{n\leq N}\frac{1}{n^2}&= \zeta(2)-N^{-1}+\frac{1}{2}N^{-2}-\frac{1}{6}N^{-3}+O(N^{-5})\end{aligned}$$

所以显然$$\begin{aligned}S(N)&:=\zeta(2)-\sum_{n\leq N}\frac{1}{n^2}\\ &= \frac{1}{N}+O\left(\frac{1}{N^2}\right)\end{aligned}$$
因此显然，最后极限的结果就是1,因为$1/N$项的系数是1.

#### 1.2 证明此渐近展开结果

直接用欧拉求和公式并不明智。因为这样会遇到欧拉求和的一个常见的毛病，没有办法搞清楚渐进当中带有的那个常数项是多少。但是有一种情况是可以避免的，就是说我们知道这个求和$\sum_{k=1}^{n}f(k)$其对应的级数$\sum_{k=1}^{\infty}f(k)$收敛，并且知道(假设)其收敛到$S$。那么可以把问题转换为:$$\sum_{k=1}^{n}f(k)=S-\sum_{k>n}f(k)$$然后针对于后者使用欧拉求和公式去做。对于这个问题令$g_r(t)=\frac{1}{t^r},r>1$，于是:$$\begin{aligned}\sum_{k=n+1}^{\infty}g_r(k)&=\int_{n+1}^{\infty}g_r(t)dt+\frac{1}{2}(n+1)^{-r}+\frac{r}{12}(n+1)^{-r-1}\\&-\frac{1}{24}\int_{n}^{\infty}B_{4}(\{t\})f^{(4)}(t)dt\\&=-\frac{1}{1-r}(n+1)^{1-r}+\frac{1}{2}(n+1)^{-r}+\frac{r}{12}(n+1)^{-r-1}+O\left(\frac{1}{n^{r+3}}\right)\\&=-\frac{1}{1-r}n^{1-r}-\frac{1}{2}n^{-r}+\frac{r}{12}n^{-r-1}+O\left(\frac{1}{n^{r+3}}\right)\end{aligned}$$于是$$\begin{aligned}\sum_{k=1}^{n}f(k)&=\zeta(r)-\sum_{k>n}g_r(k)\\&=\zeta(r)+\frac{1}{1-r}n^{1-r}+\frac{1}{2}n^{-r}-\frac{r}{12}n^{-r-1}+O\left(n^{-r-3}\right)\end{aligned}$$
最后我们还可以对余项做一个估计，这样方便用在不等式放缩的情况下。

> [!note] r>1时候求和的不等式形式
> 如果$r>1$，
> $$\sum_{k=1}^n k^{-r}=\zeta(r)+\frac{1}{1-r} n^{1-r}+\frac{1}{2} n^{-r}-\frac{r}{12} n^{-r-1}+E_r(n)$$
> 其中余项$$|E_r(n)|<\frac{r(r+1)(r+2)}{720n^{r+3}}$$

最后这个估计是借助对Bernoulli多项式在一个单位内的估计给出的，也就是$$|B_{p}(\{t\})|\leq \frac{2p!}{(2\pi)^p}\zeta(p)$$
这里$p=4$,然后得到估计。

### 2. $0<r<1$情形下的渐近展开

> [!note] 0<r<1时候渐近展开前几项
> 如果$0<r<1$，
> $$\sum_{k=1}^n k^{-r}=\frac{1}{1-r} n^{1-r}+\zeta(r)+\frac{1}{2} n^{-r}-\frac{r}{12} n^{-r-1}+E_r(n)$$
> 其中余项$$|E_r(n)|<\frac{r(r+1)(r+2)}{720n^{r+3}}$$

也就是说，当$0<r<1$的时候，情况根本没有变化，只不过此时zeta函数取值是**解析延拓**以后的取值。这是为什么呢？这是因为在$\text{Re}(s)>1$的时候,我们通过Euler-Maclaurin以及zeta函数的级数表示得到$$\begin{aligned}\zeta(s)&=\sum_{k\leq n} k^{-s} -\left(\frac{1}{1-s} n^{1-s}+\frac{1}{2} n^{-s}-\frac{s}{12} n^{-s-1}\right)\\ &+\frac{s(s+1)(s+2)(s+3)}{24}\int_{n}^{\infty}B_{4}(\{t\})t^{-s-3}\,dt\end{aligned}$$
这是zeta函数的一个解析延拓，因为右边显然在$\text{Re}(s)>-4\text{ and } s\not = 1$的范围内都是成立的,而解析延拓的唯一性可以保证上述式子和其他解析延拓出来的$\zeta(s)$在$0<\text{Re}(s)<1$的范围内都是一致的。因此我们可以把结果推广到，一般的情况。

也就是说，上述展开不仅仅是可以得到$0<r<1$，就算是$r> -2$也是可以的。

比如说下面这个问题：

> [!question] 问题2
> 求$$\sum_{k\leq n}\sqrt{k}$$的渐近展开，特别是需要得到其常数项的渐近系数。

那么根据上面的公式，此时相当于$r=-1/2$于是我们可以直接得到答案:

$$\sum_{k\leq n}\sqrt{k}=\frac{2}{3}n^{3/2}+\frac{1}{2}n^{1/2}+\zeta(-1/2)+\frac{1}{24}n^{-1/2}+O(n^{-5/2})$$
### 3. $r=1$的情况

### 4. $r<0$的情况
#### 4.1 $r<0$且$|r|$为正整数的情况
这个时候当然就是著名的Faulhaber公式了，因为此时$-r \in \mathbb{Z}^{+}$,求和式子$\sum_{k\leq n}k^{-r}$的求和式子可以直接表达为关于n的多项式:

$$\begin{aligned}\sum_{k\leq n} k^{|r|} &= \frac{1}{|r|+1} \cdot \sum_{j=0}^{|r|}\binom{|r|+1}{j}B_{j} n^{|r|+1-j} \\ &= \frac{1}{1-r}n^{-r+1}+\frac{1}{2}n^{-r}-\frac{r}{12}n^{-r-1}+\cdots+B_{|r|}n\end{aligned}$$

为什么会这样呢？很简单，因为使用Euler-Maclaurin求和公式的时候，当$f(t):=t^{|r|}$并且$|t|$是整数的情况下，其导数在某一项以后全部都是0.以及Bernoulli多项式在一个单位里面的积分是0，因此渐近展开当中常数项及其更低次的项目都是0.

### 5. 求和上限为实数的情况

有的时候，比如做分部求和的时候，后者数论当中的情况，我们需要把求和当成一个函数去处理，因此会考虑$$S_r(x):=\sum_{k\leq x} \frac{1}{k^{r}}$$的渐近展开。

如果我们考虑最简单的版本的连续Euler-Maclaurin求和公式的话，会得到:

$$\begin{aligned}S_r(x)&=\zeta(r)-\left(-\frac{1}{1-r}x^{-r+1}+B_1(\{x\})x^{-r}+\frac{r}{2}B_2(\{x\})x^{-r-1}-\frac{r(r+1)}{2}\int_{x}^{\infty} \frac{B_2(\{t\})}{t^{r+2}}\,dt\right)\\ &= \zeta(r)+\frac{1}{1-r}x^{-r+1}-B_1(\{x\})x^{-r}-\frac{r}{2}B_2(\{x\})x^{-r-1}+\frac{r(r+1)}{2}\int_{x}^{\infty} \frac{B_2(\{t\})}{t^{r+2}}\,dt\end{aligned}$$

