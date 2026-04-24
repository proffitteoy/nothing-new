---
tags:
  - math
  - 概率论
  - 实分析
---

> [!note] weierstrass逼近定理
> $f\in C([0,1]\to \mathbb{R})$可以被同样定义在$[0,1]$上的实系数多项式一致逼近。

1. 这个命题对实数上的任意闭区间$[a,b]$也是成立的，不失一般性我们只证明$[0,1]$上的情况，其他情况可以由这个结果通过伸缩去推广得到。 
2. 实际上命题对于值域为复数的连续函数也成立，即$f\in C([0,1]\to \mathbb{C})$的话存在一个复系数的多项式一致收敛到函数。因为这种复值得函数其实部与虚部分别为两个连续的实值函数，那么两个部分分别存在一致收敛的多项式函数列逼近，这就使得存在一个复系数的多项式函数列一致逼近$f$.
3. 不过从概率的途径证明这个结果实际上沿用的是Bernstein 1912年的证明方法。这是一个构造性的方法，实际上这个结果要比Weierstrass原本的结果要强，因为这个办法给出了构造这种一致逼近给定连续函数的方法。

在讨论概率方法之前我们先用测度论的语言描述一下基本的设定,比如什么叫做 

=="考虑概率空间上的一列独立同分布的符合Bernoulli(p)分布的随机变量。"==

### 1. 用测度语言描绘问题的基本设定

当我们考虑概率问题的时候通常会设置一个原始的概率空间，这本质上是一个测度空间$(\Omega,\mathcal{F},P)$，其中$P$这个测度满足$P(\Omega)=1$称之为概率测度。

然后此时定义一个$X(\omega):\Omega\to \mathbb{R}$的Borel可测函数，这个函数称之为随机变量。

对于通常的概率问题，我们通常只关心这个函数的值的分布上的信息，而不去考虑函数的全部细节。通常来说，我们不会特别关注原始的概率空间$(\Omega,\mathcal{F},P)$的细节，只要它能保证是一个概率空间。

具体来说，对于随机变量$X$(也就是这种Borel可测函数)定义$E = X(\Omega)$为此随机变量的像，我们都可以考虑一个新的可测空间$(\mathbb{R},\mathcal{B}(\mathbb{R}))$,以及在这个空间上的随机变量值的分布所定义出来的测度$P_X$.于是无论原始概率空间是如何具体定义的，只要随机变量值域也就是实数上值的分布是所确定下来的测度是$P_X$，那么我们最终大多数概率问题的结果都是等价的。也就是说我们通过考虑随机变量$X$的值的分布，我们把原本$(\Omega,\mathcal{F},P)$上的问题转换为了$(\mathbb{R},\mathcal{B}(\mathbb{R}),P_X)$上的问题。


#### 1.1 随机变量的分布是什么

那么$P_X$是如何被定义的呢?具体的来说，对任意$A\in \mathcal{B}(\mathbb{R})$我们定义一个测度
$$P_X(A):=P(\{x\in \Omega:X(\omega)\in A\})$$

再抽象一点的话我们实际上是把随机变量$X$当成一个连接$\Omega$与实数$\mathbb{R}$的桥梁，从而定义了一个pushforward测度。

> [!note] pushforward测度
> 设$(X,\mathcal{A},\mu)$是一个测度空间,$T:X\to Y$是一个从$X$到集合$Y$的可测函数($\mu$可测)。对于$Y$上的一个sigma代数$\mathcal{B}$定义pushforward测度$T_{*}\mu$为$Y$上的一个测度，满足任意$B\in \mathcal{B}$都有$$T_{*}\mu(B):=\mu(T^{-1}(B))$$其中$T^{-1}(B)$是集合$B$在$T$下的原像，因此这种测度也称之为像测度。

按照定义，可以理解为$$P_X(A):=X_{*}P(A)=P(X^{-1}(A))$$
#### 1.2 两个随机变量同分布是什么意思?

我们现在已经知道分布具体指的是由随机变量所定义出来的pushforward测度$P_X(A):=X_{*}P(A)=P(X^{-1}(A))$.那么同分布指的是什么呢？一般来说有两种语境：

