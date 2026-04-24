---
tags:
  - math
  - 微积分
---

> [!note] 命题
> $\mathbb{R}^n$当中的$n$维球体的体积公式为$$\frac{\pi^{d/2}}{\Gamma(d/2+1)}r^d$$

在[[为何圆的周长与直径的比例是常数]]里面我们已经讨论过给集合做伸缩变换后对测度的影响，那么我们可以很直接的知道，对于半径为$r$的球，其测度实际上就是单位球测度的$r^d$次方.因此实际上我们只需要计算单位球的测度。

Fubini-Tonelli定理告诉我们，如果要求一个product space当中的集合的测度，我们可以给这个集合做"切片"。

> [!note] 切片的本质
> 如果$E$是$\mathbb{R}^{d_1}\times \mathbb{R}^{d_2}$当中的一个可测集合，那么对于几乎每个$y \in \mathbb{R}^{d_2}$都有切片,$$E^{y}=\{x\in\mathbb{R}^{d_1}:(x,y)\in E\}$$
> 这种切片都是可测的集合，并且$m(E^{y})$是关于$y$的可测函数，并且$$m(E)=\int_{\mathbb{R}^{d_2}}m(E^{y})\,dy$$同样的也有对几乎每个$x \in \mathbb{R}^{d_1}$都有切片,$$E_{x}=\{x\in\mathbb{R}^{d_1}:(x,y)\in E\}$$这种切片都是可测的集合，并且$m(E_{x})$是关于$x$的可测函数，并且$$m(E)=\int_{\mathbb{R}^{d_1}}m(E_{x})\,dx$$

其本质不过是Fubini - Tonelli定理应用在函数$\chi_{E}(x,y)$上而已。




这里有两种切片的办法。
### 1. 第一种切片方法$A_x$

> [!note] 由函数围成的区域的Lebesgue测度
> $f(x)$是$\mathbb{R}^k$上的一个非负的函数，集合$$A:=\{(x,y) \in \mathbb{R}^{k}\times \mathbb{R}:0\leq y \leq f(x)\}$$
> 那么这个集合的"面积"可以用积分来计算，公式如下:
> $$\int_{\mathbb{R}^k} f(x)\,dx = m(A)$$
> 这里的$m$是集合的Lebesgue测度。


这种切片的方法相当于是固定好$x=(x_1,...,x_{k}) \in \mathbb{R}^k$的这些变量，只让$y$一个变量进行活动。于是这个问题当中集合$A$可以理解为是由所有的这些个$$A_x=\{(x,y)\in\mathbb{R}^{k}\times \mathbb{R}:(x,y) \in A\}$$所构成的。这里为了满足$(x,y) \in A$这个条件，我们需要$y \in [0,f(x)]$成立,所以
$$m(A)=\int_{\mathbb{R}^k}\,m(A_x)dx=\int_{\mathbb{R}^k}\,f(x)dx$$

对于这个球的体积的问题，我们考虑单位半球的集合$$B_{+}^{d}=\{(x_1,...,x_d) \in \mathbb{R}^d_{+}:x_1^2+...+x_d^2\leq 1\}$$按照以上的切片方式，我们有$$B_{+}^{d} = \{(x,y) \in \mathbb{R}^{d-1}_{+}\times \mathbb{R}:0\leq y\leq g(x)\}$$其中$g(x_1,...,x_{d-1}) = \sqrt{1-(x_1^2+...+x_{d-1}^2)}\chi_{x_i \in [-1,1]}$.假设$d$维球体的体积为$v_d$那么单位球的体积可以计算为$$v_d=2\int_{[-1,1]^{d-1}}\sqrt{1-(x_1^2+...+x_{d-1}^2)}\,dx$$
这个积分最终可以使用极坐标变换来计算，但是如果是这样的话，为何我不一开始就选择使用极坐标来计算呢？事实上我们的确可以一开始便选择极坐标来计算，这就是后面的第三种想法。

根据以上结果，显然这种切片的办法并不是计算上最好算的。
### 2.第二种切片方法$A^{y}$

