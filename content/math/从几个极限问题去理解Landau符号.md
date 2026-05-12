---
tags:
  - math
  - 微积分
  - 考研
---
### 1. 问题1 

> [!question] 问题1
> 令$$S_n:=\sum_{k\leq n}\sin(k/n^2)$$求$$\lim_{n\to \infty }S_n$$

这里$S_n$是一个关于$n$的比较复杂的序列，而我们想要给它一个“渐近分析”，再具体一点通过渐近分析求得其极限。说白了就是得到$$S_n = A+o(1)$$即写成一个常数加上一个无穷小。这里有一个Landau符号"$o(1)$"这是什么意思?

> [!note] 关于o(1)
> $o(f(n))$表示得是一个序列的对象，我们可以记作$a_n$。它的含义是：“当n足够大的时候$|a_n|\leq \varepsilon f(n)$”，或者严格一点，对任意的$\varepsilon>0$存在正整数$N_{\varepsilon}$使得所有$n>N_{\varepsilon}$都有$$|a_n|\leq \varepsilon f(n)$$我们可以理解为,虽然这个对象$a_n$的细节可能非常复杂，但是我知道，它在n很大的时候其增长速度远远小于一个简单的对象$f(n)$。当然我知道有的朋友喜欢用$|a_n|/f(n)\to 0$来理解，不过相对而言其实用不等式的方式理解更为方便灵活。

那么现在我们来看$S_n$的渐近展开的方法。其实本质上就是[[逐项估计]]。

> [!tip] 主要想法
> 如果我们使用Taylor展开每一项，然后对每一项做估计，然后估计误差的累积可能就会达到我们的目的,只要误差的累积可以被$o(1)$控制起来。

我们发现$\sin(k/n^2)=\frac{k}{n^2}+o(\frac{k}{n^2})$,那么$$\begin{aligned}S_n&=\frac{n(n+1)}{2n^2}+o\left(\frac{n(n+1)}{2n^2}\right)\\&= \frac{1}{2}+o(1)+o(1)\\&= \frac{1}{2}+o(1)\end{aligned}$$
第一行的求和的意思:
1. 首先我们利用的是$$\sin(x)=x+o(x)$$对任意$\varepsilon>0$,存在$\delta_{\varepsilon}>0$使得对任意$|x|<\delta_{\varepsilon}$都有$R(x):=\sin(x)-x$满足不等式$$|R(x)|\leq \varepsilon x$$这意味着假设我们有$m$个值$x_1,....,x_n$都满足$|x_i|<\delta_{\varepsilon}$,那么我们完全可以把这些结果加起来使得$$\sum_{k\leq n}\sin(x_k)=\sum_{k\leq n}x_k+\sum_{k\leq n}R(x_k)$$而我们知道每个$R(x_k)$都满足不等式，于是$$\sum_{k\leq n}R(x_k)\leq \varepsilon\sum_{k\le n}x_k$$于是我们可以写作$$\sum_{k\leq n}\sin(x_k)=\sum_{k\leq n}x_k+o\left(\sum_{k\leq n}x_k\right)$$
2. 现在的情况是我们知道，任意的$f(n,k):=\frac{k}{n^2}\leq \frac{1}{n}$,当n足够大的时候是可以任意小的。因此我们知道，对任意的$\delta_{\varepsilon}>0$存在正整数$N_{\varepsilon}$使得$n>N_{\varepsilon}$的时候$|f(x,k)|<\delta_{\varepsilon}$，于是参照上面的分析得到$$\sum_{k\leq n}\sin(k/n^2)=\frac{n(n+1)}{2n^2}+o\left(\frac{n(n+1)}{2n^2}\right)$$
第二行的意思是：
1. 我们知道$\frac{n(n+1)}{2n^2}=\frac{1}{2}+\frac{1}{2n}$,其中$1/2n$这个对象满足不等式，对任意的$\varepsilon>0$，当n足够大的时候有不等式$1/2n \leq \varepsilon$，所以我们表示为$\frac{1}{2n}=o(1)$。
2. 按照同样的道理，那么第二部分$o(\frac{1}{2}+\frac{1}{2n})$是什么意思？同样的，表示一个对象，假设为$b_n$好了，满足对任意的$\varepsilon>0$,n足够大的时候$|b_n|\leq \varepsilon(\frac{1}{2}+\frac{1}{2n})\leq \varepsilon$所以很自然地我们也把它表示为$o(1)$
3. 最后一行我们用到了一个关于o的运算律，$o(1)+o(1)=o(1)$，这是什么意思呢?假设等式左边两个o代表的对象是$a_n,b_n$，对任意的$\varepsilon/2>0$,都存在$N'_{\varepsilon},N''_{\varepsilon}$使得$n>\max\{N'_{\varepsilon},N''_{\varepsilon}\}$的时候，$$|a_n|\leq \frac{\varepsilon}{2},|b_n|\leq \frac{\varepsilon}{2}\implies |a_n+b_n|\leq \varepsilon$$所以我们也可以用$o(1)$表示整个$a_n+b_n$。因此$o(1)+o(1)=o(1)$
那么现在即便是得到了$S_n = \frac{1}{2}+o(1)$又如何?其实我们得到的是一个不等式，什么不等式?对任意的$\varepsilon>0$存在正整数$N_{\varepsilon}$，使得任意的$n>N_{\varepsilon}$都有$$|S_n-\frac{1}{2}|\leq \varepsilon$$这意味着$S_n\to \frac{1}{2}$。