* **没有说明概率空间的情况下，当我们提及符合某种分布的随机变量的时候**：
比如说，考虑一个符合Bernoulli(p)的随机变量$Y$。那么在这个语境下，$E=\{0,1\}$是$Y$的像,我们只需要考虑$E$当中每个元素的pushforward测度$$P_Y(\{0\})=1-p,P_Y(\{1\})=p$$
下面考虑两个符合Bernoulli(p)但是不在同一个原始的概率空间的随机变量。

> [!example] 例子1
> 考虑概率空间$(\{0,1\},\mathcal{P}(\{0,1\}),P_0)$，其中sigma代数是$\{0,1\}$的幂集，概率测度定义为$P_0(\{0\})=1-p,P_0(\{1\})=p$.在此基础上考虑一个符合Bernoulli(p)的随机变量$$Y_1(\omega):=\begin{cases}0& \omega =0\\ 1&\omega =1\end{cases}$$也就是说，这是一个恒等映射。于是可以定义出pushforward测度，$$P_{Y_1}(\{0\})=P(Y_1=0)=P(\{0\})=1-p$$
> 以及$$P_{Y_1}(\{1\})=P(Y_1=1)=P(\{1\})=p$$

> [!example] 例子2
> 考虑概率空间$([0,1],\mathcal{B}([0,1]),m)$其中sigma代数是在闭区间上定义的Borel sigma代数，概率测度此时设定为实数的Lebesgue测度$m$.在此基础上考虑一个符合Bernoulli(p)的随机变量$$Y_2(\omega):=\begin{cases}0& 1\geq \omega >p\\ 1& p\geq \omega \geq 0 \end{cases}$$此时pushforward测度为$$P_{Y_2}(\{0\})=m((p,1])=1-p$$以及$$P_{Y_2}(\{1\})=m([0,p])=p$$

这两个例子告诉我们，在没有明确提及原始概率空间的意义下谈论符合某种分布的随机变量具体说的是他们由随机变量定义出得pushforward测度是一样的，原始得概率空间以及随机变量的具体定义方式可能都是完全不一样的。

* **在一个给定的概率空间上考虑多个随机变量**。

这种情况下原始的概率空间是确定的，不过随机变量可能在具体某个点的取值上是有区别的。比如说

> [!example] 例子3
> 在例子2的基础上考虑$$Y_3(\omega):=\begin{cases}0& \omega \in [p,1]-\{\frac{1+p}{2}\}\\ 1& \omega \in [0,p) \cup \{\frac{1+p}{2}\}\end{cases}$$此时pushforward测度为$$P_{Y_2}(\{0\})=m([p,1]-\{\frac{1+p}{2}\})=1-p$$以及$$P_{Y_2}(\{1\})=m([0,p) \cup \{\frac{1+p}{2}\})=p$$

我们发现如果我们在定义随机变量的时候进行类似于例子3的操作，也就是给某个值的原像增加或者减少一个Lebesgue零测度的集合，此时并不会影响最后的pushforward测度的定义。

实际上"同分布"的条件要比“几乎处处”相等要弱得多，甚至存在[[几乎处处不相等但是同分布的随机变量]]的例子存在。

#### 1.3 同分布的一列Bernoulli随机变量

现在我们考虑在$(\Omega,\mathcal{F},P)$上的一列可测函数列$X_n(\omega)$,这一列Borel可测函数都有相同的分布(此时的语境显然符合上一节提到的第二种情况)。

具体的来说，我们用随机变量定义一系列相同的$\Omega \to E=\{0,1\}$的pushforward测度
$$P_X:=X_{n*}P$$
实际上就是$P_X(\{0\})=1-p,P_X(\{1\})=p$.

#### 1.3 独立的两个随机变量

独立性原本指的是概率空间$(\Omega,\mathcal{F},P)$的sigma代数上的两个元素$A_1,A_2 \in \mathcal{F}$他们测度的一个性质，$P(A_1\cap A_2)=P(A_1)P(A_2)$.对于两个随机变量而言，独立性意味着他们任意的原像作为$\mathcal{F}$的元素是独立的。

