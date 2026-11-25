

## 一、主定理与证明依赖

设 $M$ 是一个闭光滑流形。如果对于任意 $\varepsilon>0$，都存在黎曼度量 $g_\varepsilon$，使得 $\operatorname{diam}(M,g_\varepsilon)\leq1$ 且 $|K_{g_\varepsilon}|<\varepsilon$，则称 $M$ 为近乎平坦流形。

Farrell–Zdravkovska 和 Yau 猜想，每个近乎平坦流形都是某个紧流形的边界。本文证明了这一猜想在具有 Spin$^{c}$ 结构的情形下成立。

**Theorem 1.1.** 设 $M$ 是一个 $n$ 维闭近乎平坦 Spin$^{c}$ 流形，则 $M$ 是某个紧定向流形的边界。如果 $n$ 为奇数，那么 $M$ 连同任意给定的 Spin$^{c}$ 结构，都是某个 Spin$^{c}$ 流形的边界。

这里需要区分定向配边与 Spin$^{c}$ 配边。前者只要求边界上的定向能够延拓，后者还要求选定的 Spin$^{c}$ 结构能够延拓。因此，定理的第二部分比第一部分更强。

证明从一个已有的配边判据出发。

**Lemma 3.1（Wall–Stong）.** 两个闭定向流形定向配边，当且仅当它们具有相同的 Stiefel–Whitney 数与 Pontryagin 数。两个闭 Spin$^{c}$ 流形 Spin$^{c}$ 配边，当且仅当它们具有相同的 Stiefel–Whitney 数与 $c$-Pontryagin 数。

将其中一个流形取为空流形，便得到零配边类的判据。特别地，要证明 $M$ 是定向边界，只需证明其所有 Stiefel–Whitney 数与 Pontryagin 数均为零。

这使主定理的证明分成两个相互关联的部分。Lemma 3.2 利用近乎平坦流形的有限覆盖消除有理 Pontryagin 类；Lemma 3.4 则负责证明 Stiefel–Whitney 数消失。后者依赖 Section 2 的整系数 Wu 类估计和 Lemma 3.3 的指标整除性。

具体的证明依赖为：

$$
\begin{gathered}
\text{Lemma 3.2}
\Longrightarrow
\text{Lemma 3.3},\\[2mm]
\text{Lemma 2.2}+\text{Lemma 3.2}+\text{Lemma 3.3}
\Longrightarrow
\text{Lemma 3.4},\\[2mm]
\text{Lemma 3.1}+\text{Lemma 3.2}+\text{Lemma 3.4}
\Longrightarrow
\text{Theorem 1.1},\\[2mm]
\text{Lemma 3.1}+\text{Lemma 3.2}+\text{Lemma 3.4}
\Longrightarrow
\text{Proposition 3.6}.
\end{gathered}
$$

Proposition 3.6 进一步用于证明 Theorem 1.1 关于奇数维 Spin$^{c}$ 配边的加强结论。

因此，整个证明的关键落在 Lemma 3.4：如何由近乎平坦性与 Spin$^{c}$ 结构推出所有 Stiefel–Whitney 数消失。

## 二、从 Pontryagin 类消失到 Wu 类的整除问题

**Lemma 3.2.** 设 $M$ 是近乎平坦流形，则 $M$ 的所有有理 Pontryagin 类均为零。

由 Gromov 的近乎平坦流形定理，存在有限 $d$ 重覆盖 $\pi:\widetilde M\to M$，使得 $\widetilde M$ 是 nilmanifold。后者是可平行化流形，因而其切丛的 Pontryagin 类全部消失。

利用有限覆盖的 transfer 映射，有 $\operatorname{tr}\circ\pi^*=d\,\mathrm{id}$。于是

$$
d\,p_i(M)
=\operatorname{tr}(\pi^*p_i(M))
=\operatorname{tr}(p_i(\widetilde M))
=0.
$$

这表明 $p_i(M)$ 是挠类，故在有理上同调中消失。

因此，$M$ 的所有 Pontryagin 数都为零。不过，Lemma 3.1 还要求 Stiefel–Whitney 数消失。后者取值于 $\mathbb Z/2$，不能仅凭有理 Pontryagin 类的消失推出。

作者在这里引入整系数 Wu 类，将模 $2$ 的特征数问题转化为整数的可除性问题。

