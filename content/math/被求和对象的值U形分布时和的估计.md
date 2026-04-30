---
tags:
  - math
  - 大学数学竞赛
---

> [!question] 问题0 
> $$S_n:=\sum_{k=2}^{n-1}\frac{1}{(n-k)\log(k)}$$求$$\lim_{n\to \infty}S_n$$

### 1. 分段估计思路

倒着表示原本的和$$S_n=\sum_{j=1}^{n-2} \frac{1}{j\log(n-j)}$$
很容易给出$S_n$的一个下界$$S_n \geq \frac{1}{\log(n)}\sum_{j=1}^{n-2}\frac{1}{j}\geq 1$$接下来我们讨论其上界。根据序列$\frac{1}{j\log(n-j)}$的值的分布情况

![[jln(n-j)倒数的值的分布.png]]

我们把$j$所在的整数区间切成三段$$\sum_{j=1}^{n-2}*=\sum_{j=1}^{M_n}*+\sum_{j=M_n+1}^{n-M_n}*+\sum_{j=n-M_n+1}^{n-2}*=T_{1,n}+T_{2,n}+T_{3,n}$$
这三个和由于被求和对象值的分布情况各不相同，因此我们的估计方法也采用不同的策略：

* 第一段首先对$M_n$做一个粗糙的限制$M_n<\frac{n}{2}$于是$$\begin{aligned}T_{1,n}&=\sum_{j=1}^{M_n} \frac{1}{j\log(n-j)}\\&\leq \frac{1}{\log(n-M_n)}\sum_{j=1}^{M_n}\frac{1}{j}\\&=\frac{H_{M_n}}{\log(n-M_n)}\\&=\frac{\log(M_n)+O(1)}{\log(n)+\log(1-\frac{M_n}{n})}\\ &\leq \frac{\log(M_n)}{\log(n)}+O(\frac{1}{\log(n)})\end{aligned}$$
* 第二段$$\begin{aligned}T_{2,n}&=\sum_{j=M_n+1}^{n-M_n}\frac{1}{j\log(n-j)}\\&\leq \frac{1}{\log(M_n)}(H_{n-M_n}-H_{M_n})\\&= \frac{\log(\frac{n}{M_n}-1)}{\log(M_n)}+O(\frac{1}{\log(M_n)})\end{aligned}$$
* 第三段$$\begin{aligned}T_{3,n}&=\sum_{j=n-M_n+1}^{n-2}\frac{1}{j\log(n-j)}\\&\leq \frac{M_n-2}{(n-M_n)\log(2)}\\&\leq \frac{M_n}{n-M_n}\end{aligned}$$
把以上三者合并起来，并希望三段的上界为$1+o(1)$。

1. 如果$M_n=cn,\quad c\in (0,\frac{1}{2})$，那么$$S_n \leq [1+o(1)]+[o(1)]+\frac{c}{1-c}$$于是$$\limsup_{n\to \infty} S_n\leq 1+\frac{c}{1-c},\quad \forall c \in (0,\frac{1}{2})$$由于$\frac{c}{1-c}$可以任意小，于是$$\limsup_{n\to \infty} S_n\leq 1$$问题解决。
2. 如果$M_n=\sqrt{n}$那么$$S_n\leq [\frac{1}{2}+o(1)]+[1+o(1)]+[o(1)]$$这样的放缩太大了。即相较于任意的$cn$而言$\sqrt{n}$实在是太小了,事实上任意的$n^{\alpha},\quad \alpha \in (0,1)$都太小了。
3. 如果$M_n=\frac{n}{\log(n)}$那么$$S_n\leq [1+o(1)]+[o(1)]+[o(1)]$$于是问题被解决。

综上所述$$\lim_{n\to \infty} S_n =1$$


### 2. 一个类似的问题

> [!question] 问题2.1 
> 求极限$$\lim_{n\to \infty} \frac{\log^2(n)}{n}\sum_{k=2}^{n-2}\frac{1}{\log(k)\log(n-k)}$$

根据被求和对象进行估计。

![[log k log n-k 倒数的图像.png]]

首先来估计下界令$$A_n:=\frac{\log^2(n)}{n}\sum_{k=2}^{n-2}\frac{1}{\log(k)\log(n-k)}\geq\frac{\log^2(n)}{n} \frac{n-3}{\log^2(n-2)}$$于是我们知道$$\liminf_{n\to \infty} A_n\ge 1\tag{1}$$接下来我们仿照第一节的三段估计来得到$A_n$的上界。$$\sum_{k=2}^{n-2}*=\sum_{k=2}^{M_n}*+\sum_{k=M_n+1}^{n-M_n}*+\sum_{k=n-M_n+1}^{n-2}*=Q_{1,n}+Q_{2,n}+Q_{3,n}$$同样的道理我们设置一个$M_n<\frac{n}{2}$然后分别对这三段做估计:

* 第一段$$\begin{aligned}\sum_{k=2}^{M_n}\frac{1}{\log(k)\log(n-k)}&\leq \frac{1}{\log(n-M_n)}\frac{M_n-1}{\log(2)}\end{aligned}$$
* 第二段$$\sum_{k=M_n+1}^{n-M_n}\frac{1}{\log(k)\log(n-k)}\leq \frac{n-2M_n-1}{\log(M_n)\log(n-M_n)}$$
* 第三段$$\sum_{k=n-M_n+1}^{n-2}\frac{1}{\log(k)\log(n-k)}\leq \frac{1}{\log(n-M_n)}\frac{M_n-1}{\log(2)}$$
整理上面三段的证明，我们可以得到$$A_n \leq \frac{\log^2(n)}{n}\left(\frac{2}{\log(2)}\frac{M_n-1}{\log(n-M_n)}+\frac{n-2M_n-1}{\log(M_n)\log(n-M_n)}\right)$$
现在我们需要一个合适的$M_n$从而使得上界估计的精度能达到我们的目标。
1. 令$M_n=cn,\quad c\in (0,1/2)$此时由于$$B_n:=\frac{\log^2(n)}{n}\frac{2}{\log(2)}\frac{M_n-1}{\log(n-M_n)}=\frac{\log^2(n)}{n}\frac{2cn+O(1)}{O(1)+\alpha \log(n)}$$这部分的误差根本控制不住。所以这种$M_n$不符合我们的要求，我们需要更小的$M_n$。
2. 令$M_n=\sqrt{n}$，此时$$\frac{\log^2(n)}{n}\frac{2}{\log(2)}\frac{M_n-1}{\log(n-M_n)}=o(1)$$然后看中间的部分$$C_n:=\frac{\log^2(n)}{n}\frac{n-2M_n-1}{\log(M_n)\log(n-M_n)}=\frac{\log^2(n)}{n}\frac{n-2\sqrt{n}-1}{\frac{1}{2}\log(n)\log(n-\sqrt{n})}$$不过这样的话，我们最后会得到$$\limsup_{n\to \infty}A_n \leq 2$$这样看来虽然$\sqrt{n}$可以克服两边的误差太大的困难，但是又太小了，以至于中间这一部分的误差太大。这暗示我们需要选择一个介于任意$cn,\quad c\in(0,1/2)$与任意$n^{\alpha},\quad \alpha \in (1/2,1)$之间的一个$M_n$。
3. 考虑$M_n=\frac{n}{\log(n)}$此时两边的误差$$B_n\leq \frac{2}{\log(2)}$$这个时候两边的误差虽然是有限的，但不是无穷小，离我们理想的目标还是有一些距离。所以我们应该找比$\frac{n}{\log(n)}$还要小一些，但是比任意$n^{\alpha},\quad \alpha \in (1/2,1)$都要大的$M_n$。
4. 通过考虑$\frac{n}{\log^{r}(n)},r>1$我们最终确定$r=2$的时候是合适的，即$$M_n := \frac{n}{\log^2(n)}$$此时两边部分的误差$$B_n=o(1)$$中间的部分$$C_n=\frac{\log^2(n)}{n}\frac{n+o(n)}{\log^2(n)+o(n)}$$于是根据$A_n \leq B_n+C_n$我们得到$$\limsup_{n\to \infty} A_n \leq 1$$从而结合$(1)$我们知道$$\lim_{n\to \infty} A_n =1$$

### 3. 利用相似渐进的想法来解决问题

参考[[利用已知的渐近结果求渐近展开的技巧]]的想法，对于“问题0”我们把$S_n$改写为$$S_n=\sum_{j=1}^{n-2} \frac{1}{j\log(n-j)}=\sum_{j=1}^{n-2}\frac{1}{j}\frac{1}{\log(n)+\log(1-\frac{j}{n})}\tag{2}$$如果我们可以猜到$S_n$的极限为$1$，那么通过这个式子便能想到，如果把上式的分母中的$\log(1-\frac{j}{n})$去掉，那么$$S_n'=\sum_{j=1}^{n-2}\frac{1}{j}\frac{1}{\log(n)}=\frac{H_{n-2}}{\log(n)}=1+O\left(\frac{1}{\log(n)}\right)\tag{3}$$想要确认$S_n'$就是$S_n$渐进展开的主要部分，那么我们还必须确认二者之间的误差至少是$o(1)$的才行，也就是估计$|S_n-S_n'|$。

$$\begin{aligned}|S_n-S_n'|&=\sum_{j=1}^{n-2}\frac{1}{j}\left(\frac{1}{\log(n-j)}-\frac{1}{\log(n)}\right)\\&=\frac{1}{\log(n)}\sum_{j=1}^{n-2}\frac{-\log(1-\frac{j}{n})}{j\log(n-j)}\\&\leq \frac{1}{\log(n)\log(2)}\sum_{j=1}^{n-2}-\frac{1}{j}\log(1-\frac{j}{n})\end{aligned}$$由于最后的和$$\sum_{j=1}^{n-2}-\frac{1}{j}\log(1-\frac{j}{n})\to \int_{0}^{1}-\frac{\log(1-x)}{x}\,dx=\frac{\pi^2}{6}$$是收敛的，于是根据极限的定义，对于足够大的$n$最后这个和一定是有限的，于是我们知道$$|S_n-S_n'|=O\left(\frac{1}{\log(n)}\right)$$于是结合$(3)$我们知道$$S_n=1+O\left(\frac{1}{\log(n)}\right)$$