> [!note] 随机变量的独立性
> 当我们说两个此空间上的随机变量$X,Y$互相独立的时候指的$\forall B_1,B_2 \in \mathcal{B}(\mathbb{R})$都有$\mathcal{F}$当中的两个元素$X^{-1}(B_1),Y^{-1}(B_2)$的独立。也就是说$$P(X^{-1}(B_1)\cap Y^{-1}(B_2))=P(X^{-1}(B_1))P(Y^{-1}(B_2))$$

> [!note] 两个随机变量的联合概率分布
> 如果我们从更为广义角度来理解随机变量，把$$Z(\omega)=(X(\omega),Y(\omega))$$这种随机向量也当成随机变量来看待，那么按照由随机变量定义出来的pushforward测度的定义，我们可以定义一种由$Z:\Omega\to\mathbb{R}\times \mathbb{R}$给出来的pushforward测度$P_Z:=Z_{*}P$.
> 此时定义值域上的product sigma代数为$\mathcal{B}(\mathbb{R}) \otimes \mathcal{B}(\mathbb{R})$那么其中任意元素$B_1\times B_2$的$P_Z$测度被定义为$$P_Z(B_1\times B_2)=P((X,Y)\in B_1\times B_2)=P(X\in B_1 \cap Y\in B_2 )$$

那么在联合概率分布的意义下，上述关于两个随机变量$X,Y$的独立性还可以理解为$$P_Z(B_1\times B_2) = P_X(B_1) \cdot P_Y(B_2)$$
#### 1.4 n个独立同分布的Bernoulli(p)随机变量的平均值

> [!question] 问题
> 考虑概率空间$(\Omega,\mathcal{F},P)$上的n个满足bernoulli(p)分布的独立同分布的随机变量$X_1,...,X_n$，考虑其“平均值”$$Y_n = \frac{X_1+...+X_n}{n}$$的分布。

首先来看随机变量$Y_n$的值域。显然$Y_n \in E=\{0,\frac{1}{n},...,\frac{k}{n},...,1\}$。那么接下来就需要考虑从$\Omega\to E$的由$Y_n$定义下来的pushforward测度，也就是它的分布。为了讨论的方便，我们定义一个n元函数$g(x_1,...,x_n) = \frac{x_1+...+x_n}{n}$这是一个从$\{0,1\}^n \to E$的映射。

$$\begin{aligned}P_{Y_n}\left(\{k/n\}\right)&=P(g(X_1,...,X_n)=k/n) \\ &= P((X_1,...,X_n)=g^{-1}(k/n)) \\ &= \sum_{\begin{aligned}(x_1,...,x_n)&\in \{0,1\}^n\\x_1+...+x_n&= k\end{aligned}}P(X_1=x_1)\cdots P(X_n=x_n)\\ &= \binom{n}{k}p^k(1-p)^{n-k}\end{aligned}$$
其中第二步到第三步我们利用了随机变量的独立性，第三步到最后一步利用了随机变量是同分布的特性。

#### 1.5 $Y_n$的期望

随机变量的期望实际上就是随机变量在原始的测度空间$(\Omega,\mathcal{F},P)$上的积分。这里暂且不去讨论更为复杂的情况，对于$Y_n$而言，其本身就可以定义为$\Omega$上的一个简单函数,因为其值域是有限的。$$Y_n(\omega)=\sum_{k=0}^{n}\frac{k}{n} \mathbf{1}_{Y_n=k/n}(\omega)$$
那么它的积分也就是对简单函数的积分，$$\begin{aligned}E(Y_n)=\int_{\Omega}Y_n(\omega)\,dP &= \sum_{k=0}^{n} \frac{k}{n}P({Y_n=k/n})\\&=\sum_{k=0}^{n} \frac{k}{n}\binom{n}{k}p^k(1-p)^{n-k}\\&=p\end{aligned}$$
接下来回到Weierstrass定理的证明上，我们考虑Weierstrass定理当中的定义在$[0,1]$上的函数$f$复合在$Y_n$上之后的新的随机变量的期望。