设 $V$ 是具有 Spin$^{c}$ 结构的定向实向量丛，$\xi$ 是对应的行列式复线丛，记 $c=c_1(\xi)$。Spin$^{c}$ 结构保证 $\rho_2(c)=w_2(V)$。

Section 2 从 Hopkins–Singer 的整系数 Spin Wu 类出发，定义切向整系数 Spin$^{c}$ Wu 类：

$$
\mu_t^{Spin^c}(V)
=
\frac{\mu_t^{Spin}(V\oplus\xi)}{\mu_t^U(\xi)}.
$$

这一构造的模 $2$ 约化是通常的 Wu 类。由于总 Stiefel–Whitney 类满足 Wu 公式 $w=Sq(v)$，所有顶维 Wu 数的消失足以推出所有 Stiefel–Whitney 数消失。

整系数提升使作者能够利用指标定理提供的整除性质。但整系数 Wu 类在有理特征类展开中通常含有分母，因而首先需要控制这些分母。

**Lemma 2.2.** 设 $a_m$ 是通用整系数 Spin$^{c}$ Wu 类 $\mu_{2m}^{Spin^c}$ 中 $c^m$ 的系数，$s_2(m)$ 表示 $m$ 的二进制数位和，则

$$
\operatorname{denom}(a_m)\mid2^{m-s_2(m)}.
$$

为计算这一系数，作者形式地令所有 Pontryagin 变量为零。此时总 Wu 类的特征级数可以写为 $\sqrt{h(-c)/h(c)}$，其中 $h(c)=1+c+c^2+c^4+\cdots$。

令该平方根的展开系数为 $a_m$，而 $h(-c)/h(c)$ 的展开系数为 $b_m$。由于后一个级数模 $2$ 同余于 $1$，所有正次数的 $b_m$ 都是偶整数。

比较平方后的系数，得到递推关系

$$
2a_m=b_m-\sum_{k=1}^{m-1}a_ka_{m-k}.
$$

利用二进制数位和的不等式 $s_2(m)\leq s_2(k)+s_2(m-k)$，可以归纳控制右侧各项的分母。求和中的非对角项成对出现；当 $m$ 为偶数时，唯一没有配对的中间项也能通过归纳假设证明具有所需的偶性。于是得到 Lemma 2.2 的分母估计。

这一估计在后文的作用非常具体：当有理 Pontryagin 类消失时，每个偶次整系数 Spin$^{c}$ Wu 类在有理上都化为 $a_m c^m$。只要证明 $c$ 的顶次幂具有足够强的整除性，便可以控制所有 Wu 特征数的奇偶性。

这种整除性由指标定理提供。

**Lemma 3.3.** 设 $(M,c)$ 是一个 $2m$ 维近乎平坦 Spin$^{c}$ 流形，则

$$
2^m m!\mid\langle c^m,[M]\rangle.
$$

考虑 $M$ 上的 Spin$^{c}$ Dirac 算子 $D^c$。Atiyah–Singer 指标定理给出：

$$
\begin{aligned}
\operatorname{Ind}(D^c)
&=
\left\langle\widehat A(M)e^{c/2},[M]\right\rangle\\
&=
\frac{\langle c^m,[M]\rangle}{2^m m!}
\in\mathbb Z.
\end{aligned}
$$

第二个等号使用了 Lemma 3.2。由于所有有理 Pontryagin 类均为零，$\widehat A(M)$ 在有理上等于 $1$，所以指标公式中只剩下 $e^{c/2}$ 的顶维分量。

指标是整数，因此 $\langle c^m,[M]\rangle$ 必须被 $2^m m!$ 整除。

Lemma 2.2 与 Lemma 3.3 由此形成互补关系：前者限制 Wu 类系数分母中的 $2$-幂，后者强迫顶维特征数具有足够高的 $2$-进赋值。接下来需要证明这种整除性能够在任意顶维 Wu 数中同时成立。

## 三、Lemma 3.4：Stiefel–Whitney 配边障碍的消失

**Lemma 3.4.** 设 $(M,c)$ 是近乎平坦 Spin$^{c}$ 流形，则 $M$ 的所有 Stiefel–Whitney 数均为零。

设 $\dim M=2m$。由 Lemma 3.2，在有理特征类计算中有 $\mu_{2j}^{Spin^c}(M)=a_jc^j$。

