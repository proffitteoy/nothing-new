---
obsidian-note-status:
  - colorful:completed
---



> [!example] Fubini-Tonelli定理
> 如果 $f$ 定义在 $X \times Y$ 上是可积的或者函数 $f$ 是非负可测的，那么有
> $$
> \int_{X\times Y}f(x,y)\,d(\mu\times\nu) = \int_{X}\left(\int_Y f(x,y) \, d\nu\right) \, d\mu = \int_Y\left(\int_X f(x,y) \, d\mu\right) \, d\nu
> $$

> [!example] Fubini-Tonelli定理的一个使用策略
> 注意到，Tonelli定理只需要要求非负函数是可测函数，并不要求可积。因此有这样的策略:
> 
> 1.  首先使用 Tonelli 定理计算 $|f|$ 的积分，如果可测的话。如果一切顺利，那么积分是有限的，于是 Fubini 定理自然成立。
> 2.  如果发现其中一个积分计算出来是无穷的情况，那么自然证明原来的函数 $f$ 并不可积，于是 Fubini 定理失效。

### 1. 例子1：典型的用法

函数 $f$ 在闭区间 $[0,b]$ 上可积，并定义函数
$$
g(x)=\int_{x}^{b}\frac{f(t)}{t}dt, \quad 0 <x\leq b
$$
证明函数 $g$ 在闭区间 $(0,b]$ 上可积并且:
$$
\int_{0}^{b}g(x)dx = \int_{0}^{b}f(t)dt
$$

在交换积分次序之前首先判断函数是否可积，中间因为 $\frac{|f(t)|}{t}$ 可测，所以使用 Tonelli 定理换序：

$$
\begin{aligned}
\int_{0}^{b} |g(x)|dx &= \int_{0}^{b}\left|\int_{x}^{b}\frac{f(t)}{t}dt\right|dx \\
&\leq \int_{0}^{b}\int_{x}^{b}\frac{|f(t)|}{t}dtdx \\ 
&= \int_{0}^{b}\int_{0}^{b}\frac{|f(t)|}{t}\chi_{\{ b\ge t\ge x>0 \}}dtdx \\
&= \int_{0}^{b}\int_{0}^{b}\frac{|f(t)|}{t}\chi_{\{ b\ge t\ge x>0 \}}dxdt \\ 
&= \int_{0}^{b}\int_{0}^{t} \frac{|f(t)|}{t}dxdt \\ 
&= \int_{0}^{b}|f(t)|dt < +\infty
\end{aligned}
$$

所以函数 $g$ 可积，$\frac{f(t)}{t}\chi_{\{b\ge t\ge x>0 \}}$ 在 $(0,b]\times[0,b]$ 上也可积，因此可以使用 Fubini 定理换序，过程和上面基本一致，最后得到结果:

$$
\begin{aligned}
\int_{0}^{b} g(x)dx &= \int_{0}^{b}\int_{x}^{b}\frac{f(t)}{t}dtdx \\ 
&= \int_{0}^{b}\int_{0}^{b}\frac{f(t)}{t}\chi_{\{ b\ge t\ge x>0 \}}dtdx \\
&= \int_{0}^{b}\int_{0}^{b}\frac{f(t)}{t}\chi_{\{ b\ge t\ge x>0 \}}dxdt \\ 
&= \int_{0}^{b}\int_{0}^{t} \frac{f(t)}{t}dxdt \\ 
&= \int_{0}^{b}f(t)dt
\end{aligned}
$$

即：
$$
\int_{0}^{b}g(x)dx = \int_{0}^{b}f(t)dt
$$

### 2. 例子2：函数不可积导致Fubini定理失效

$$
f(x,y):=\begin{cases}
\frac{x^2-y^2}{(x^2+y^2)^{2}} & (x,y)\in[0,1]^2, (x,y)\neq (0,0) \\
0 & (x,y)=(0,0)
\end{cases}
$$

令 $I = [0,1]$，首先函数 $|f|$ 是可测的，因此由 Tonelli 定理直接交换顺序计算 (如果发现不可积，可以稍微放缩):

$$
\begin{aligned}
\int_{I^2}|f(x,y)|d(x,y) &=\int_{I^2} \frac{x^2-y^2}{(x^2+y^2)^{2}}\chi_{\{1>x\geq y>0\}}d(x,y)+\int_{I^2}\frac{y^2-x^2}{(x^2+y^2)^{2}}\chi_{\{0<x<y\leq1\}}d(x,y)\\
&\geq\int_{0}^{1}\int_{0}^{x}\frac{x^2-y^2}{(x^2+y^2)^{2}}dydx \\
&= \int_{0}^{1}\frac{1}{2x}dx = +\infty
\end{aligned}
$$

因此这个例子当中 Fubini 定理是不可用的。实际上使用 Fubini 定理会发现:

1.  $\int_0^1 \left(\int_0^1 \frac{x^2-y^2}{(x^2+y^2)^2} dy\right) dx = \int_0^1 \frac{1}{1+x^2} dx = \frac{\pi}{4}$
2.  $\int_0^1 \left(\int_0^1 \frac{x^2-y^2}{(x^2+y^2)^2} dx\right) dy = - \frac{\pi}{4}$

