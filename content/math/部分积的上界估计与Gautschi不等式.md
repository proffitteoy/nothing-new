---
tags:
  - math
  - 微积分
  - 大学数学竞赛
  - 中学数学竞赛
  - 考研
---

> [!question] 问题1
> 证明:$$\prod_{n=1}^{N}\left(1-\frac{1}{2n}\right)<\frac{1}{\sqrt{2N}}$$

转换为对部分和的估计：

> [!question] 问题2：问题1的等价命题
> $$\sum_{n=1}^{N}\log\left(1-\frac{1}{2n}\right)<-\frac{1}{2}\log(2N)$$
### 1. 尝试简单的积分估计的办法（并不本质）

首先我们可以考虑简单的积分估计(参考[[和的积分估计]])。函数$f(t):=\log\left(1-\frac{1}{2t}\right)$是一个单调增加的函数，因此$$\sum_{k=1}^{N}f(k)<\int_{1}^{N+1}f(t)dt$$不过这样放缩放的太大，无法满足精度的需求。除了动用更精确的估计手法以外，还有一个简单的放缩的技巧：**考虑对放缩当中误差和贡献最大的项目，然后把这个项目单独拿出来处理**。此处把$f(1)=-\log(2)$单独拿出来不做放缩以提高精度。$$\begin{aligned}\sum_{k=1}^{N}f(k)<f(1)+\int_{2}^{N+1}f(t)dt&=-\log(2)+\int_{2}^{N+1}\log(1-1/(2t))dt\\&<-\log(2)+\int_{2}^{N+1}-\frac{1}{2t}dt\\&=-\log(2)-\frac{1}{2}(\log(N+1)-\log(2))\\&=-\frac{1}{2}\log(2N+2)<-\frac{1}{2}\log(2N)\end{aligned}$$这样处理刚刚好。

> [!failure] 这样处理的一个问题
> 这里既然最后依旧是对被积分对象$\log(1-\frac{1}{2t})$做放缩，那么这样与对和做逐项放缩有何区别呢？积分放缩的好处是，如果函数恰好积分的结果是简单的，那么我们就可以用一个简单的（我们熟悉的）函数作为和的上界。但是如果积分并不简单（熟悉），何必积分放缩？

#### 2. 逐项放缩

#### 2.1 利用函数$\log(1+x)\leq x$的放缩方法

首先考虑[[逐项估计]]的办法，令$S_N:=\sum_{n=1}^{N}\log\left(1-\frac{1}{2n}\right)$于是$$\begin{aligned}S_N&\leq -\log(2)-\frac{1}{2}\sum_{n=2}^{N}\frac{1}{n}\\&=-\log(2)-\frac{1}{2}(H_N-1)\end{aligned}$$而真正适合做积分放缩的是其中的调和数的序列$H_{N}$，因为其中被求和的每一项$\frac{1}{n}$其积分都是足够简单的。而现在我们要做的也正是要证明

> [!note] 引理2.1.1
> $H_N$表示第$N$个调和数，那么对任意正整数$N$都有
> $$H_N>\log(N)+\frac{1}{2}$$

