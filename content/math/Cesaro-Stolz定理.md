---
tags:
  - math
---
### 1. 定理及其证明
#### 1.1 分母单调无界的情形

> [!note] Cesaro-Stolz定理的分母无界的情形
> 假设$a_n,b_n$是两个实数序列，并且其中$b_n$是严格单调并且无界的，那么如果$$\lim_{n\to \infty}\frac{a_{n+1}-a_n}{b_{n+1}-b_n}=L$$那么$$\lim_{n\to \infty}\frac{a_n}{b_n}=L$$

证明的思路可以参考[[Silverman–Toeplitz定理]]的途径。

> [!tip] 主要想法
> 我们可以把一个序列(或者序列的一部分)展开为其差分和，这样我们可以把问题转换为对部分和的处理，往往有些时候这允许我们对原序列进行更为细致的操作。

遵照这种想法解决问题的情况还有:[[一个递推序列的渐近问题]]，[[通过倒数制造差分关系]]，[[Riesz-Fischer定理]]。

因为我们可以把$\frac{x_n}{y_n}$的分子写成差分和的形式（假设$x_0=y_0=0$），从而$$\frac{x_n}{y_n}=\sum_{k=1}^n\frac{x_{k}-x_{k-1}}{y_n}=\sum_{k=1}^n\frac{y_k-y_{k-1}}{y_n}\frac{x_{k}-x_{k-1}}{y_{k}-x_{y-1}}$$于是我们把一个序列展开为了一个部分和的形式。

现在假设$a_{nk}:=\frac{y_k-y_{k-1}}{y_n}$,其满足：
1. 关于$k$的和为1，即:$$\sum_{k=1}^na_{nk}=1$$
2. 对于任意固定的$k$,$a_{nk}\to 0$。
并且我们还发现$\frac{x_{k}-x_{k-1}}{y_{k}-x_{y-1}}\to L$,也就是说其极限是存在的，且为$L$的，因此由[[Silverman–Toeplitz定理]]，上面的部分和随着$n$趋于无穷，存在极限且为$L$,也就是说$$\frac{x_n}{y_n}\to L$$

#### 1.2 分母单调无界的一般情况

> [!note] 定理1.2:一般情况下的Stolz-Cesaro定理
> $x_n,y_n$是两个实数列，并且$y_n$单调无界，那么$$\liminf_{n\to \infty}\frac{x_{n+1}-x_n}{y_{n+1}-y_n}\leq \liminf_{n\to \infty}\frac{x_n}{y_n}\leq \limsup_{n\to \infty}\frac{x_n}{y_n}\leq \limsup_{n\to \infty}\frac{x_{n+1}-x_n}{y_{n+1}-y_n}$$

证明参考：
https://en.wikipedia.org/wiki/Stolz%E2%80%93Ces%C3%A0ro_theorem