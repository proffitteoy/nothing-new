---
tags:
  - math
  - 实分析
---

> [!note] Lebesgue微分定理
> 如果$f \in L^1_{\text{loc}}(\mathbb{R}^m)$那么下面极限几乎处处成立：$$\lim_{\begin{aligned}m(B)&\to 0 \\x \in
> B\end{aligned}}\frac{1}{m(B)}\int_{B} f(y)dy = f(x)$$
> 即几乎所有点都是Lebesgue点。

-   **局部可积**:

这里没有必要用$L^1(\mathbb{R}^m)$这个条件，因为这里实际上只需要满足函数$f(x)\chi_{B}(x)$是可积的即可，也就是说在$\mathbb{R}^m$的任意球 $B$上|(或者说任意紧子集上)，函数可积就行。

比如函数$e^{|x|},\frac{1}{|x|^{1/2}}$或者非0的常函数是局部可积的，但是这两个函数却不是可积的。
### 1. 证明极限几乎处成立
1. **An epsilon of room** :要证明极限几乎处处成立，换句话来说就是证明不符合的集合的测度是零测度,即$$E=\left\{x:\limsup_{\begin{aligned}m(B)&\to 0 \\x\in
B\end{aligned}}\left|\frac{1}{m(B)}\int_{B}
f(y)dy-f(x)\right|>0\right\}$$然后发挥[[an epsilon of room]]的想法,先证明一个更具体的更容易操作的$E_{\alpha},\forall \alpha >0$的集合是零测度的。
$$E_{\alpha}=\left\{x:\limsup_{\begin{aligned}m(B)&\to 0
\\x\in B\end{aligned}}\left|\frac{1}{m(B)}\int_{B}
f(y)dy-f(x)\right|>2\alpha\right\}$$      这样一来由$E =\bigcup_{n=1}^{\infty}E_{1/n}$，我们可以证明$E$也是零测度的。

