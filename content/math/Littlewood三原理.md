---
obsidian-note-status:
  - colorful:completed
---

>[!note] Littlewood三原则
> 1. 所有Lebesgue可测集都“几乎”是有限个"区间"的并。
> 2. 所有几乎处处收敛的Lebesgue可测函数列“几乎”是一致收敛的。（Egorov定理）
> 3. 所有Lbesgue可测函数都“几乎”是连续的。（Lusin定理）

### 1. Lebesgue可测的正则性

>[!note] 定理
>**Littlewood 第一原理**
>设 $E \subset \mathbb{R}$ 为勒贝格可测集，且满足有限测度条件 $m(E) < \infty$。
>则对于任意给定的 $\epsilon > 0$，存在有限个互不相交的开区间 $I_1, \dots, I_N$，使得若令 $A = \bigcup_{k=1}^N I_k$，则满足：
>$$ m(E \Delta A) < \epsilon $$


根据勒贝格测度的外正则性，对于任意 $\epsilon > 0$，存在开集 $O \supset E$，使得：
$$ m(O \setminus E) < \frac{\epsilon}{2} $$
由于 $m(E) < \infty$，我们有 $m(O) = m(E) + m(O \setminus E) < \infty$。
集合 $E$ 与 $O$ 的对称差仅由 $O \setminus E$ 贡献，即：
$$ m(E \Delta O) = m(O \setminus E) < \frac{\epsilon}{2} $$
存在序列 $\{I_k\}_{k=1}^{\infty}$，使得：
$$ O = \bigcup_{k=1}^{\infty} I_k \quad m(O) = \sum_{k=1}^{\infty} m(I_k) $$
根据级数收敛的性质，余项趋于零。因此，存在足够大的整数 $N$，使得：
$$ \sum_{k=N+1}^{\infty} m(I_k) < \frac{\epsilon}{2} $$
构造集合 $A$ 为前 $N$ 个区间的并：
$$ A := \bigcup_{k=1}^{N} I_k $$
显然，$A$ 是有限个互不相交开区间的并。
我们需要估计 $m(E \Delta A)$。利用对称差满足三角不等式的性质（即 $d(X,Y) = m(X \Delta Y)$ 满足 $d(E,A) \le d(E,O) + d(O,A)$）：
$$ m(E \Delta A) \le m(E \Delta O) + m(O \Delta A) < \frac{\epsilon}{2} + \frac{\epsilon}{2} = \epsilon $$

### 2. Egorov定理

> [!note] Egorov定理（1911）
> 假设$f_k$是一列定义在有限测度的可测集合$E\subset \mathbb{R}^d$上的Lebesgue可测函数，并且$f_k$在$E$上几乎处处收敛到$f$。那么对于任意$\varepsilon>0$，我们都可以找到$E$的一个闭子集$A_{\varepsilon}$使得$m(E-A_{\varepsilon})\leq \varepsilon$并且在$A_{\varepsilon}$上函数列$f_k$一致收敛到$f$。

我们的目标是要对任意的$\varepsilon>0$构造一个闭子集$A_{\varepsilon}$，在满足$m(E-A_{\varepsilon})\leq \varepsilon$的同时，使得$$\sup_{x\in A_{\varepsilon}}|f_k(x)-f(x)|\to 0$$我们发现实际上闭子集这个条件一开始也不需特别在意。因为只要我们可以找到一个可测集合$A_{\varepsilon}'$满足函数列一致收敛的条件，$$m(E-A'_{\varepsilon})<\frac{\varepsilon}{2}$$那么由于Lebesgue可测的内正则性，我们总是可找到一个闭子集$A_{\varepsilon}\subseteq A_{\varepsilon}'$从而$m(A_{\varepsilon}'-A_{\varepsilon})<\frac{\varepsilon}{2}$。那么由于$$E-A_{\varepsilon}=(E-A_{\varepsilon}')\cup(A_{\varepsilon}'-A_{\varepsilon})$$于是$$m(E-A_{\varepsilon})\leq m(E-A_{\varepsilon}')+m(A_{\varepsilon}'-A_{\varepsilon})<\varepsilon$$
* 以上过程可以推广为，在外测度的意义下，假设$C\subseteq B\subseteq A$，那么$$\mu^{*}(A-C)\leq \mu^{*}(A-B)+\mu^{*}(B-C)$$形式上看起来有点像某种三角不等式。

所以一开始的重点主要是，如何构造满足与$E$的测度的逼近条件，以及一致收敛的可测集合$A_{\varepsilon}'$。

我们的出发点是$f_k(x)\to f(x)$在$E$上几乎处处成立，不失一般性我们可以找到一个$E'\subseteq E$使得$f_k(x)$在$E'$上处处收敛到$f(x)$。

那么现在的问题是，要如何做才能在某个集合上把逐点收敛强化到一致收敛？

