---
tags:
  - math
  - 微积分
  - 考研
obsidian-note-status:
  - colorful:completed
---

> [!question] 问题
> $f\in C([0,1]\to \mathbb{R})$,$\int_{0}^{1}f(x)\,dx=0$证明$$\left(\int_{0}^{1}xf(x)\,dx\right)^2\leq \frac{1}{12}\int_{0}^{1}f^2(x)\,dx$$

### 1. 失败的尝试

首先如果我们直接不管函数的其他性质，直接利用其平方可积性就会得到$$\left(\int_{0}^{1}xf(x)\,dx\right)^2\leq \left(\int_0^1x^2dx\right)\left(\int_0^1f^2(x)dx\right) = \frac{1}{3}\int_{0}^{1}f^2(x)\,dx$$
这个系数还不够精确。很显然我们需要用一开始的条件来让这个系数尽可能地“陡峭”。


### 2. 结合边界条件和取等条件的Cauhcy-Schwarz不等式

我们从$L^2([0,1]\to \mathbb{R})$上来思考这个问题，首先条件告诉我们的是$$\langle1,f \rangle=0$$于是等于说，函数$f$与任意的常数函数$c$都是垂直的。而问题相当于是$$|\langle x,f \rangle|\leq A ||f||_{L^2}$$即内积会被函数$f$的$L^2$范数控制起来。问题的关键就是确定这个系数$A=\frac{1}{\sqrt{12}}$。

像这种用内积当中的某个函数的范数控制内积的问题，自然会想到Cauchy-Schwarz不等式。不过第一节已经向我们证明了，这种做法的误差太大了。不过我们想到，利用函数内积的信息，应该可以提高不等式的精度，于是由$$|\langle x,f \rangle|=|\langle x-c,f \rangle|\leq \sqrt{1/3+c^2-c}||f||_{L^2}$$那么存在一个$c$可以使得我们想要证明的不等式成立吗？这个问题等价于$$(c-1/2)^2\leq 0$$成立，只要$c=1/2$,这件事就能成立。

换句话来说，我们只要构造$g(x):=x-1/2$,那么我们就可以利用Cauchy-Schwarz不等式$$|\langle g,f \rangle|\leq ||g|| \cdot ||f|| =\frac{1}{\sqrt{3}}||f||$$而究竟如何构造函数$g$取决于边界条件，以及取等的情况而定。

### 3. 更多类似的问题

#### 3.1 逆向考虑C-S不等式

> [!question] 问题2
> $f \in C^1([0,1])$并且$f(1)-f(0)=1$证明$$\int_{0}^{1}f'^2(x)\,dx\geq 1$$

Cauchy-Schwarz不等式可以理解为$u,v\in L^2([0,1])$满足$$|\langle u,v \rangle |\leq ||u|| \cdot ||v||$$那么反过来，也可以理解为$$||u||\geq \frac{|\langle u,v \rangle |}{||v||}$$

> [!tip] 主要想法
> 恰好此问题就是一个这样的问题：
> 1. 边界条件:$f(1)-f(0)=1$
> 2. 目标不等式:$$||f'||\geq 1$$
> 
> 于是我们的想法是，找到一个$L^2([0,1])$当中的对象$g$,使得$$||f'||\geq \frac{|\langle g,f' \rangle |}{||g||}= 1$$

关于这个问题，我们首先考虑什么样的函数能取等号？(这里面也有技巧，如果假设函数非常光滑的话，考虑一个变分问题就能得到)

在这种情况下，我们只需要令$g(x)=1$,那么因为$\langle g,f' \rangle=\int_{0}^{1}f'(x)\,dx =f(1)-f(0)=1$,以及$||g||=1$,因此这样我们就证明了此不等式。


> [!question] 问题3
> $f \in C^1([0,1])$并且$f(0)=f(1)=0$并且$\int_{0}^{1}f^2(x)\,dx=1$证明$$\int_{0}^{1}x^2f'^2(x)\,dx\geq \frac{1}{4}$$

同样的思路，我们考虑一个函数$g$,使得$$||xf'||\geq \frac{|\langle g,xf' \rangle |}{||g||}= \frac{1}{2}$$问题中已经知道的是$||f||=1$,并且$f(0)=f(1)=0$的条件可以用于分部积分，得到关于$f'$的某种内积的关系。于是不妨试试看$g(x)=f(x)$,这样我们就只需要处理$|\langle f,xf' \rangle |$。由分部积分可以得到$$\begin{aligned}\langle f,xf' \rangle &= \int_{0}^{1}xf(x)f'(x)\,dx\\&=-\int_{0}^{1}f^2(x)+xf'(x)f(x)\,dx'\\&=-1-\langle f,xf' \rangle \end{aligned}$$于是我们知道$$\langle f,xf' \rangle =-\frac{1}{2}$$这意味着$$||xf'||\geq \frac{|\langle f,xf' \rangle |}{||f||}=\frac{1}{2}$$
于是不等式就证明完了。
