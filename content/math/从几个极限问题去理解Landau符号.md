---
tags:
  - math
  - 微积分
  - 考研
obsidian-note-status:
  - colorful:completed
---
### 1. 问题1 

> [!question] 问题1
> 令$$S_n:=\sum_{k\leq n}\sin(k/n^2)$$求$$\lim_{n\to \infty }S_n$$

这里$S_n$是一个关于$n$的比较复杂的序列，而我们想要给它一个“渐近分析”，再具体一点通过渐近分析求得其极限。说白了就是得到$$S_n = A+o(1)$$即写成一个常数加上一个无穷小。

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


> [!note] Landau符号的优点：
> 对于分析问题，我们一开始可以通过分析知道每一步至多需要达到什么样的精度。而这是关键的，因为这样我们可以提前规划：
> 1. 如果精度要求高，直接排除工具箱当中精度达不到的工具，提前评估问题的难度。
> 2. 如果精度要求低，可以避免“杀鸡用牛刀”的情况。
> 3. 隐藏对问题没有影响的余项中蕴含的细节，方便我们集中精力解决问题。


### 4. 使用Landau符号的时候常见的错误



> [!failure] 常见错误 4.1
> 在对$S_n:=\sum_{k\leq n} f_n(k)$的估计当中余项$R_n(k)$与参数$k$有关的时候，一个常见的错误是,当我们发现对于任意固定的$k$都有$$|R_n(k)|\leq C_kT_n$$的时候我们就直接写$$R_n(k)=O(T_n)$$这是不对的！因为这样做的一个前提条件是，我们必须要保证对任意的$1\leq k\leq n$的时候$C_k$是有界的。

在估计 $S_N:=\sum_{k\leq N}R_N(k)$ 的时候，如果余项 $R_N(k)$ 同时依赖于 $N$ 和 $k$，一个常见错误是：我们发现对每一个固定的 $k$，都有 $R_N(k)=O(T_N)$，于是就直接认为
$$
\sum_{k\leq N}R_N(k)
=
\sum_{k\leq N}O(T_N)
=
O(NT_N).
$$

把 Landau 符号翻译成不等式，就能看出问题。所谓“对每一个固定的 $k$ 有 $R_N(k)=O(T_N)$”，真正说的是：对每一个固定的 $k$，存在常数 $C_k>0$，使得当 $N$ 足够大时有 $|R_N(k)|\leq C_kT_N$。

注意这里的常数是 $C_k$，它可以依赖于 $k$。但是当我们估计 $\sum_{k\leq N}R_N(k)$ 时，$k$ 不再是固定的，而是在 $1\leq k\leq N$ 里面变化。此时如果想推出 $\sum_{k\leq N}R_N(k)=O(NT_N)$，真正需要的是存在统一常数 $C>0$，使得当 $N$ 足够大时，对所有 $1\leq k\leq N$ 都有 $|R_N(k)|\leq CT_N$。也就是说，需要的是
$$
\sup_N\sup_{1\leq k\leq N}\frac{|R_N(k)|}{T_N}<\infty.
$$
但逐点估计 $|R_N(k)|\leq C_kT_N$ 并不能推出这个统一估计。

例如令 $R_N(k)=\frac{k}{N^2}$，$T_N=\frac1{N^2}$。对每一个固定的 $k$，都有 $|R_N(k)|=kT_N$，所以确实有 $R_N(k)=O(T_N)$。但是这个 $O(T_N)$ 的隐含常数是 $C_k=k$，并不是对所有 $1\leq k\leq N$ 一致有界。

如果错误地把它当成统一估计，就会得到
$$
\sum_{k=1}^N R_N(k)
=
\sum_{k=1}^N O\left(\frac1{N^2}\right)
=
O\left(\frac1N\right).
$$
但实际上
$$
\sum_{k=1}^N R_N(k)
=
\sum_{k=1}^N\frac{k}{N^2}
=
\frac{N(N+1)}{2N^2}
\to
\frac12.
$$
所以它根本不是 $O\left(\frac1N\right)$。

错误的根源在于：对每一个固定的 $k$ 成立的估计，不等于对所有 $1\leq k\leq N$ 一致成立的估计。正确写法应该是 $R_N(k)=O_k(T_N)$，这里下标 $k$ 表示隐含常数依赖于 $k$。如果要把它放进求和号里面使用，就必须额外证明这个隐含常数对求和范围内的 $k$ 是一致有界的。

说到底所谓landau符号的运算不过是不等式运算的简写而已。那么当我们谈论不等式的运算就不得不小心"正负号"以及不等式的方向问题。

> [!failure] 常见错误4.2
> 假设我们需要估计$a_kc_k+b_kd_k$的和，然后我们还事先知道$c_k=O(r_k),d_k=O(r_k)$于是我们就认为$$a_kc_k+b_kd_k=\cancel{a_kO(r_k)+b_kO(r_k)=O((a_k+b_k)r_k)}$$我们把上面的式子写成不等式就能发现其荒谬之处。首先我们知道$$c_k\leq A r_k,d_k \leq B r_k$$于是我们便认为$$a_kc_k+b_kd_k\leq a_k(Ar_k)+b_k(Br_k)\leq C(a_k+b_k)r_k$$在Landau符号当中，当然$A,B,r_k\geq 0$但是当前语境下可没说过$a_k,b_k$总是为正的对吧。比如说此处如果是$a_k=k,b_k=-k+1,c_k=k,d_k=2k$那么当然有$c_k=O(k),d_k=O(k)$但是$$a_kc_k+b_kd_k= -k^2+2k \neq O(k)$$而正确地运用Landau符号实际上是利用下面的不等式$$|a_kc_k+b_kd_k|\leq |a_k|(Ar_k)+|b_k|(Br_k)\leq C(|a_k|+|b_k|)r_k$$也就是说$$a_kc_k+b_kd_k=|a_k|O(r_k)+|b_k|O(r_k)=O((|a_k|+|b_k|)r_k)$$


说到底，这个错误的本质是：把一个绝对值估计误当成了可以带符号相消的代数运算。