#### 1.6 $f(Y_n)$的期望

在pushforward测度的意义下我们可以定义函数积分的换元公式。

> [!note] 积分换元
> 设$(X,\mathcal{A},\mu)$是一个测度空间,$T:X\to Y$是一个从$X$到集合$Y$的可测函数，$T_{*}\mu$为pushforward测度，函数$g$是$Y$上的一个可积函数，那么$$\int_{Y}g\,d(T_{*}\mu)=\int_X g\circ T\,d\mu$$

那么在当前的情形下，我们计算$f(Y_n)$的期望实际上就是计算$E(f(Y_n))=\int_{\Omega} f\circ Y_n \,dP$，那么按照换元公式，按照前面的假设令$E$是$Y_n$的值域$$\begin{aligned}\int_{\Omega} f\circ Y_n \,dP &= \int_{E} f\,d Y_{n*}P \\ &= \int_{E} f\,d P_{Y_n} \\&= \sum_{y\in E} f(y)P_{Y_n}(y)\\ &= \sum_{k=0}^{n} f\left(\frac{k}{n}\right)\binom{n}{k}p^k(1-p)^{n-k} \\ &= B_n(p)\end{aligned}$$这里最后的结果$B_n(p)$被称之为Bernstein多项式。



### 2. 收敛性的讨论与Bernstein的动机

对于任意$p\in [0,1]$,首先因为$Y_n$的期望为$p$,那么由[[Borel-Cantelli lemma证明某种版本下的强大数定律]]当中提到的弱大数定律可知，$Y_n$依照测度收敛于期望$p$,记为$Y_n\xrightarrow{P}{p}$.其次由[[有限测度空间上依测度收敛的等价命题]]最后提到的结论，对于连续函数而言既然$Y_n$依照测度收敛于期望$p$,那么新的随机变量$f(Y_n)\xrightarrow{P}{f(p)}$。考虑到

> [!note] 依测度收敛版本的控制收敛定理
> 任意随机变量$X_n\xrightarrow{P}{X}$，如果$|X_n|\leq Y$,并且$Y$的期望存在，那么$$E(X_n)\to E(X)$$

那么此时由于连续函数是有界的，那么自然$f(Y_n)$是有界的，于是由这个版本的控制收敛定理可以得到$$E(f(Y_n))\to E(f(p))=f(p)$$
前者可以具体计算出来，是一个关于p的多项式$B_n(p)$.也就是说，至少对于任意$p\in [0,1],B_n(p)\to f(p)$在逐点收敛的意义下是正确的。现在的想法是，如何把这种收敛加强到一致范数意义下的收敛？

#### 2.1 把收敛的结论加强到一致收敛

主要的目标就是估计$|B_n(p)-f(p)|$,估计的过程如下


对于任意$\varepsilon>0$都有$$\begin{aligned}
\left|f(p)-B_n(p)\right|= & \left|\sum_{k=0}^n\left[f(p)-f\left(\frac{k}{n}\right)\right] \binom{n}{k} p^k q^{n-k}\right| \\
& \leq \sum_{\{k:|(k / n)-p| <\delta_{\varepsilon}\}}\left|f(p)-f\left(\frac{k}{n}\right)\right| \binom{n}{k} p^k q^{n-k} \\
& +\sum_{\{k:|(k / n)-p| \geq \delta_{\varepsilon}\}}\left|f(p)-f\left(\frac{k}{n}\right)\right| \binom{n}{k} p^k q^{n-k} \\
& < \varepsilon+2 M \sum_{\{k:|(k / n)-p|\geq \delta_{\varepsilon}\}} \binom{n}{k} p^k q^{n-k} \\&<\varepsilon+\frac{2 M}{4 n \delta_{\varepsilon}^2}=\varepsilon+\frac{M}{2 n \delta_{\varepsilon}^2}
\end{aligned}$$