考虑 $m$ 的任意分拆 $I=(j_1,\ldots,j_r)$，满足 $j_1+\cdots+j_r=m$，并令 $a_I=a_{j_1}\cdots a_{j_r}$。相应的顶维整系数 Wu 数可以写为 $\langle a_Ic^m,[M]\rangle$。

Lemma 2.2 说明 $a_{j_\ell}$ 的分母至多含有 $2^{j_\ell-s_2(j_\ell)}$，因此 $a_I$ 的 $2$-进赋值满足

$$
v_2(a_I)\geq-m+\sum_{\ell=1}^{r}s_2(j_\ell).
$$

另一方面，Lemma 3.3 给出 $\langle c^m,[M]\rangle$ 可被 $2^m m!$ 整除。结合 Legendre 公式 $v_2(m!)=m-s_2(m)$，得到

$$
v_2(\langle c^m,[M]\rangle)\geq2m-s_2(m).
$$

将二者相加：

$$
\begin{aligned}
v_2\!\left(\left\langle a_Ic^m,[M]\right\rangle\right)
&\geq
m+\sum_{\ell=1}^{r}s_2(j_\ell)-s_2(m)\\
&\geq m.
\end{aligned}
$$

最后一步再次使用二进制数位和的不等式。这说明任意顶维整系数 Wu 数都能被 $2^m$ 整除，特别地，它们模 $2$ 全部为零。

奇数维情形更直接。整系数 Spin$^{c}$ Wu 类只含偶次数分量，其乘积无法产生奇数顶维特征数，因此所有 Wu 数自动消失。

既然这些整系数 Wu 类的模 $2$ 约化恢复通常 Wu 类，便得到 $M$ 的所有模 $2$ Wu 数均为零。再由 Wu 公式，所有 Stiefel–Whitney 数均为零。

这里得到的是特征数的消失，并不要求每一个 Stiefel–Whitney 类本身都为零。根据 Lemma 3.1，前者正是配边问题需要的条件。

现在可以完成 Theorem 1.1 的第一部分。Lemma 3.2 保证所有 Pontryagin 数消失，Lemma 3.4 保证所有 Stiefel–Whitney 数消失。因此由 Lemma 3.1，$M$ 代表定向配边群中的零元，即存在紧定向流形 $W$，使得 $\partial W=M$。

为了证明奇数维的加强结论，还需要研究 Spin$^{c}$ 配边中的额外障碍。

**Proposition 3.6.** 设 $(M,c)$ 是近乎平坦 Spin$^{c}$ 流形，则它是 Spin$^{c}$ 边界，当且仅当其可能存在的顶维纯 $c$ 特征数为零。

具体地，当 $\dim M=2m$ 时，这个条件就是 $\langle c^m,[M]\rangle=0$；奇数维时该特征数按次数理由自动为零。

证明仍然从 Lemma 3.1 出发。Spin$^{c}$ 配边要求 Stiefel–Whitney 数和所有 $c$-Pontryagin 数消失。前者已经由 Lemma 3.4 解决。由于有理 Pontryagin 类全部消失，任何包含正次数 Pontryagin 类的 $c$-Pontryagin 数也都为零，最后只可能留下纯 $c$ 的顶维特征数。

在偶数维，这个数未必为零，因而仍可能构成 Spin$^{c}$ 配边障碍。在奇数维，因为 $c$ 的次数为 $2$，不存在总次数为奇数的纯 $c$ 单项式，所以所有 $c$-Pontryagin 数自动消失。

由此，任意奇数维近乎平坦 Spin$^{c}$ 流形连同选定的 Spin$^{c}$ 结构，都是 Spin$^{c}$ 边界。Theorem 1.1 得证。

Remark 3.7 进一步指出，以上证明实际上并不需要近乎平坦流形的全部几何结构。只要一个闭 Spin$^{c}$ 流形的有理 Pontryagin 类全部消失，同样能够推出它是定向边界；若维数为奇数，还能够得到 Spin$^{c}$ 配边结论。

因此，近乎平坦性在这条证明中的作用集中于 Lemma 3.2：它为后续整系数 Wu 类计算与指标定理提供了有理 Pontryagin 类消失的条件。

## 四、从 holonomy 群到 Theorem 1.2

Theorem 1.1 以 Spin$^{c}$ 结构的存在为前提。第四节研究如何利用近乎平坦流形的 holonomy 群来保证这一前提。