### 3. 反例2: $\sigma\text{-finite}$ 条件缺失导致失效

$I =[0,1]$ 然后令 $\mathcal{B}(I)$ 是 Borel 代数，令 $\mu$ 是 Lebesgue 测度，$\nu$ 是 counting measure (计数测度)。现在构建两个测度空间: $(I,\mathcal{B}(I),\mu)$ 以及 $(I,\mathcal{B}(I),\nu)$。

考虑 $I^2$ 当中的一个闭集 $D=\{(x,y):x=y,(x,y)\in I^2\}$，那么自然 $D\in \mathcal{B}(I^2) = \mathcal{B}(I) \otimes \mathcal{B}(I) \subset \mathcal{B}(I) \otimes \mathcal{P}(I)$。现在考虑计算积分：
$$
\int_{I^2}\chi_{D} d(\mu \times \nu)
$$

1.  $\int_{I}\left(\int_{I} \chi_{D}(x,y) d\mu(x)\right)d\nu(y)=\int_{I}0d\nu(y)=0$
2.  $\int_{I}\left(\int_{I} \chi_{D}(x,y) d\nu(y)\right)d\mu(x)=\int_{I}1d\mu(x)=1$

这主要是因为 $\nu$ 是 counting measure，所以 $(I,\mathcal{B}(I),\nu)$ 并不是 $\sigma\text{-finite}$ 的测度空间。

### 4. 经典反例3：不可积的例子2

$$
f(x,y):=\begin{cases}
\frac{1}{y^2} & 0<x<y<1 \\
-\frac{1}{x^2} & 0<y<x<1 \\ 
0 & \text{otherwise}
\end{cases}
$$

先考虑 Tonelli 定理，$I=[0,1]$，
$$
\begin{aligned}
\int_I\int_I |f(x,y)|\,dydx &= \int_I\int_I \frac{1}{y^2}\chi_{\{0<x<y<1\}}\,dydx + \int_I\int_I \frac{1}{x^2}\chi_{\{0<y<x<1\}}\,dydx \\
&= \int_{0}^{1}\int_{x}^{1}\frac{1}{y^2}\,dydx + \int_{0}^{1}\int_{0}^{x} \frac{1}{x^2}\,dydx \\ 
&\ge \int_{0}^{1}\int_{x}^{1}\frac{1}{y^2}\,dydx \\
&=\int_{0}^{1}(-1+1/x)\,dx = +\infty
\end{aligned}
$$
因此显然，函数并不可积，所以 Fubini 定理是不适用的，因此可以很容易预期：
$$
\int_I\int_I f(x,y)dydx \neq \int_I\int_I f(x,y)dxdy 
$$

### 5. 反例4：求和的版本的反例

$\Omega=\{1,2,3,\dots\}$，$\mu$ 是 counting measure，$\mathcal{P}(\Omega)$ 是幂集。这样可以建立一个可测空间 $(\Omega,\mathcal{P}(\Omega),\mu)$，然后在 $\mathcal{P}(\Omega)\otimes \mathcal{P}(\Omega)$ 上定义测度 $\mu\times \mu$，现在考虑在 $\Omega^2$ 上对函数的积分:

$$
f(i,j)=\begin{cases}
1, & \text{if } i=j \\ 
-1, & \text{if } i=j+1 \\ 
0, & \text{otherwise}
\end{cases}
$$

我们可以把 $\Omega^2$ 看成是一个无限阶的矩阵，那么函数的取值写成矩阵就是:
$$
[f(i,j)]=\begin{bmatrix}
1 & 0 & 0 & 0 & \cdots \\ 
-1 & 1 & 0 & 0 & \cdots \\
0 & -1 & 1 & 0 & \cdots \\
0 & 0 & -1 & 1 & \cdots \\
\vdots & \vdots & 0 & -1 & \cdots \\
\vdots & \vdots & \vdots & \vdots & \ddots \\
0 & 0 & 0 & 0 & \cdots
\end{bmatrix}
$$
也就是说考虑积分:
$$
\int_{\Omega^2}f(i,j)d(\mu\times \mu) = \sum_{i,j\in\Omega}f(i,j)
$$
也就是说这实际上就是求和。

这个积分实际上是不可积的，因为 $\sum_{i,j\in\Omega}|f(i,j)|$ 实际上并不收敛。这意味着 Fubini 定理在此处是不适用的，如果一定要尝试，会发现累次积分不一致:

1.  $\int\left(\int f(x,y)\,d\mu(y)\right)d\mu(x)=\sum_{i=1}^\infty \left(\sum_{j=1}^\infty f(i,j)\right)=1$
2.  $\int\left(\int f(x,y)\,d\mu(x)\right)d\mu(y)=\sum_{j=1}^\infty\left(\sum_{i=1}^\infty f(i,j)\right)=0$

# 证明

> [!tip] 证明思路
> 沿用实分析惯用的证明思路，即从简单函数到有界到非负可测。