如果我们固定$y,x=(x_1,...,x_{k})$也就是说，我们只固定一个变量，让其他变量变动起来。$$A^{y}=\{(x,y)\in\mathbb{R}^{d-1}\times\mathbb{R}:(x,y)\in A\}$$然后我们可以把集合的测度计算为
$$m(A)=\int_{\mathbb{R}}\,m(A^{y})dy$$
对于这个求球的体积的问题我们需要考虑切片$$B^{y}_{+}=\{(x,y)\in\mathbb{R}^{d-1}_{+}\times\mathbb{R}:(x,y)\in A\}$$，以上切片便成为了为了满足后面的条件$(x,y) \in B^{d}_{+}$那么就需要满足条件$0\leq ||x||\leq \sqrt{1-y^2}$。，实际上$$m(B^{y}_{+})= v_{d-1}(1-y^2)^{\frac{d-1}{2}}$$
这样的话，单位$d$维球体的测度就变成了$$\begin{aligned}v_d=2\int_{0}^{1}\,m(A^{y})dy&=2\int_{0}^{1}\,v_{d-1}(1-y^2)^{\frac{d-1}{2}}dy \\ &= \beta\left(\frac{1}{2},\frac{d+1}{2}\right)v_{d-1}\\&= \frac{\pi^{d/2}}{\Gamma(d/2+1)}\end{aligned}$$
### 3. 极坐标上的积分

所谓极坐标，就是我们可以把任意$x \in \mathbb{R}^d-\{0\}$的点认为是在单位球面$S^{d-1}=\{x\in \mathbb{R}^d:|x|=1\}$的某个点乘这个数的模长对应的实数得到的。即定义$\omega = \frac{x}{|x|}$,以及$r = |x|$从而$x =r\omega$.这样我们相当于把$\mathbb{R}^d-\{0\}$视为一个product space,$$\mathbb{R}^d-\{0\} = S^{d-1}\times \mathbb{R}^{+}$$
那么在$\mathbb{R}^d-\{0\}$上的积分可以借助(抽象测度的)Fubini-Tonelli定理来处理，从而得到:

$$\int_{\mathbb{R}^d} f(x) d x=\int_{S^{d-1}}\left(\int_0^{\infty} f(r \omega) r^{d-1} d r\right) d \sigma(\omega)$$

其中$\sigma$是在单位球面$S^{d-1}$上的测度(更详细的情况可以见[[Fubini定理的一个应用，极坐标变换下的积分]])。

对于球的体积问题，我们可以把对单位球$B^{d}$的测度表示特征函数的积分,然后再利用极坐变换把积分处理为$$m(B^{d})=\int_{\mathbb{R}^{d}}\chi_{B^{d}} \,dx=\int_{S^{d-1}}\int_{0}^{1}r^{d-1}\,dr\,d\sigma(\omega)=\frac{1}{d}\sigma(S^{d-1})$$
这里做极坐标变换的时候$\chi_{B^d}$约束的条件实际上是$|x|\leq 1$，这个条件做极坐标变换的时候变成了$|r\omega| = r\leq 1$于是便有了上面的式子。

那么为了得到单位球的体积的结果，首先需要确认球面的面积的结果。这个结果可以通过高斯积分的一个推广结果并结合极坐标公式得到。

> [!note] 高斯积分公式的推广
> $$\int_{\mathbb{R}^d} e^{-\pi|x|^2}\,dx =1$$

而这个积分我们可以使用极坐标变换的积分式子得到
$$\int_{\mathbb{R}^d} e^{-\pi|x|^2}\,dx =\int_{S^{d-1}} \int_{0}^{\infty} e^{-\pi r^2}r^{d-1}\,dr\,\sigma(\omega) = \sigma(S^{d-1})\int_{0}^{\infty} e^{-\pi r^2}r^{d-1}\,dr$$
其中最后的那个无穷积分，实际上和$\Gamma$函数有关系。通过变量替换，我们可以用$\Gamma$函数的来表达最后的结果$$\sigma(S^{d-1}) = \frac{2\pi^{d/2}}{\Gamma(d/2)}$$
因此便可以得到n维球体的体积$$v_d=\frac{\pi^{d/2}}{\Gamma(d/2+1)}$$