1. 这里采用了一种常见的对于求和或者积分的估计的手段。首先把两个要估计误差的对象放在一个求和当中，然后考虑分段估计，最后两边取极限。
2. 这里分段的想法是这样来的:
首先弱大数定理告诉我们，$Y_n\xrightarrow{P}{p}$按照依测度收敛的定义,对任意的$\varepsilon >0$都有$P\left(\left\{\omega:\left| Y_n-p \right| \geqslant \varepsilon\right\}\right)\to 0$。其中如果我们定义$$A_n=\left\{\omega:\left| Y_n(\omega)-p \right| \geqslant \varepsilon\right\}$$那么这个集合可以分解为一些个满足$\left| \frac{k}{n}-p \right| \geqslant \varepsilon$的集合$A_{n,k}=\left\{\omega:Y_n(\omega)=\frac{k}{n} \right\}$的并集。那么$$\begin{aligned}P(A_n)&=\sum_{k=0}^n P(A_{n,k}) \\ &= \sum_{\{k:|(k / n)-p| \geq \varepsilon\}} P_{Y_n}(\{k/n\}) \\ &= \sum_{\{k:|(k / n)-p| \geq \varepsilon\}}\binom{n}{k}p^k(1-p)^{n-k}\end{aligned}$$
3. 既然这里对求和的指标的集合做了一个划分，另一边自然就是$\{k:|(k / n)-p| <\delta_{\varepsilon}\}$,这一部分可以利用闭区间上连续函数的一致连续性去做估计。
4. 最后一段的求和的估计，利用了Chebyshev不等式$$\mathbf{P}\left\{\left|Y_n-p\right| \geq \delta_{\varepsilon}\right\} \leq \frac{\mathrm{V}\left(Y_n\right)}{\delta_{\varepsilon}^2}=\frac{p q}{n \delta_{\varepsilon}^2} \leq \frac{1}{4n\delta_{\varepsilon}^2}$$
现在我们可以确定$||f-B_n||_u\leq \varepsilon+\frac{M}{2 n \delta_{\varepsilon}^2}$，对n取极限得到$$\limsup_{n\to \infty}||f-B_n||_u\leq \varepsilon ,\forall \varepsilon>0$$
于是Bernstein多项式一致收敛到连续函数$f$.

#### 2.2 这样做的本质是什么?

想清楚这其中根本的操作有助于我们把这个方法进行抽象，从而可以推广这个办法去解决更多的问题。

1. 我们要估计，$\left|f(p)-B_n(p)\right|$,实际上我们要估计的是:$$\begin{aligned}\left|f(p)-E(Y_n)\right|&=\left|f(p)-\int_{\Omega}f(Y_n)\,dP\right|\\&=\left|\int_{\Omega}f(p)-f(Y_n)\,dP\right|\\ &\leq\int_{\Omega}|f(p)-f(Y_n)|\,dP \end{aligned}$$也就是说我们实际上要估计最后的这个积分$\int_{\Omega}|f(p)-f(Y_n)|\,dP$.
2. 我们的**想法是分段估计**。分段的依据就在于函数$f$在闭区间上是一致连续的，对于任意的$\varepsilon>0$存在$\delta_{\varepsilon}$使得如果$|Y_n-p|<\delta_{\varepsilon}$那么一定有$|f(p)-f(Y_n)|<\varepsilon$，假设$$\Omega_1:=\{\omega:|Y_n(\omega)-p|<\delta_{\varepsilon}\}$$那么这个第一段上的积分有$$\int_{\Omega_1}|f(p)-f(Y_n)|\,dP\leq \varepsilon P(\Omega_1)\leq \varepsilon $$这个时候第二段就很明显就应该是$$\Omega_2:=\{\omega:|Y_n(\omega)-p|\geq \delta_{\varepsilon}\}$$上的积分了。
3. 最后第二段的估计，我们基于的是积分估计里面非常常见，也是非常粗糙简单的一个初步的估计，“底乘以高”(参考[[分段估计]]，其中最开端的部分。)。