所以诸位网友请看，全程我们是不涉及极限符号使用的，但是处处都是谈论极限，并且Landau符号的使用是严格的。

### 2. 问题2

> [!question] 问题2
> 令$$A_N:=\prod_{n\leq N}\frac{n}{n+a}$$其中$a$是一个固定的实数，求$$\lim_{n\to \infty }A_N$$

> [!tip] 主要想法
> 把乘积通过指数映射转换为和，然后对和做渐近分析。

令$S_N:=\sum_{n\leq N}\log(n)-\log(n+a)$,于是$$\begin{aligned}S_N&=\sum_{n\leq N}\log(n)-\log(n+a) \\&= -\sum_{n\leq N}\log\left(1+\frac{a}{n}\right)\\&= -\left(\sum_{n\leq N} \frac{a}{n}\right)+O\left(1\right)\\&= -aH_{N}+O(1)\end{aligned}$$
1. 第二步，借助于函数$\log(1+x)=x+O(x^2)$这样的Taylor展开,其含义是$\forall \varepsilon>0$存在$\delta_{\varepsilon}>0$使得所有满足$|x|<\delta_{\varepsilon}$都有$|\log(1+x)-x|<\varepsilon x^2$，而无论$a$是什么实数，只要是固定不变的，那么由于$\frac{a}{n}\to 0$,那么就存在足够大的$N_{\varepsilon}$使得当$n>N_{\varepsilon}$的时候可以令$x=\frac{a}{n}$带入到$\log(1+x)$的渐近展开中。至于说$n\leq N_{\varepsilon}$的部分，因为这部分是有限的，于是我们用一个$O(1)$控制起来。
2. 第三行，这里其实省略了，$O\left(\sum_{N\geq n>N_{\varepsilon}}\frac{a^2}{n^2}\right)+O(1)=O(1)$因为$\frac{1}{n^2}$形成的级数是收敛的，因此整个和可以被一个常数控制起来，此外再加上一个被常数控制的项，最终依旧可以被常数控制。
3. 最后的$H_N:=\sum_{n\leq N}\frac{1}{n}$是调和级数的前N项和，这是单调增加且无界的一个序列。因此如果$a> 0$,那么$S_N\to -\infty$。此外$A_N=\exp(S_N)$,于是$A_N$的极限为0。

### 3. Landau符号的优点

> [!tip] 一个道理
> 我们用于思考的工具也同时改变着思考这件事本身。

因此我们用Landau符号做估计，不仅仅是给余项换个符号表达而已，它会改变我们的思考模式。

比如下面的问题：

> [!question] 问题3：清华大学领军计划（2025年4月）
> 求极限$$\lim_{n\to \infty}\left[\tan\left(\frac{\pi}{4}+\frac{1}{n}\right)\right]^n$$