---

对于“问题2.1”也可以这样做。令$a_n=\frac{\log^2(n)}{n}$于是$$A_n:=a_n\sum_{k=2}^{n-2}\frac{1}{\log(k)\log(n-k)}=a_n\sum_{k=2}^{n-2}\frac{1}{\log(k)(\log(n)+\log(1-\frac{k}{n}))}$$如果我们单独考虑$$\begin{aligned}A_n'&=a_n\frac{1}{\log(n)}\sum_{k=2}^{n-2}\frac{1}{\log(k)}\\&= \frac{\log(n)}{n}\left(\text{Li}(n-2)+O(1)\right)\\&=1+O\left(\frac{1}{\log(n)}\right)\end{aligned}$$
* 这里对$\sum_{k=2}^{n-2}\frac{1}{\log(k)}$的估计是做了一个简单积分估计，其中积分部分是一个著名的特殊函数$$\text{Li(x)}:=\int_{2}^{x} \frac{1}{\log(t)}\,dt = \frac{x}{\log(x)}\sum_{m\geq 0}\frac{m!}{\log^m(x)}$$
于是只要我们可以证明$|A_n-A_n'|=o(1)$我们便可以完成整个估计。

$$\begin{aligned}|A_n-A_n'|&=\frac{\log(n)}{n}\sum_{k=2}^{n-2} \frac{-\log(1-\frac{k}{n})}{\log(k)\log(n-k)}\end{aligned}$$

考虑到被求和对象是单调增加的，因此不妨做一个分段估计。此外被求和对象的大值主要集中在靠近$n$这一端，因此选择分段估计的时候应该是前半段长，后半段短的方式来进行。

我们假设后半段的长度为$L_n$，此外$K_n=n-L_n$这样我们把整数分为两个部分$[2,K_n]$以及$[K_n+1,n-2]$。这里先对$L_n$设置一个粗糙的估计$L_n>\frac{1}{2}n$后面再根据具体情况做进一步调整。


* 前半段当$\log(n-k)\geq \log(L_n)$于是$$\sum_{k=2}^{K_n}*\leq \frac{\log(n)}{n\log(L_n)}\sum_{k=2}^{K_n}\frac{-\log(1-\frac{k}{n})}{\log(k)}\tag{4}$$观察此式子右边的和，我们可以把被求和对象看成是两个序列$-\log(1-\frac{k}{n}),\frac{1}{\log(k)}$的乘积的和，并且这两个序列各自都是单调序列，并且二者序列的单调性相反，此外这两个序列各自单独组成的和的估计我们已知：$\sum_{k}-\log(1-\frac{k}{n})$可以借助黎曼和做估计，而$\sum_k \frac{1}{\log(k)}$上文已道明其估计。于是我们可以借助[Chebyshev's sum inequality](https://en.wikipedia.org/wiki/Chebyshev%27s_sum_inequality)来给出其上界估计。$$\frac{1}{n}\sum_{k=2}^{K_n}\frac{1}{\log(k)}\cdot\left(-\log(1-\frac{k}{n})\right)\leq \left(\frac{1}{n}\sum_{k=2}^{K_n}\frac{1}{\log(k)}\right)\left(\frac{1}{n}\sum_{k=2}^{K_n}-\log(1-\frac{k}{n})\right)$$于是结合$(4)$我们得到$$\sum_{k=2}^{K_n}*\lesssim \frac{\log(n)}{n\log(L_n)}\cdot \frac{n}{\log(K_n)}=\frac{\log(n)}{\log(L_n)\log(K_n)}\tag{5}$$
* 后半段的估计：此时$k\in[n-L_n+1,n-2]$这一段中，我们由于$L_n$取得比较小，因此打算借助整个被求和对象得单调性，用最大取值乘上长度$L_n-2$从而得到估计。$$\sum_{K_n+1}^{n-2}*< \frac{\log(n)}{n}\cdot L_n \frac{\log(n/2)}{\log(n-2)\log(2)}\lesssim L_n \frac{\log(n)}{n}\tag{6}$$
综合以上两段估计，为了让第二段为$o(1)$，我们可以考虑$L_n:=\frac{n}{\log^2(n)}$如此一来根据$(5),(6)$便有$$\sum_{K_n+1}^{n-2}*= O(\frac{1}{\log(n)})$$然后带入$L_n$到第一段有$$\sum_{k=2}^{K_n}*=O(\frac{1}{\log(n)})$$于是结合前文对$A_n'$的估计，我们知道$$A_n = 1+O\left(\frac{1}{\log(n)}\right)$$