我们知道函数是有界函数因此$|f(Y_n)-f(p)|\leq 2M$,如果要应用"底乘以高"那么就必须对$\Omega_2$的概率测度做出一个合适的估计。这就很显然可以用到Chebyshev不等式，于是$P(\Omega_2)\leq \frac{1}{4n\delta_{\varepsilon}^2}$,于是$$\int_{\Omega_2}|f(p)-f(Y_n)|\,dP\leq 2M P(\Omega_2)\leq \frac{1}{2n\delta_{\varepsilon}^2}$$
4. 把每一段的估计整合起来: $$\int_{\Omega}|f(p)-f(Y_n)|\,dP \leq \varepsilon+\frac{M}{2 n \delta_{\varepsilon}^2}$$于是取上极限，$$\limsup_{n\to \infty}||f-B_n||_u\leq \varepsilon ,\forall \varepsilon>0$$于是一致逼近成立。
以上做法总结成一个结论就是:

> [!note] 定理1
> 1. 函数$f$是定义在$E$上的有界一致连续函数.
> 2. 假设对$\forall p\in E$都存在$X_n$是概率空间$(\Omega,\mathcal{F},P)$上的值域为$E\subseteq \mathbb{R}$的一列独立同分布的随机变量且$X_n\sim F(p)$其中$p\in E$是这一列随机变量的均值.假设$Y_n = \frac{X_1+...+X_n}{n}\xrightarrow{P}{p}$
> 3. 期望$E(f(Y_n))$存在对任意$n \in \mathbb{N}$成立。
> 
> 那么有：$$||E(f(Y_n)) -f||_u \to 0$$

注意按照上面的例子分析的情况，$E(f(Y_n))(p)$是定义在$E$上的函数列,然后此函数列一致收敛到极限函数$f$。


### 3. 这个证明带来的启发:试试正态分布?

> [!question] 问题
> 如果我们解开用多项式逼近连续函数的限制，我们是否能用同样的概率路径取得到更多样的对连续函数的一致逼近?

按照定理1，稍微改动一下，那么对于$f$一个实数上的一个有界连续函数(比如说$\sin(x)$)，我们存在$X_n\sim \mathcal{N}(p,1)$一列独立同分布的均值为p的正态分布的随机变量，那么令$Y_n = \frac{X_1+...+X_n}{n}$便可以断定$$E(f(Y_n))\rightrightarrows f$$现在我们需要去计算$E(f(Y_n))$,这样才能搞清楚$f$是被什么给一致逼近了。

#### 3.1 计算期望
按照1.6当中的分析$$\begin{aligned}\int_{\Omega} f\circ Y_n \,dP &= \int_{\mathbb{R}} f\,d Y_{n*}P = \int_{\mathbb{R}} f\,d P_{Y_n} \end{aligned}$$
其中$Y_{n*}P=P_{Y_n}$是由映射$Y_n$定义的pushforward测度。可是这个pushforward测度是什么呢？这里要回到正态分布的定义当中去，不过要定义正态分布首先需要搞清楚一个概念：**密度**。密度也称之为，Radon-Nikodym导数。

> [!note] Radon-Nikodym导数
> 在测度空间空间$(\Omega,\mathcal{F},\mu)$上如果存在一个非负Borel可测函数$f:\Omega \to [0,\infty)$，并且这个函数可以通过积分定义出可测空间$(\Omega,\mathcal{F})$上的另一个测度$$\forall A\in \mathcal{F},\nu(A):=\int_A f\,d\mu$$
> 那么此时我们称$f$是$\nu$关于$\mu$的Radon-Nikodym导数或者将成为"密度"。可以表示为$f=\frac{d\nu}{d\mu}$.

在这个基础上定义符合正态分布的随机变量.

> [!note] 正态分布的随机变量
> 在概率空间$(\Omega,\mathcal{F},P)$上如果一个随机变量$X$定义出来的pushforward测度$P_X$可以表示为$f_X$的积分$$P_X(A)=\int_{A} \frac{1}{\sqrt{2\pi\sigma^2}}\exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)\,dm$$对任意$A\in \mathcal{B}(\mathbb{R})$成立.
> 其中$\mathcal{B}(\mathbb{R})$是测度空间$(\mathbb{R},\mathcal{B}(\mathbb{R}),m)$当中的Borel代数(m是Lebesgue测度)
> 那么称$X \sim \mathcal{N}(\mu,\sigma^2)$是符合正态分布，均值为$\mu$方差为$\sigma^2$的随机变量。