2. **但是究竟为什么构造上述的方式就可以让问题更具有可操作性?** **用连续函数做过渡**.这也是常用的技术，先尝试简单的类型，然后再推广到一般。对于连续函数$h(x)$对于任意包含此点的球 $B_x$，并且对于任意$\varepsilon >0$都存在$\delta_{\varepsilon}$使得$m(B_x)<\frac{\delta_{\varepsilon}}{2}$的球，都有：$$\begin{aligned}\left|h(x)-\frac{1}{m(B_x)}\int_{B_x}
h(y)dy\right| &\leq \frac{1}{m(B_x)}\int_{B_x} |h(x)-h(y)|dy
\\&< \varepsilon\end{aligned} $$因此对于连续函数来说：
$$\lim_{\begin{aligned}m(B)&\to 0 \\x\in
B\end{aligned}}\frac{1}{m(B)}\int_{B} h(y)dy = h(x)
$$    
3.  **用经典的三角不等式作为过渡** $$\begin{equation}\begin{aligned}\left|\frac{1}{m(B)}\int_{B}
f(y)dy-f(x)\right|&\leq \left|\frac{1}{m(B)}\int_{B}
f(y)-g_{\varepsilon}(x)dy\right|\\
&+\left|\frac{1}{m(B)}\int_{B}
g_{\varepsilon}(y)dy-g_{\varepsilon}(x)\right|+|g_{\varepsilon}(x)-f(x)|
\end{aligned} \end{equation}$$ 然后两边取上极限，于是我们可以消去中间第二项得到:$$\begin{aligned}\limsup_{\begin{aligned}m(B)&\to 0 \\x\in
B\end{aligned}}\left|\frac{1}{m(B)}\int_{B}
f(y)dy-f(x)\right|&\leq \limsup_{\begin{aligned}m(B)&\to 0
\\x\in B\end{aligned}}\left|\frac{1}{m(B)}\int_{B}
f(y)-g_{\varepsilon}(x)dy\right|\\ &+|g_{\varepsilon}(x)-f(x)|
\end{aligned} $$其中第一个不等式，满足这样不等式的元素x的集合为 $A_{\varepsilon}$：
$$\left|\frac{1}{m(B)}\int_{B}
f(y)-g_{\varepsilon}(x)dy\right| \leq \frac{1}{m(B)}\int_{B}
\left|f(y)-g_{\varepsilon}(x)\right|dy\leq
(f-g_{\varepsilon})^{*}(x)$$后者是Hardy - Littlewood maximum function(简而言之就是函数在某个点处的平均增长速率的上确界)，于是$$\begin{aligned}\limsup_{\begin{aligned}m(B)&\to 0 \\x\in
B\end{aligned}}\left|\frac{1}{m(B)}\int_{B}
f(y)dy-f(x)\right|&\leq
(f-g_{\varepsilon})^{*}(x)+|g_{\varepsilon}(x)-f(x)|
\end{aligned} $$注意我们现在依旧在考虑,$E_{\alpha}$的Lebesgue测度的问题。这里我们相当于放大了左边的不等式，那么相当于如果左边的部分满足$E_{\alpha}$当中的那个不等式，那么这些$x$也都能满足使得右边的部分都成立，具体来说就是:$$E_{\alpha} \subseteq \{x:\text{RHS } >2\alpha\}\subseteq
A_{\alpha} \cup
B_{\alpha}$$其中$A_{\alpha},B_{\alpha}$表示是右边式子分别大于$\alpha$的集合，那么只要后者分别都是零测度的，那么$E_{\alpha}$也是零测度的。这很简单，**因为两个正实数的和大于$2\alpha$那么必定推出其中有一个是严格大于$\alpha$的**，这种关系用集合表示便是上面的集合关系。（或者可以理解为**放大函数就是放大集合**）
4. Weak type估计:针对 $A_{\alpha},B_{\alpha}$这两个集合的测度的估计，我们有专门的的weak type的估计: ^410943
- 参考[[对Hardy-Littlewood Maximal函数的估计#1. 弱型估计]]:$$m(\{x\in\mathbb{R}^m:(f-g_{\varepsilon})^{*}(x)>\alpha\})\leq
    \frac{3^m}{\alpha}||f-g_{\varepsilon}||_{L^1}$$ ^efefcd
* 由Chebyshev不等式给出的 weak type 估计:$$m(\{x\in\mathbb{R}^m:|g_{\varepsilon}(x)-f(x)|
    >\alpha\})\leq
    \frac{1}{\alpha}||f-g_{\varepsilon}||_{L^1}$$
于是
$$m(E_{\alpha})\leq
\frac{1+3^m}{\alpha}||f-g_{\varepsilon}||_{L^1}$$现在我们可以调整$g_{\varepsilon}$，因为别忘了对于可积函数而言，对于任意$\varepsilon >0$都存在 $g_{\varepsilon}$，使得$||f-g_{\varepsilon}||_{L^1}<\varepsilon$。于是我们知道$m(E_{\alpha})$是零测度的集合。

### 2. 关于分布函数的补充

根据[[an epsilon of room证明集合为0测度的策略#0.1 函数的分布函数]]当中提到的函数的分布函数的概念，以及他们的性质，以及常用的weak-type估计，我们重新来审视1当中关于Lebesgue微分定理的证明，进一步我们可以简化整个证明，使得证明思路更为清晰。

首先定义$$J(x):=\limsup_{\begin{aligned}m(B_x)&\to 0 \\x\in
B_x\end{aligned}}\left|\frac{1}{m(B_x)}\int_{B_x}
f(y)dy-f(x)\right|$$
定义集合$E_{\alpha}:=\{|J| >2\alpha\}$,我们要求证$m(E_{\alpha})=0$,也就是要估计这个集合的在Lebesgue测度下的大小，那么在分布函数的语言下应当是考虑$(\mathbb{R}^n,\mathcal{L}(\mathbb{R}^n),m)$这个测度空间上的可测函数$h$的分布函数$$\lambda_{J}(2\alpha)=0,\forall \alpha>0$$
后来我们考虑了两个事情:
1. 首先对于紧支的连续函数$g$而言我们已经知道$\lambda_g(\alpha)=0$，那么我们考虑可以用逼近$f$的紧支的连续函数$g_{\varepsilon}$去做一个过渡。于是得到不等式的放缩:$$\begin{aligned}J(x)&\leq \limsup_{\begin{aligned}m(B)&\to 0
\\x\in B\end{aligned}}\left|\frac{1}{m(B)}\int_{B}
f(y)-g_{\varepsilon}(x)dy\right|\\ &+|g_{\varepsilon}(x)-f(x)|
\end{aligned} $$
2. 然后我们想到用Hardy-Littlewood极大函数做放缩，于是得到$$J(x)\leq(f-g_{\varepsilon})^{*}(x)+|g_{\varepsilon}(x)-f(x)|$$
3. 那么由分布函数的基本性质2我们可以知道$$\lambda_{J}(2\alpha)\leq \lambda_{RHS}(2\alpha)$$(这里RHS表示上面2.当中的不等式的右边的函数)然后由分布函数的基本性质4我们可以知道$$\lambda_{RHS}(2\alpha)\leq \lambda_{(f-g_{\varepsilon})^{*}}(\alpha)+\lambda_{g_{\varepsilon}(x)-f(x)}(\alpha)$$
4. Hardy-Littlewood极大函数的分布函数有估计$$\lambda_{k^{*}}(\alpha)\lesssim \frac{||k||_{L^1}}{\alpha} $$然后Chebyshev不等式告诉我们$$\lambda_k(\alpha)\leq  \frac{||k||_{L^1}}{\alpha}$$那么结合这两个条件我们得到了对$\lambda_{RHS}(2\alpha)$的估计$$\lambda_{RHS}(2\alpha)\lesssim \frac{||f-g_{\varepsilon}||_{L^1}}{\alpha}\lesssim \frac{\varepsilon}{\alpha},\forall \varepsilon>0$$
5. 于是最后我们得到结论，对于任何给定的$\alpha>0$都有$$\lambda_{J}(2\alpha)\leq \lambda_{RHS}(2\alpha)=0$$也就是说$m(E_{\alpha})=0$。于是得到结论$E$是一个零测度的集合。

以上就是在测度函数的语言下重新叙述Lebesgue微分定理的证明。

### 3. Lebesgue密度定理

Lebesgue微分定理有一个有趣的推论，如果我们把函数$f$变成某个==可测集合==$A$的特征函数$1_{A}$，那么微分定理就变成了$$\lim_{\begin{aligned}m(B)&\to 0 \\x \in
B\end{aligned}}\frac{1}{m(B)}\int_{B} 1_A(y)dy = 1_A(x)$$几乎处处成立。

再把上面的过程改写一下就变成了在测度空间$(\mathbb{R}^n,\mathcal{L},m)$中任意$A\in \mathcal{L}$都有$$\lim_{\begin{aligned}m(B)&\to 0 \\x \in
B\end{aligned}}\frac{m(A\cap B)}{m(B)}=1_A(x)$$几乎处处成立。我们可以把左边的极限记为$d_A(x)$称其为$x$关于集合$A$的密度。这个结果告诉我们：

> [!note] Lebesgue密度定理
> 集合$A$是$\mathbb{R}^n$当中Lebesgue可测的子集，那么对于几乎所有点而言$$d_A(x)=1_A(x)\text{ for a.e. }x\in \mathbb{R}^n$$
> 
> 一般来说如果一个点$x$对应的$d_A(x)=1$那么我们一般称其为"集合A的密度点"或者说a point of density for A。

* 密度点直观上理解比较类似于“内部的点”，而$d_A(x)=0$的点则更像是“外部点”，而如果$0<d_A(x)<1$那么则比较类似于"边界上的点"。比如说对于$0\in \mathbb{R}$而言，如果$A_1=[1,2]$那么由于$$d_{A_1}(0):=\lim_{r\to 0^{+}}\frac{m(A_1\cap [-r,r])}{2r}=0$$所以从Lebesgue密度上来说，0是$A_1=[1,2]$的“外部点”。然而如果考虑$A_2=[-1,1]$,那么我们会发现$d_{A_2}(0)=1$,即0是$A_2=[-1,1]$的“内部点”。而如果考虑$A_3=[0,1]$那么我们会发现$d_{A_3}(0)=\frac{1}{2}$是“边界点”。

