---
tags:
  - math
  - 微积分
---
> [!question] 问题0：putnam数学竞赛 1961,A1（改）
> 定义集合$$S:=\{(x,y)\in(0,\infty)^2:x^y=y^x\}$$不难发现$S$当中包含直线$y=x$对应的点集$$\Delta:=\{(t,t):t>0\}\subset S$$令$$B:=S\setminus \Delta$$求集合$$\overline{B}\cap \Delta$$

* $\overline{B}$是集合$B$的闭包。
* [原本的Putnam问题](https://prase.cz/kalva/putnam/psoln/psol611.html)当中，明确告诉我们集合是平面上的一个单点集，然后需要我们去求这个点。

我们可以用Mathematica来绘制$S$的形状，从而对我们的问题目标有一个更清晰的认知：

```mathematica
ContourPlot[x^y == y^x, {x, 0, 10}, {y, 0, 10}]
```


![[方程对应的两条分支的交点.png]]

* 通过这个图我们可以看到，我们要求的$\overline{B}\cap \Delta$应该是一个孤立的点。

---

如果我们对$x^y=y^x$两边取对数，得到$y\ln x=x\ln y$。令$h(t):=\frac{\ln t}{t}$于是$$S=\{(x,y)\in (0,+\infty)^2:h(x)=h(y)\}$$
* 回顾[[把二元优化降为一元优化：由全局隐函数视角看约束最值问题#^6e7685]]中的解决方案，我们把对应的解集$E$转换为了$\{(x,z):x+\ln x=z+\ln z\}$。而对应的函数$t+\ln t$因为在$t>0$的时候严格单调，从而解只能是$x=z$。

反观当前的问题当中的集合$S$,我们同样把问题转换为了$h(x)=h(y)$，但不同的是，$h(t),t>0$并非单调，而是先增加后减少：

![[函数lnx x的图像.png]]

* 通过$h'(t)=\frac{1-\ln t}{t^2}$我们知道函数的最大值点在$t=e$处取得，最大值为$\frac{1}{e}$。

* 因此我们可以理解，为什么$S$当中不仅仅是包含了$y=x$这一平凡的分支，还包含了$B$这个非平凡的分支。令$c\in (0,\frac{1}{e})$，那么$h(t)=c$存在两个不同的根$x_c,y_c$。于是点$$(x_c,y_c),(y_c,x_c)\in B$$显然$B$与对角线$\Delta$不应该有交点，但是其闭包会有，正如图像中显示的那样。

### 1. 问题解决

我们现在关心的是：
1. 是否存在$a$使得$(a,a)\in \overline{B}$。
2. 确定并证明，这样的$a$是否有且仅有一个。

直觉告诉我们，$a$实际上就是函数$h$的极值点的横坐标，即$e$。下面给出证明：

首先证明，如果存在一个$a$使得$(a,a)\in \overline{B}$，那么$a$是函数$h$的critical point，即$h'(a)=0$。

这是因为，如果$(a,a)\in \overline{B}$，也就是说，存在$(x_n,y_n)\in B$使得$$(x_n,y_n)\to (a,a)$$不过同时，由于$(x_n,y_n)\in B$所以$x_n\neq y_n$，并且满足$h(x_n)=h(y_n)$。那么由于Rolle中值定理，在$x_n,y_n$形成的区间之间，一定存在一个$\xi_n$使得$$h'(\xi_n)=0$$此外由于$x_n,y_n\to a$，从而$\xi_n\to a$。于是对上式子取极限，并且由于$h\in C^1$的连续性，最终得到$$h'(a)=0$$

那么$h$这个函数有多少个critical point呢？只有一个，那就是最大值点$x=e$。接下来我们证明，$(e,e)$的确属于$\overline{B}$。

根据我们对函数$h$的单调性的分析，令正实数序列$c_n\uparrow \frac{1}{e}$。那么根据函数$h$的连续性与单调性，存在序列$x_n\in (1,e),y_n\in (e,+\infty)$满足$$h(x_n)=h(y_n)=c_n$$对上式取极限，那么由于$h(e)=\frac{1}{e}$，以及函数的在区间$(1,e)$以及区间$(e,+\infty)$上的严格单调性与连续性，可以得到$x_n,y_n\to e$从而$$(x_n,y_n)\in B,(e,e)\in \overline{B}$$
最终我们得到结果$$\overline{B}\cap \Delta=\{(e,e)\}$$
### 2. 第一次尝试推广

> [!tip] 之前问题得到印象
> 对于形如$f(x)=f(y)$的关系，其在(x,y)平面中形成的解集往往会分出若干分支；而这些分支的闭包与对角线$\Delta$这个平凡分支的交点，与$f$的critical point之间有密切关系。

接下来我们构造更多类似的问题来塑造这一直觉：

> [!example] 例子2.1
> 考虑$$h(x):=x^3-3x$$以及集合$$S_h:=\{(x,y):h(x)=h(y)\},\quad \Delta:=\{(x,x):x\in \mathbb{R}\}$$令$$B_h:=S_h\setminus \Delta=\{(x,y):h(x)=h(y),x\neq y\}$$我们想要知道$\overline{B_h}\cap \Delta$。
> 
> 我们可以通过mathematica得到下面两个图像
> 
> ![[三次多项式形成的解集.png]]
> 
> * 集合$S_h$的形状。
> 
> ![[一个一元三次多项式的图像.png]]
> 
> * $h$函数的图像
> 
> 我们可以发现，分支相交的点的横坐标，恰好也就是函数$h$的两个极值点所在的位置。

再看一个例子：

> [!example] 例子2.2
> 考虑$$g(x):=x^2+\frac{1}{x}$$以及集合$$S_g:=\{(x,y)\in (0,\infty)^2:g(x)=g(y)\},\quad \Delta:=\{(x,x):x>0\}$$令$$B_g:=S_g\setminus \Delta=\{(x,y)\in (0,\infty)^2:g(x)=g(y),x\neq y\}$$我们想要知道$\overline{B_g}\cap \Delta$。
> 
> 我们可以通过mathematica得到下面两个图像：
> 
> ![[x的平方加上x的倒数图像形成的解集的图像.png]]
> 
> * 集合$S_g$的图像。
> 
> ![[x的平方加上x的倒数图像形.png]]
> 
> * 函数$g$的图像。
> 
> 非平凡分支与对角线相交的横坐标恰好与函数$g$的极小值点吻合。

接下来我们尝试推广：

> [!note] 定义2.3
> $I$是一个开区间，$h:I\to \mathbb{R}$，定义$$S_h:=\{(x,y)\in I^2:h(x)=h(y)\},\quad \Delta:=\{(x,x):x\in I\},\quad B_h:=S_h\setminus \Delta$$我们需要讨论$\overline{B_h}\cap \Delta$，即所有形如$(a,a)\in \overline{B_h}$。
> 
> * 其中$\overline{B_h}$是集合$B_h$在$\mathbb{R}^2$的欧氏拓扑下的闭包。

在此基础上得到命题：

> [!note] 命题2.4
> $a\in I$集合$U_a$是包含$a$的开邻域，假设函数$h\in C^2(U_a)$，那么：
> 1. $(a,a)\in \overline{B_h}$那么$h'(a)=0$。
> 2. 如果$h'(a)=0$并且$h''(a)\neq 0$那么$(a,a)\in \overline{B_h}$。
* 证明与第一节几乎一致。第一个结论可以用Rolle中值定理证明，第二个结论，既然$h''(a)\neq 0$，不失一般性可以假设其为局部极大值点，剩下的证明则与之前一样。

根据这个命题我们可以得到一个推论：

> [!note] 命题2.5
> 如果$h\in C^2(I)$并且函数的每一个critical point都非退化，那么$$\overline{B_h}\cap \Delta=\{(a,a)\in I^2:h'(a)=0\}$$