那么对于这样的随机变量其期望可以通过密度转换为一般的Lebesgue积分来处理。

> [!note] Radon Nikodym链式法则
> $\nu,\mu$是测度空间$(\Omega,\mathcal{F})$上的两个测度，$g$是定义在$\Omega$上的非负Borel可测函数。如果存在$\nu$关于$\mu$的密度$\frac{d\nu}{d\mu}$,那么$$\int_{\Omega}g\,d\nu=\int_{\Omega}g\frac{d\nu}{d\mu}\,d\mu$$

按照正态分布的定义我们现在知道$\frac{dP_{Y_n}}{dm}(y) =\frac{n}{\sqrt{2\pi}}\exp\left(-\frac{n^2(y-p)^2}{2}\right)$,于是根据链式法则有

$$\begin{aligned}E(f(Y_n))(p)&= \int_{\mathbb{R}} f\,d P_{Y_n} \\&= \int_{\mathbb{R}}f(y)\frac{n}{\sqrt{2\pi}}\exp\left(-\frac{n^2(y-p)^2}{2}\right)\,dm(y) \\ &= f*K_n(p)\end{aligned}$$

最后我们得到了一个函数与另一个含参数的函数卷积的形式，其实不难发现$K_n$其实是热核。

当然如果我们事先知道最后这个卷积$f*K_n$那么不用概率的背景也可以直接得到一致收敛的结论，比如我们只需要证明$K_n$是$L^1(\mathbb{R})$这个代数当中的逼近单位元([[approximation to the identity]]),那么由于逼近单位的性质一致收敛性自然成立。

##### 3.1.1 正态分布的分布是Radon测度
当我们在一个由拓扑空间以及其开集建立起来的可测空间上讨论测度的问题的时候，比如这里的$(\mathbb{R},\mathcal{B}(\mathbb{R}))$,我们评价测度好不好会用Radon测度作为标准，因为其性质足够好非常类似于Lebesgue测度。当然Lebesgue测度不仅仅是Radon测度，还保持平移不变因此是一个Haar测度，不过这里我们只把$\mathbb{R}$视为一个拓扑空间而不是一个拓扑群，因此就不说Haar测度。(可以参考[[函数傅里叶展开的Dini判别及其应用]])

这里$P_X$与Lebesgue测度之间以概率密度函数保持着某种关系，那么我们自然就会问，**$P_X$保持Lebesgue测度的Radon测度的特性吗**？下面我们一条条检验其是否符合：
1. **紧子集上的有限性**：这个无需检验，因为$P_X$是概率测度，它有限。
2. **外正则性**:`
我们要证明的无非是，$$P_X(A)=\inf\{P_X(U):U \text{ is open and } A \subseteq U\}$$
其中$P_X(A) \leq P_X(U)$是显然的，接下来就是要证明另外一边的不等式，即$\forall \varepsilon >0$,需要存在一个$A\subseteq U_{\varepsilon}$使得$P_X(U_{\varepsilon})\leq P_X(A) + \varepsilon$.事实上我们只需要利用Lebesgue测度的外正则性即可，也就是说令$U_\varepsilon$其实就是让Lebesgue测度满足$m(U_{\varepsilon})\leq m(A) + \varepsilon$的包含A的开集。于是$$\begin{aligned}P_X(U_{\varepsilon})-P_X(A) &= \int_{U_{\varepsilon}\setminus A}\frac{1}{\sqrt{2\pi\sigma^2}}\exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)\,dm(x)\\ &\leq m(U_{\varepsilon}\setminus A) \frac{1}{\sqrt{2\pi\sigma^2}}= \frac{\varepsilon}{\sqrt{2\pi\sigma^2}}\end{aligned}$$于是这便证明了外正则性。
3. **内正则性**：方法和外正则性类似，都是利用二者Randon - Nikydom导数也就是概率密度函数这层关系让后者继承Lebesgue测度的性质。
因此正态分布是一个Radon测度。