* 对应视频:[youtube:【数学笔记】清华领军求极限题目](https://youtu.be/2kSFOEyGAqU),[b站：【数学笔记】清华领军求极限题目](https://www.bilibili.com/video/BV1EGLMz3EJs/)

令$a_n:=\left[\tan\left(\frac{\pi}{4}+\frac{1}{n}\right)\right]^n$按照Landau符号，我们要求极限，实际上我们就是寻找一个实数$A$（如果极限存在），使得$$a_n=A+o(1)$$因此我们就把问题转换为了一个估计问题：

> [!note] 目标1
> 我们要求$a_n$的精度为$o(1)$的一个估计。

然后我们来看这个问题$a_n$像是一些初等函数复合而成的函数，参照[[把函数转换为基本初等函数的复合]]的想法（因为这样做方便我们利用基本初等函数的估计协助我们解决估计问题），于是我们有下面的目标：

> [!note] 目标2
> 我们要求$\log(a_n)$的精度为$o(1)$的一个估计。
> 
> 因为假设$\log(a_n)=B+o(1)$，那么$a_n=e^{B+o(1)}=e^B+o(1)$于是自然地，$$A=e^B$$


这样做得好处很明显，因为$$\log(a_n)=n\log\left[\tan\left(\frac{\pi}{4}+\frac{1}{n}\right)\right]$$我们可以一层层进行估计，最后就能自然地得到$\log(a_n)$的估计，从而达成目标。而根据$\log(1+x)$的渐近结果，以及$\tan\left(\frac{\pi}{4}+\frac{1}{n}\right)\to 1$，于是我们有下面的目标：

> [!note] 目标3
> 得到$\tan(\frac{\pi}{4}+\frac{1}{n})$的精度为$o(1/n)$的估计。
> 
> 因为如果我们得到$\tan(\frac{\pi}{4}+\frac{1}{n})=1+C_n+o(1/n)$其中$C_n\to 0$然后$nC_n$有界，那么$$n\log[1+C_n+o(1/n)]=nC_n+o(1)$$于是最终我们只需要搞清楚$nC_n$的极限是多少，就能解决所有问题。

因此最后的问题很简单，我们只需要搞清楚$x=0$附近$\tan(\pi/4+x)$的Taylor展开的精度为$o(x)$的展开即可。由于$$\tan(\pi/4+x)=1+2x+o(x)$$于是我们知道$$C_n=\frac{2}{n}$$于是最终$$B=2,A=e^2$$

---

通过上面的例子我们知道：

> [!note] Landau符号的优点：
> 对于分析问题，我们一开始可以通过分析知道每一步至多需要达到什么样的精度。而这是关键的，因为这样我们可以提前规划：
> 1. 如果精度要求高，直接排除工具箱当中精度达不到的工具，提前评估问题的难度。
> 2. 如果精度要求低，可以避免“杀鸡用牛刀”的情况。
> 3. 隐藏对问题没有影响的余项中蕴含的细节，方便我们集中精力解决问题。


### 4. 使用Landau符号的时候常见的错误

* 这部分对应的视频[【数学笔记】使用大O记号要注意的两个常见错误](https://www.bilibili.com/video/BV1VXKyz7EeQ)

> [!failure] 常见错误 4.1
> 在对$S_n:=\sum_{k\leq n} f_n(k)$的估计当中余项$R_n(k)$与参数$k$有关的时候，一个常见的错误是,当我们发现对于任意固定的$k$都有$$|R_n(k)|\leq C_kT_n$$的时候我们就直接写$$R_n(k)=O(T_n)$$这是不对的！因为这样做的一个前提条件是，我们必须要保证对任意的$1\leq k\leq n$的时候$C_k$是有界的。

* [[math/求一个分子带log分母为阶乘的含参数和的渐近展开]]:在这个问题中，我们试图估计$$T_n:=\sum_{k \geq 0} \frac{\log(1+\frac{(-2)^k}{n})}{k!}$$我们的想法是,令$x=\frac{(-2)^k}{n}$然后利用分子上的$\log(1+x)$的Taylor展开从而进行某种“逐项估计”。我们现在来回忆该函数的Taylor展开的余项$$\log(1+x)=x+\frac{x^2}{2(1+\xi)^2}$$当我们带入$x=\frac{(-2)^k}{n}$的时候得到$$\log(1+\frac{2^k}{n})=\frac{2^k}{n}+\frac{2^{2k}}{2n^2(1+\xi_{n,k})^2}$$其中$\xi_{n,k}<\frac{(-2)^k}{n}$，当$k$是奇数的时候。我们发现，当$k$靠近于$n$的时候$\frac{(-2)^k}{n}$可能会小于$-1$从而有可能使得$\xi_{n,k}$靠近$-1$从而使得余项当中$\frac{1}{2(1+\xi_{n,k})^2}$无界。于是，我们有一种折中的办法：我们设定一个$$t_n=\log_2(n)-1$$然后把$T_n$分为两段：$$T_n=\sum_{k< t_n} +\sum_{k\geq t_n}$$其中当$k<t_n$的时候，我们可以保证$x=\frac{(-2)^k}{n}\in (-1/2,1/2)$从而使得在这个限制条件下$\frac{1}{2(1+\xi_{n,k})^2}$有界，从而可以得到$$\log(1+\frac{(-2)^k}{n})=\frac{2^k}{n}+O\left(\frac{4^k}{n^2}\right),\forall k<t_n$$只不过我们还需要用别的方法处理剩下的部分的估计。当然如果$T_n$的被求和对象是$\log(1+\frac{2^k}{n})$则完全不用那么麻烦。因为当$0<\xi_{n,k}<\frac{2^k}{n}$的时候，无论如何$\frac{1}{2(1+\xi_{n,k})^2}$也都是有界的，所以直接逐项估计就可以了。
* [[math/对含参数方程根的估计]]：在这个问题当中我们需要估计$$\lim_{s\to 0^{+}}\sum_{k=1}^{N(s)-1}\frac{1}{x_kx_{k+1}}=\frac{2}{\pi^2}$$其中$x_k=x_k(s)$是含参数$s$的方程$\cos(x)=sx$的从小到大排列的第$N(s)$个正根。我们很容易由根的连续性得到，对于每个固定的$k$都有$$x_k(s)\to x_k(0)=(k-\frac{1}{2})\pi$$于是我们可能会想到用$$\cancel{x_k(s)=(k-\frac{1}{2})\pi+o(1)}$$然后利用这个估计得到估计对象的被求和对象$\frac{1}{x_kx_{k+1}}$的估计，最后因为$N(s)\to \infty$直接得到最后的结果。然而这是不对的$$R_k(s):=x_k(s)-x_k(0)$$虽然对于每一个固定的$k$，都有$r_k(s)\to 0$但是别忘了$k$可以非常靠近$N(s)-1$，在尾部这一段我们并不能保证$r_k(s)$趋于0。事实上，如果我们用隐函数定理结合微分中值定理展开得到$$x_k(s)=x_k(0)+x_k'(\xi_{k,s})s,x_k'(t)=-\frac{x_k(t)}{\sin(x_k(t))+t}$$我们很快就会发现，当$k$靠近尾部的时候$x'(t)$根本不能被控制起来。因此这里我们依旧采用一种折中的方案，先得到了更为精确的$N(s)$增长信息$$N(s)\sim\frac{1}{\pi s}$$之后用$q(s)=N(s)^{2/3}$把$k\in \{1,\cdots,N(s)-1\}$分为两段。如此一来在第一段当中$R_k(s)$确实可以被控制起来，然后我们再用别的方式控制第二段。

说到底所谓landau符号的运算不过是不等式运算的简写而已。那么当我们谈论不等式的运算就不得不小心"正负号"以及不等式的方向问题。

> [!failure] 常见错误4.2
> 假设我们需要估计$a_kc_k+b_kd_k$的和，然后我们还事先知道$c_k=O(r_k),d_k=O(r_k)$于是我们就认为$$a_kc_k+b_kd_k=\cancel{a_kO(r_k)+b_kO(r_k)=O((a_k+b_k)r_k)}$$我们把上面的式子写成不等式就能发现其荒谬之处。首先我们知道$$c_k\leq A r_k,d_k \leq B r_k$$于是我们便认为$$a_kc_k+b_kd_k\leq a_k(Ar_k)+b_k(Br_k)\leq C(a_k+b_k)r_k$$在Landau符号当中，当然$A,B,r_k\geq 0$但是当前语境下可没说过$a_k,b_k$总是为正的对吧。比如说此处如果是$a_k=k,b_k=-k+1,c_k=k,d_k=2k$那么当然有$c_k=O(k),d_k=O(k)$但是$$a_kc_k+b_kd_k= -k^2+2k \neq O(k)$$而正确地运用Landau符号实际上是利用下面的不等式$$|a_kc_k+b_kd_k|\leq |a_k|(Ar_k)+|b_k|(Br_k)\leq C(|a_k|+|b_k|)r_k$$也就是说$$a_kc_k+b_kd_k=|a_k|O(r_k)+|b_k|O(r_k)=O((|a_k|+|b_k|)r_k)$$

* [[对算术函数平均值的渐近#3. Euler's totient function]]：在这个问题当中我们需要估计$$\sum_{d\leq x} \varphi(d)=\sum_{d\leq x} \mu(d)F_0(x/d)$$其中我们已经知道$F_0(x)=\frac{1}{2}x^2+O(x)$。那么正确的做法是$$\begin{aligned} \sum_{d\leq x} \varphi(d)&=\sum_{d\leq x}\mu(d)F_0(x/d)\\&= \frac{x^2}{2}\sum_{d \leq x}\frac{\mu(d)}{d^2}+O\left(x\sum_{d\leq x}\frac{|\mu(d)|}{d}\right)\\&= \frac{x^2}{2}\left(L(2,\mu)-\sum_{d>x}\frac{\mu(d)}{d^2}\right)+O(x\log(x))\\&= \frac{3}{\pi^2}x^2+O(x\log(x))\end{aligned}$$因为要非常小心$\mu(d)$，因为这个函数会在$-1,0,1$这三个值之间震荡。所以当我们把已知的关于$F_0(x)$的渐近结果带入式子当中的时候，余项$\sum_{d\leq x}\mu(d)O(x/d)$就应该处理为$O\left(x\sum_{d\leq x}\frac{|\mu(d)|}{d}\right)$。如果直接处理为$$O\left(x\sum_{d\leq x}\frac{\mu(d)}{d}\right)=o(x)$$就大错特错了。实际上目前为止最好的结果不过是$$O\left(x\log^{2/3}(x)(\log\log(x))^{1/3}\right)$$