由 Gromov–Ruh 定理，近乎平坦流形微分同胚于 infranilmanifold。设 $M$ 的有限 holonomy 群为 $G$。其切丛的分类映射可分解为 $M\to BG\to BSO(n)$。

Spin$^{c}$ 结构存在的障碍是第三整系数 Stiefel–Whitney 类 $W_3(TM)=\beta(w_2(TM))$。因此，只需证明该障碍类消失。

**Lemma 4.1.** 设 $P=\operatorname{Syl}_2(G)$。如果 $H^3(P;\mathbb Z)=0$，那么 $M$ 具有 Spin$^{c}$ 结构。

当 $H^3(G;\mathbb Z)=0$ 时，$BG\to BSO(n)$ 与 $W_3:BSO(n)\to K(\mathbb Z,3)$ 的复合映射零同伦，因此分类映射可以提升到 $BSpin^c(n)$。

一般情况下，作者通过 $P$ 对应的奇数次有限覆盖 $\widehat M\to M$ 进行归约。由于 $H^3(P;\mathbb Z)=0$，覆盖空间上的 $W_3$ 消失。又因为 $W_3$ 是二阶挠类，奇数次覆盖上的消失可以通过 transfer 映射下降到 $M$，从而得到 $W_3(TM)=0$。

**Lemma 4.2.** 如果 $P$ 是循环 $2$-群或广义四元数群，则 $H^3(P;\mathbb Z)=0$。

这些群能够自由正交地作用于 $S^3$。对于相应的球面空间形式 $S^3/P$，可以通过附加高维胞腔构造 $BP$，使 $H^3(BP;\mathbb Z)$ 注入 $H^3(S^3/P;\mathbb Z)\cong\mathbb Z$。由于有限群的正次数整系数上同调是有限群，该注入迫使 $H^3(P;\mathbb Z)=0$。

于是，Lemma 4.2 与 Lemma 4.1 共同保证 $M$ 具有 Spin$^{c}$ 结构。再调用 Theorem 1.1，得到 **Proposition 4.3**：若 holonomy 群的 Sylow $2$-子群是循环群或广义四元数群，则 $M$ 是定向边界。

作者随后利用群同调将这一条件改写为 Schur multiplier 的条件。

**Lemma 4.5.** 对任意有限群 $A$，有 $H^3(A;\mathbb Z)=0$ 当且仅当 $H_2(A;\mathbb Z)=0$。

由于有限群的正次数有理上同调消失，系数短正合列 $0\to\mathbb Z\to\mathbb Q\to\mathbb Q/\mathbb Z\to0$ 给出 $H^3(A;\mathbb Z)\cong H^2(A;\mathbb Q/\mathbb Z)$。再利用泛系数定理以及 $\mathbb Q/\mathbb Z$ 的内射性，得到

$$
H^3(A;\mathbb Z)
\cong
\operatorname{Hom}(H_2(A;\mathbb Z),\mathbb Q/\mathbb Z).
$$

由于 $A$ 有限，$H_2(A;\mathbb Z)$ 也是有限群，而 $\mathbb Q/\mathbb Z$ 能检测有限阿贝尔群中的非零元素，因此得到引理结论。

由 Lemma 4.1 与 Lemma 4.5 立即得到 **Lemma 4.6**：如果 $H_2(\operatorname{Syl}_2(G);\mathbb Z)=0$，则 $M$ 具有 Spin$^{c}$ 结构。

这就是 Theorem 1.2 的证明入口。Theorem 1.2 声称，如果 $H_2(G;\mathbb Z)$ 是奇数阶群，则定向近乎平坦流形 $M$ 是边界，并进一步给出若干特殊 Sylow $2$-子群的情形。

不过，这里需要保留一个数学上的核查意见。原文 Remark 4.7 将 $B\operatorname{Syl}_2(G)\to BG$ 的奇数指数性质解释为该映射在 $2$-局部化后是同伦等价，并据此把 $H_2(G;\mathbb Z)$ 的奇数阶条件与 $H_2(\operatorname{Syl}_2(G);\mathbb Z)=0$ 等同起来。这个等价关系一般不成立，因此不能直接用 Remark 4.7 完成整条依赖链。

Theorem 1.2 的第一个结论仍可由其原假设直接推出：当 $H_2(G;\mathbb Z)$ 为奇数阶时，Lemma 4.5 的同构说明 $H^3(G;\mathbb Z)$ 不含非零二阶元素。由于切丛的 $W_3$ 来自 $H^3(BG;\mathbb Z)$ 中的二阶挠类，它必然为零。于是 $M$ 具有 Spin$^{c}$ 结构，再由 Theorem 1.1 得到定向配边。至于原文根据相同 Sylow $2$-子群提出的进一步推论，则需要独立补足论证。

