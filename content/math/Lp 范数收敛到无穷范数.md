---
obsidian-note-status:
  - colorful:completed
tags:
  - 分析
---

> [!question] 题目
> 设 $f\in L^\infty(X)$，并且 $f$ 支撑在一个有限测度集上。证明：对所有 $1\leq p<\infty$，都有 $f\in L^p(X)$，并且
> $$
> \|f\|_{L^p}\to \|f\|_{L^\infty}
> \quad \text{as }p\to\infty.
> $$



>[!tip]
>给出了一套和stein完全不一样的证明方式，直观上来说可以先证明$p \to \infty$的时候增量是0，也即有界，进而通过确定上下界来确定极限。


设 $M=\|f\|_{L^\infty}$。因为 $f\in L^\infty(X)$，所以 $|f(x)|\leq M$ a.e.

又因为 $f$ 支撑在有限测度集 $E$ 上，即 $f=0$ a.e. on $X\setminus E$，并且 $\mu(E)<\infty$，所以对任意 $1\leq p<\infty$，有

$$
\begin{aligned}
\int_X |f|^p\,d\mu
&=\int_E |f|^p\,d\mu \\
&\leq \int_E M^p\,d\mu \\
&=M^p\mu(E)<\infty.
\end{aligned}
$$

因此 $f\in L^p(X)$ 对所有 $1\leq p<\infty$ 成立。

下面证明

$$
\|f\|_{L^p}\to \|f\|_{L^\infty}
\quad \text{as }p\to\infty.
$$

由上面的估计可得

$$\|f\|_{L^p}=\left(\int_X |f|^p\,d\mu\right)^{1/p}=\left(\int_E |f|^p\,d\mu\right)^{1/p}\leq \left(M^p\mu(E)\right)^{1/p}=M\mu(E)^{1/p}.$$

令 $p\to\infty$，因为 $\mu(E)^{1/p}\to 1$，所以

$$
\limsup_{p\to\infty}\|f\|_{L^p}\leq M.
$$

这给出了上界。

另一方面，任取 $\varepsilon>0$。由 $M=\|f\|_{L^\infty}$ 的定义可知，集合

$$
A_\varepsilon=\{x\in X: |f(x)|>M-\varepsilon\}
$$

具有正测度，即 $\mu(A_\varepsilon)>0$。

否则，如果 $\mu(A_\varepsilon)=0$，那么几乎处处都有 $|f(x)|\leq M-\varepsilon$。这就说明 $M-\varepsilon$ 也是 $|f|$ 的一个本质上界，与 $M$ 是最小本质上界矛盾。

于是，由 $A_\varepsilon=\{x\in X:|f(x)|>M-\varepsilon\}$ 的定义，在 $A_\varepsilon$ 上有 $|f(x)|>M-\varepsilon$，所以

$$
\|f\|_{L^p}^p=\int_X |f|^p\,d\mu\geq \int_{A_\varepsilon}|f|^p\,d\mu\geq (M-\varepsilon)^p\mu(A_\varepsilon).
$$

两边开 $p$ 次方，得到 $\|f\|_{L^p}\geq (M-\varepsilon)\mu(A_\varepsilon)^{1/p}$。令 $p\to\infty$，因为 $\mu(A_\varepsilon)^{1/p}\to 1$，所以 $\liminf_{p\to\infty}\|f\|_{L^p}\geq M-\varepsilon$。又因为 $\varepsilon>0$ 任意，所以

$$
\liminf_{p\to\infty}\|f\|_{L^p}\geq M.
$$

结合前面已经证明的 $\limsup_{p\to\infty}\|f\|_{L^p}\leq M$，可得

$$
M\leq \liminf_{p\to\infty}\|f\|_{L^p}\leq \limsup_{p\to\infty}\|f\|_{L^p}\leq M.
$$

因此 $\lim_{p\to\infty}\|f\|_{L^p}=M$，也就是

$$
\boxed{\|f\|_{L^p}\to \|f\|_{L^\infty}\quad \text{as }p\to\infty.}
$$

