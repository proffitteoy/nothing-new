---
tags:
  - math
  - 微积分
  - 大学数学竞赛
---

> [!question] 问题
> 求积分:$$\int_{0}^{1} \log(1-x) \log(x) dx$$

### 1. Feynmann技巧


* 构造含两个参数的函数，建立起与Beta函数之间的联系

$$\frac{\partial}{\partial a \partial b}(1-x)^ax^b =
\log(1-x)\log(x)(1-x)^ax^b $$

然后添加参数以后的函数的积分是熟悉的,所以这样原来的积分就和Beta函数建立起了一种联系：

$$\begin{aligned}\frac{\partial}{\partial a \partial b}\beta(a+1,b+1) &=
\int_{0}^{1} \log(1-x)\log(x)(1-x)^{a+1}x^{b+1} dx \\ &=
\beta(a+1,b+1)\Big(\psi(a+1) - \psi(a+b+2)\Big)\Big(\psi(b+1) -
\psi(a+b+2)\Big) \\&- \beta(a+1,b+1)\psi_1(a+b+2) \end{aligned}$$

$a \to 0,b \to 0$的时候有
$$ \int_{0}^{1} \log(1-x)\log(x) dx =
\beta(1,1)\Big(\psi(1)-\psi(2)\Big)^2 - \beta(1,1)\psi_1(2) = 2-
\frac{\pi^2}{6}$$


### 2.转换为级数处理

* 思路参考[[和与积分换序#3.1 幂级数展开]]。

$$ \begin{align} \int_{0}^{1} \log(1-x) \log(x) dx &=
\int_{0}^{1} -\Big(\sum_{n \geq 1}\frac{x^n}{n}\Big) \log(x)
dx \\&= -\int_{0}^{1}\sum_{n \geq
1}\frac{\color{red}{x^n\log(x)} }{n} dx \\&=-\sum_{n \geq
1}\int_{0}^{1}\frac{\color{red}x^n\log(x)}{n} dx\\&= \sum_{n
\geq 1}\frac{1}{n(n+1)^2}\\&=\sum_{n \geq 1}\frac{1}{n(n+1)} -
\sum_{n \geq 1}\frac{1}{(n+1)^2}\\&=1-(\frac{\pi^2}{6} - 1) =
2 - \frac{\pi^2}{6}\end{align}$$

这里有一个是否可以交换的问题：

1.  从一致收敛的角度考虑(R积分):不难求证:$|x^n\log(x)|\leq \frac{1}{en},n \geq1$ 因为在(0,1)内存在最小值0,1部分的极限都是0.所以$\left|\frac{x^n\log(x)}{n}\right| \leq \frac{e^{-1}}{n^2}$，因此部分和 $S_N(x)\rightrightarrows S(x)$，于是在紧集$0,1]$上，$$\int_{0}^{1}S_N(x) dx \to
    \int_{0}^{1}S(x)dx $$
2.  单调收敛定理考虑(L积分):此处L积分和R积分都存在，并且相等，因此无论原有问题指的是R积分或者是L积分，结果都是一样的。使用单调收敛定理的一个推论(参考[[zeta函数整数值的积分表示]]),因为$\frac{-x^n\log(x)}{n}$非负,那么这个级数的部分和就是一个单调增加的函数列，于是可以直接交换，交换后发现$\int_{[0,1]}S(x)dx$是有限的，顺便还能说明原来的积分是存在的，被积函数是可积的。
3.  从Fubini -Tonelli定理的角度考虑(L积分):这么做的技巧在于把求和看成积分。$\Omega=\{1,2,...\}$,然后定义counting measure $\mu$，然后考虑在sigma-finite测度空间$(\Omega,\mathcal{P}(\Omega),\mu)$的积分，$$\int_{\Omega}
    \frac{-x^n\log(x) }{n}d\mu(n) = \sum_{n\geq
    1}\frac{-x^n\log(x) }{n}
    $$所以原来的问题就是:$$\int_{[0,1]}\int_{\Omega}
    \frac{-x^n\log(x)
    }{n}d\mu(n)dx$$用Tonelli定理交换因为被积分对象非负，因为原来的函数$f(x,n)=\frac{x^n\log(x)}{n}$是可测函数。