## 五、四维情形与负曲率填充

**Theorem 1.3.** 每个闭定向四维近乎平坦流形都是 Spin$^{c}$ 边界。如果 $M$ 具有 Spin 结构，那么任意给定的 Spin 结构也能延拓到一个 Spin 配边流形。

四维闭定向光滑流形都存在 Spin$^{c}$ 结构，因此可以直接使用 Proposition 3.6。

当 $M$ 不是 Spin 流形时，作者引用 Szczepański 的结果：

**Lemma 5.1.** 如果 $M$ 是非 Spin 的四维定向近乎平坦流形，则 $b_1(M)=1$，且 $b_2(M)=0$。

由于 $b_2(M)=0$，任意 $c\in H^2(M;\mathbb Z)$ 都是挠类，因此 $\langle c^2,[M]\rangle=0$。由 Proposition 3.6，$M$ 是 Spin$^{c}$ 边界。

当 $M$ 具有 Spin 结构时，利用 $\Omega_4^{Spin}\cong\mathbb Z$ 以及 $\widehat A$-genus 对该配边群的单射性即可完成证明。Lemma 3.2 保证 $\widehat A(M)=0$，所以 $M$ 的 Spin 配边类为零。

原文在此处将 K3 曲面的 $\widehat A$-genus 写为 $1$，实际值应为 $2$。这一数值错误不影响证明，因为 $\widehat A:\Omega_4^{Spin}\to\mathbb Z$ 仍是单射。

最后，**Theorem 1.4** 将 Theorem 1.1 与 Ontaneda 的 Riemannian hyperbolization 定理结合。它断言，每个近乎平坦 Spin$^{c}$ 流形都可以作为某个紧流形的边界，并且该填充流形的内部具有完备、有限体积、截面曲率受到负常数双侧控制的黎曼度量。

这一结论使用 Theorem 1.1 已经建立的配边存在性作为输入，再通过 Ontaneda 的几何构造得到负曲率度量。它不需要重新证明 Wu 类或指标定理中的整除关系。

## 六、证明实际依赖的结构

回到 Theorem 1.1，论文最终建立的是这样一条论证：

近乎平坦性通过有限覆盖与 nilmanifold 的可平行化性质，保证所有有理 Pontryagin 类消失。Lemma 3.2 由此消除了定向配边中的 Pontryagin 数障碍，同时使整系数 Spin$^{c}$ Wu 类的有理表达只剩下特征类 $c$ 的幂。

对于剩余的 Stiefel–Whitney 数，作者先通过整系数 Wu 类将它们归约为顶维整数的奇偶性问题。Lemma 2.2 给出 Wu 类系数的分母估计，Lemma 3.3 则由 Spin$^{c}$ Dirac 指标提供顶次幂特征数的整除性。Lemma 3.4 将两者结合，证明全部 Wu 数在模 $2$ 意义下消失，因而全部 Stiefel–Whitney 数消失。Lemma 3.1 最终把特征数的消失转化为定向配边类的消失。

这条证明揭示了一个可以进一步研究的方法：**利用整系数提升，将模 $2$ 的拓扑障碍转化为整数的可除性问题，再借助指标定理消除这些障碍。**

在本文中，这种转化成功的原因是两个独立的算术估计恰好匹配：Wu 类系数的分母受 $2^{m-s_2(m)}$ 控制，而指标定理保证顶维特征数具有 $2^m m!$ 的整除性。Legendre 公式把阶乘中的 $2$-进赋值写成 $m-s_2(m)$，使这两个估计能够直接合并。

因此，主定理的证明可以进一步概括为一项关于整系数特征类的结论：当 Spin$^{c}$ 结构使得 Wu 类可以整提升，而有理 Pontryagin 类消失使其特征数归约到单一的 $c$ 幂时，指标的整数性足以消除原来的模 $2$ 配边障碍。

这也解释了 Remark 3.7 的推广。近乎平坦性是获得有理 Pontryagin 类消失的一条途径；真正支撑后续证明的是这一消失条件，以及 Spin$^{c}$ 结构提供的整系数特征类与 Dirac 指标。