* 证明可以参考[[和的积分估计#^f34762]]。

于是$$S_N\leq -\frac{1}{2}\log(N)+\frac{1}{4}-\log(2)<-\frac{1}{2}\log(N)-\frac{1}{2}\log(2)=-\frac{1}{2}\log(2N)$$于是不等式成立。

#### 2.2 加强命题验证差分的不等式

> [!error] 验证差分的失败
>首先尝试[[对部分和渐近展开的常数项做估计#3.从结果开始逐项放缩]]的做法中的直接验证差分的方法。也就是说我们为了验证$S_N:=\sum_{n=1}^{N} a_n<U_N$，也就是“问题2”当中对应的那个问题，我们希望尝试一个更强的命题，即验证是否有$$S_{N+1}-S_N = a_{N+1}< \Delta U_N$$是否对任意正整数$N$成立。对应具体的问题，也就是验证对任意正整数$N$是否成立$$\log\left(1-\frac{1}{2(N+1)}\right)<-\frac{1}{2}\left(\log(2N+2)-\log(2N)\right)$$该不等式等价于$$\log(2N+1)<\frac{\log(2N+2)+\log(2N)}{2}$$但这是不对的，因为$\log(x)$是一个concave的函数，成立不等式$$\frac{\log(x)+\log(y)}{2}\leq  \log((x+y)/2)$$不等式号恰好是反的，因此这个想法注定失败。

#### 2.3 制造telescoping sum

^b1fe7b

> [!tip] 想法2.3.1:利用concave性制造的telescoping sum
> 详细参考[[逐项估计#^d27913]]，借助对数函数的concave性质，我们得到$$\log(2n)-\log(2n-1)\geq \frac{\log(2n+1)-\log(2n-1)}{2}$$而后者是一个telescoping sum，其和的精度正好符合“问题2”的要求。

根据以上想法$$\begin{aligned}S_N=-\sum_{n=1}^N \log(2n)-\log(2n-1)&\ \leq \sum_{n=1}^N\frac{\log(2n-1)-\log(2n+1)}{2}\\&=-\frac{\log(2N+1)}{2}\\&<-\frac{1}{2}\log(2N)\end{aligned}$$

* 以上逐项放缩的想法的核心想法都可以总结为:[[逐项估计#^13ee84]].


### 3. 此问题与$\Gamma$函数之间的关系

从上面的“核心想法”的角度来看，第1节，第2.1，2.2节中的解法的基本出发点都是：“认为$P_N$或者$\log(P_N)$其本身不是一个简单的或者我们熟悉的形式，因此需要放缩成一个新的简单的或者熟悉的形式”。

而这一节的解法的出发点则是：“$P_N$真的不熟悉吗？不！其实$P_N$我们还是比较熟悉的！”并且最后的结果告诉我们，这样做精度能达到更好。
$$P_N=\prod_{n=1}^{N}\left(1-\frac{1}{2n}\right)=\frac{1}{\sqrt{\pi}}\frac{\Gamma(N+1/2)}{\Gamma(N+1)}$$这个结果可以从Wallis公式(参考[[math/Wallis公式,正弦函数Hadamard分解互相之间的关系]])其中一个步骤得到:$$P_N=\frac{2}{\pi}\int_{0}^{\frac{\pi}{2}}\sin(t)^{2N}dt$$考虑到这个积分和beta函数之间的关系:$$\beta(z_1,z_2)=2\int_{0}^{\frac{\pi}{2}}\sin(t)^{2z_1-1}\cos(t)^{2z_2-1}dt$$所以上述的乘积我们可以写成$$P_N=\frac{1}{\pi}\beta(N+\frac{1}{2},\frac{1}{2})=\frac{1}{\pi}\frac{\Gamma(N+\frac{1}{2})\Gamma(\frac{1}{2})}{\Gamma(N+1)}$$此时如果我们用Gautschi不等式:

> [!note] Gautschi不等式,1959
> 当$s\in(0,1),x>0$的时候:$$x^{1-s}<\frac{\Gamma(x+1)}{\Gamma(x+s)}<(1+x)^{1-s}$$

放在此问题当中$s=1/2$:$$\frac{1}{\sqrt{\pi(N+1)}}<P_N<\frac{1}{\sqrt{\pi N}}$$那么自然$$P_N<\frac{1}{\sqrt{\pi N}}<\frac{1}{\sqrt{2N}}$$
#### 3.1 证明这个不等式:Gautschi不等式

这个不等式的主要原理是利用$\Gamma(x),x>0$的对数下凸性，即：

令$g(x)=\log\left(\Gamma(x)\right)$那么:$$g(tu+(1-t)v)<tg(u)+(1-t)g(v),u\neq v$$对于这一点，我们只需要计算$g(x)$的二阶导数即可。$$g^{(2)}(x)=\frac{\Gamma^{(2)}(x)\Gamma(x)-\Gamma^{\prime}(x)^2}{\Gamma(x)^2}$$考虑到$$\begin{aligned}\Gamma^{(k)}&=\int_{0}^{\infty}\log(t)^kt^{x-1}e^{-t}dt,\forall k\in\mathbb{N}\\&=\int_{0}^{\infty}\log(t)^kh^2(x,t)dt\end{aligned}$$由Cauchy - Schwarz不等式可以知道:$$\begin{aligned}\Gamma^{(2)}(x)\Gamma(x)&=||\log(t)h(x,t)||^2\cdot||1\cdot h(x,t)||^2\\&>\braket{\log(t)h(x,t),h(x,t)}\\&=\int_{0}^{\infty}\log(t)h^2(x,t)dt\\&=\Gamma'(x)\end{aligned}$$对数下凸性自然也可以写成:$$\Gamma(tu+(1-t)v)<\Gamma(u)^t\Gamma(v)^{1-t}$$1.  令$u=x,v=x+1,t=1-s$那么:$$\begin{aligned}\Gamma(s+x)&<\Gamma(x)^{1-s}\Gamma(x+1)^{s}=x^{s-1}\Gamma(x+1)\end{aligned}$$2.  反过来令$u=x+s,v=x+s+1,t=s$得到:$$\Gamma(x+1)<\Gamma(x+s)^s\Gamma(x+s+1)^{1-s}=(x+s)^{1-s}\Gamma(x+s)$$