此处关键的构造在集合$$E_k^{n}:=\{x\in E':|f_j(x)-f(x)|<\frac{1}{n},\forall j>k\}$$
1. 我们想要的$A'_{\varepsilon}$实际上就在$E_k^n$关于$n$的集合列的交集当中。因为对任意的$\delta>0$我们都可以选择一个n使得$\frac{1}{n}<\delta$使得对任意的正整数$k$都有,当$j>k$的时候$$\sup_{x\in E^n_{k}}|f_j(x)-f(x)|\leq \frac{1}{n}<\delta$$
2. 但是我们显然不能随便选一个$k$，然后令$A'_{\varepsilon}$就是$\cap_{n\geq 1}E_k^n$。因为此处还有一个限制，需要$A'_{\varepsilon}$任意逼近$E'$。此处我们考虑到，如果固定$n$考虑关于$k$的集合列$E_k^n$。这是一个关于$k$自下而上逼近$E'$的集合列，  
Littlewood 第一原理那么$E_k^n$的测度是可以任意逼近$E'$的测度。那么对于任意的$\varepsilon/2$我们总是可以选择一个$N_{\varepsilon}$，以及一个k的子列$k_n$，使得$m(E'-E^n_{k_n})<\frac{1}{2^n}$以及$\sum_{n\geq N_{\varepsilon}}\frac{1}{2^n}<\frac{\varepsilon}{2}$，从而构造$$A'_{\varepsilon}:=\bigcap_{n\geq N_{\varepsilon}}E_{k_n}^n$$这样的构造能够满足$$m(E-A_{\varepsilon}')\leq \sum_{n\geq N_{\varepsilon}} m(E'-E^n_{k_n})<\frac{\varepsilon}{2}$$
再根据前面的分析我们就找到了对应的构造$A_{\varepsilon}$，从而证明了Egorov定理。

### 3.Lusin定理

>[!note] Lusin定理（1912）
> 假设$f$是一个Lebesgue可测函数，并且在一个有限测度（Lebesgue测度）集合$E\subset \mathbb{R}^d$上取值有限。那么对任意的$\varepsilon>0$存在一个闭集$F_{\varepsilon}$使得$$F_{\varepsilon}\subset E， m(E-F_{\varepsilon})<\varepsilon$$并且使得$f|_{F_{\varepsilon}}$是连续的。

* 此处要注意Lusin定理最后表述的为，$f$限制在$F_{\varepsilon}$上的时候连续，而不是在$x\in F_{\varepsilon}$的点上连续。这两者的区别在于拓扑的不同。我们从连续函数的拓扑定义上来看待这个问题的话，所谓$X\to Y$的连续函数$h$，指的是对任意拓扑空间$Y$当中的开集$V\subset Y$其原像$h^{-1}(V)$是拓扑空间$X$当中的开集。此处：
  1. 第一种情况下令$f|_{F_{\varepsilon}}=g$这是一个定义在$F_{\varepsilon}\to \mathbb{R}^d$的函数，其中$F_{\varepsilon}\subset \mathbb{R}$装备的是子集的拓扑。在这个拓扑当中对于$F_{\varepsilon}$当中的某个子集$W$，如果存在某个$\mathbb{R}^d$当中的开集$U\subset \mathbb{R}$使得$W$可以表示为$F_{\varepsilon}\cap U$那么$W$就是$F_{\varepsilon}$当中的开集。所以回到连续性上来说，现在只要对任意的$V\subset \mathbb{R}^d$都能使得$$g^{-1}(V):=\{x\in F_{\varepsilon}:f(x)\in V\}$$是$F_{\varepsilon}$当中的开集，那么$g$就是在$F_{\varepsilon}$上的连续函数。
  2. 第二种情况下，要求的是$f$在任意的$x\in F_{\varepsilon}$上保持$\mathbb{R}$的欧氏拓扑意义下的连续性。也就是说，对于任意$x\in F_{\varepsilon},f(x)=y$需要保证任意的关于$y$的开邻域$V_y\subset \mathbb{R}$其原像$f^{-1}(V_y)$是一个关于$x$的开邻域，即找到一个开邻域$U_x$使得$U_x=f^{-1}(V_y)$。
* 在度量空间当中我们也可以从点列的角度理解这件事：$f|_{F_{\varepsilon}}$的连续性指的是对任意$F_{\varepsilon}$上的序列$x_k$以及$x\in F_{\varepsilon}$，如果$x_k\to x$那么$f(x_k)\to f(x)$。也就是说，限制在$F_{\varepsilon}$上的连续性只用$F_{\varepsilon}$上点列和点来检验$f(x_k)\to f(x)$这一条规则即可。而如果是单纯考虑在整个度量空间$X$上的某个点$x\in F_{\varepsilon}$上连续，那么任意的$X$当中的序列$x_k$无论是否全部包含在$F_{\varepsilon}$上，只要$x_k\to x$那么一定需要保证$f(x_k)\to f(x)$。