## step1：对线性组合封闭

Fubini 展开来写有三个证明的点：
首先需要满足是可积的，那么有：
对 $y$ 的切片在 $R^{d_1}$ 可积，
$$
\int _{R^{d_1}}f^y(x)dx
$$
在 $R^{d_1}$ 上可积和
$$
\int_{X\times Y}f(x,y)\,d(\mu\times\nu) = \int_{X}\left(\int_Y f(x,y) \, d\nu\right) \, d\mu = \int_Y\left(\int_X f(x,y) \, d\mu\right) \, d\nu
$$

要证明对线性组合封闭，即证明可加性。
取满足
$$
\forall k,\quad \exists A_k \in R^{d_2} \quad m(A_k)=0
$$
的一列 $\{f_k\}_k^N \subset F$，取 $A=\bigcup_{k=1}^N A_k$。性质1好证，性质2就是
$$
\sum_{k=1}^N a_k\int_{R^{d_1}}f_k(x,y)dx
$$
然后把对 $x$ 积分看作切片，则有
$$
\begin{aligned}
\int_{R^{d_2}}\left(\int_{R^{d_1}}f_k(x,y)dx\right)dy &= \int_{R^d}f_k \\
&=\int_{R^{d_2}}\left(\int_{R^{d_1}}\sum_{k=1}^Na_kf_k(x,y)dx\right)dy \\
&=\sum_{k=1}^N\int_{R^d}a_kf_k=\int_{R^d}a_kf_k
\end{aligned}
$$

## step2：对极限封闭

继续取函数列要求它逼近 $f$。
考虑从下方逼近，有 MCT (单调收敛定理)：
$$
\lim_{k \to \infty}\int_{R^d}f_k(x,y)dxdy=\int_{R^d}f(x,y)dxdy
$$
分别对 $f_k$ 和 $f$ 取两次积分即可证明性质1和2，对于3：
$f$ 是可积的，那么它积分后再对 $y$ 积分肯定是有限的，
即
$$
\int_{R^{d_1}}f_k(x,y)dx < \infty
$$
取极限，$f$ 对 $y$ 的切片也是可积的，$f \in F$。

## step3: 简单函数满足

取
$$
E=Q_1 \times Q_2
$$
就是一个最简单的 open cubes，对于任意 $y$，$\chi_E(x,y)$ 在 $X$ 上是可测的。
$$
g(y)=\int_{R^{d_1}}\chi_E(x,y)dx
$$
其中示性函数取1表示 $(x,y)$ 在 $E$ 中。那从最内层考察只需要考虑 $y \in Q_2$ 就有
$$
g(y)=\int_{R^{d_1}}\chi_E^y(x)dx=\int_{R^{d_1}}\chi_{Q_1}(x)dx=|Q_1|
$$
那肯定有
$$
\int_{R^d}\chi_E(x,y)dxdy=|Q_1||Q_2|=\int_{R^{d_2}}g(y)dy
$$
推广到部分带边界部分不带边界的情况：
看作边界和方形做笛卡尔积，然后从二维情况推广到高维，发现边界无论如何都是零测集，那又回到之前对方体的讨论中。
进一步推广取
$$
E=\text{finite union of closed cubes}=\bigcup_{j=1}^{\infty}Q_k
$$
我们可以把 $\chi_E$ 写成 $\chi_{Q_k^n}$ 和 $\chi_{A_k}$ 的线性组合。即：
$$
\chi_E=\sum_{k=1}^N\chi_{A_k}+\sum_{k=1}^N\chi_{A_k}\in F
$$
接下来让 $E$ 变成更一般的开集 $\bigcup_{j=1}^{\infty}Q_j$ 然后去量化它：
$$
f_k=\sum_{j=1}^k \chi_{Q_j} \uparrow \chi_E=f
$$
取
$$
G_\delta=\bigcap_{j=1}^{\infty}\text{open set}, \quad m(E)<\infty
$$
最后再证明它也在 $F$ 中。

## step4: 0测集满足

选取一个
$$
G_\delta\in F, \quad m(G)=0, \quad E\subset G
$$
那么就有
$$
\int_{R^{d_2}}\left(\int_{R^{d_1}}\chi_G(x,y)dx\right)dy=\int_{R^{d_2}}\chi_G=0
$$
即
$$
\int_{R^{d_1}}\chi_G(x,y)dx=0=m(G^y),\quad \text{a.e. } y
$$

## step5: 可测函数满足

$N$ 是零测集，用 $E$ 去逼近 $G$ 则
$$
m(N)=m(G \setminus E)=0
$$
即
$$
\chi_E=\chi_G-\chi_{G \setminus E}\in F
$$

## step6: 可积函数满足

如果是可测函数那么有
$$
f=f^+-f^-
$$
$$
\varphi_k\in F \uparrow f 
$$

## 总结

从篇幅来看，最开始的简单函数和最基础的矩形是最难研究的，在研究明白之后直接利用 MCT 和 $f=f^+-f^-$ 就能快速证毕。