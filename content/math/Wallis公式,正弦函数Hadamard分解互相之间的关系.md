---
tags:
  - math
  - 复分析
  - 微积分
---

### 1. Wallis公式和Hardamard分解定理之间的联系:
$$\sin(\pi z)=\pi z\prod_{n\geq1}\left(1-\frac{z^2}{n^2}\right)$$此式子当中令$z =1/2$，那么会得到
$$\frac{\pi}{2}= \prod_{n \geq 1} \frac{2 n}{2 n-1} \frac{2n}{2n+1}$$只不过直接从Hardamard分解得到的是一个上下颠倒的结果，两边翻转过来便是。

不过最好不用Wallis公式证明$\sin(\pi z)$的Hadamard分解，而是使用别的办法得到此，然后用Wallis公式得到Hadamard分解，因为我们需要Wallis公式去确定Hadamard分解当中的多项式的某个系数。

### 2.利用含参数积分的递推表达证明Wallis公式:

这里我们也不用Stirling公式得到Wallis公式，因为在我们的体系当中通常用Wallis公式的结果取得到Stirling公式的那个系数。顺带一提，Wallis公式和Stirling公式的关联性主要体现在
$$
\frac{\pi}{2}= \prod_{n \geq 1} \frac{2 n}{2 n-1} \frac{2 n}{2n+1}= \lim_{n \to +\infty}\frac{1}{2 n+1} \cdot \frac{2^{4n}(n !)^4}{[(2 n) !]^2}
$$

所以为了避免循环证明，这里利用与之有关的一个含参数的积分。

令$W_n = \int_{0}^{\pi/2}\sin(x)^ndx$,利用分部积分得到其递推表达:
1.  
$$W_{2N} = \frac{\pi}{2}\prod_{n\leq N}\frac{2n-1}{2n}  $$
2.  $$W_{2N+1} = \prod_{n\leq N}\frac{2n}{2n+1} $$
因此可以得到Wallis公式的右边无非就是
$$\frac{2}{\pi}\lim_{N\to\infty}\frac{W_{2N+1}}{W_{2N}}$$而这其中,通过积分的定义可以确定，$W_n$是一个不增的序列于是:
$$1\geq \frac{W_{2N+1}}{W_{2N}}\geq \frac{W_{2N+1}}{W_{2N-1}}=\frac{2N}{2N+1} $$

两边同时取极限，得到
$$\lim_{N\to\infty}\frac{W_{2N+1}}{W_{2N}}=1$$于是便证明了Wallis公式。

### 3.由Wallis公式得到$\sin(\pi z)$的Hadamard分解

1.  Hadamard分解定理:$$\sin(\pi z)=e^{g(z)}z^m\prod_{n=1}^{\infty}E_k\left(z/z_n\right)$$因为这个函数的零点就是全体的整数。$k = \lfloor \rho\rfloor$，$\rho$是函数的增长阶其中$E_k(w)$是Canonical factor，其形式为，
$$
E_0(w)=1-w \quad \text{and}\quad
    E_k(w)=(1-w) e^{w+w^2 / 2+\cdots+w^k /
    k}
$$
$g(z)$是一个至多不过$k$阶的多项式。$z_n$是函数的零点，取遍全体整数，除了0。
2.  Canonical factors相乘的结果:我们知道对于当前这个函数而言，其增长阶为$\rho=1$,于是$k=1$所以$E_1(z/n)=\left(1-\frac{z}{n}\right)e^{\frac{z}{n}}$,那么
$$
\prod_{n\neq
    0}E_1\left(z / n\right) = \prod_{m\geq 1}
    \left(1-\frac{z}{m}\right)\left(1+\frac{z}{m}\right)e^{\frac{z}{m}}e^{-\frac{z}{m}}
    = \prod_{m\geq 1}\left(1-\frac{z^2}{m^2}\right)
$$
3.  确定多项式:
    因为可以确定这个多项式至多1阶，那么不妨假设为$g(z)= az+b$，然后其余部分现在已经确定(m = 1因为0处是一阶零点)，我们可以通过该函数的值来确定这两个系数。首先
$$
\pi
    = \lim_{z\to 0}\frac{\sin(\pi z)}{z} = e^b
$$
然后令$z =1/2$，那么会得到$$1=\frac{\pi}{2} e^a \prod_{m\geq
    1}\left(1-\frac{1}{2m}\right)\left(1+\frac{1}{2m}\right)$$由Wallis公式的结果，得到$$e^a
    = 1
$$
于是便知道这个多项式实际上是一个常数$g(z)=\log(\pi)$。

### 4.从另一个角度得到分解

当然以上分解也有从别的角度入手的，比如说通过
$$
\pi \cot \pi z=\frac{1}{z}+\sum_{n=1}^{\infty} \frac{2z}{z^2-n^2}$$因为如果这样，令$G(z) = \frac{\sin(\pi z)}{\pi},P(z) = z\prod_{n\geq 1}\left(1-\frac{z^2}{n^2}\right)$,那么可以如果可以证明$G(z)/P(z)=1$那么问题便解决了，而证明这件事首先要证明这俩的商是常数，于是便考虑微分。这个想法很自然，因为他们的零点可以互相抵消，而且$z\to 0$的时候的确$G(z)/P(z) \to 1$,所以只要证明微分是0即可。
$$\left(\frac{P(z)}{G(z)}\right)^{\prime}=\frac{P(z)}{G(z)}\left[\frac{P^{\prime}(z)}{P(z)}-\frac{G^{\prime}(z)}{G(z)}\right]=0$$其中

1.  $$\frac{G^{\prime}(z)}{G(z)}=\pi\cot\pi z$$
2.  $$\frac{P^{\prime}(z)}{P(z)}=\frac{1}{z}+\sum_{n=1}^{\infty} \frac{2 z}{z^2-n^2}$$

所以其实就是等价于上面的级数。

顺便一提上面的式子关于$\pi\cot(\pi z)$的展开可以用来证明$\zeta(2)= \frac{\pi^2}{6}$,只要令$z \to 0$然后交换级数和极限的次序。