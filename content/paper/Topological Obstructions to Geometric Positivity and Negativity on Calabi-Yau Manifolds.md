
## 一、从几何正负性到拓扑障碍

设 $M_0$ 是一个紧致 Kähler 流形，并且其第一 Chern 类在实上同调中为零，即 $c_1(M_0)=0$。本文将这样的流形称为 Calabi–Yau 流形。这一定义包含复环面、严格 Calabi–Yau 流形以及超 Kähler 流形。

Calabi–Yau 定理保证 $M_0$ 存在 Ricci 平坦的 Kähler 度量。另一方面，Fano 流形与典范极化流形分别对应正、负 Ricci 曲率的 Kähler–Einstein 几何。三种条件由第一 Chern 类的符号区分，但第一 Chern 类依赖于复结构，因此不能直接用来区分底层拓扑空间。

这种区别在复维数为二时已经出现。Catanese–LeBrun 的结果表明，某些光滑四维流形可以同时承载 Fano 复结构和典范极化复结构，甚至存在 Ricci 曲率符号相反的 Kähler–Einstein 度量。因此，几何曲率的符号不能一般性地决定流形的同胚型或微分同胚型。

Calabi–Yau 情形受到更强的限制。Oguiso–Peternell 的 Theorem 1.1 已经证明：当 $M_0$ 的复维数为偶数 $n\geq4$，且 $n\geq6$ 时满足 $b_2(M_0)=1$，它不可能与 Fano 流形保定向同胚。

Ping Li 在这一结果的基础上研究更一般的几何结构。其 Theorem 2.1 将 Fano 条件放宽到 weak Fano，并取消保定向假设；Theorem 2.3 将障碍扩展到准正全纯截面曲率；Theorem 2.4 利用类似方法排除某些紧致 Lie 群作用；Theorem 2.8 则从基本群出发，证明 Calabi–Yau 流形与 Kähler hyperbolic 流形不可能具有同构的基本群。

这些结果涉及不同的几何条件，但证明可以归结为两种方法。前三个定理主要利用 $\widehat A$-亏格的消失性，再通过 Calabi–Yau 分解定理将其转化为上同调障碍。最后一个定理则利用 $L^2$-上同调理论，证明同一个 Euler 示性数必须同时为零和非零。

## 二、Theorem 2.1：弱 Fano 结构的拓扑障碍

Theorem 2.1 断言：设 $M_0$ 是复维数为偶数 $n\geq4$ 的 Calabi–Yau 流形，并在 $n\geq6$ 时进一步假设 $b_2(M_0)=1$。那么 $M_0$ 不可能与任何 weak Fano 流形同胚。

这里 weak Fano 表示反典范线丛 $-K_M$ 为 nef 且 big。nef 要求线丛与每条曲线的交数非负，而 big 则要求线丛具有充分大的渐近截面增长。在本文使用的情形中，两者还允许推出最高自交数 $c_1(-K_M)^n>0$。

### 2.1 Theorem 3.1 与 Lemma 3.2：建立能够穿过同胚的障碍

证明的第一个问题是选择一个能够同时响应几何正性和拓扑不变性的量。

Theorem 3.1 汇集了 Lichnerowicz 与 Atiyah–Hirzebruch 的两个经典结果。对于闭 Spin 流形 $X$，只要它具有准正标量曲率度量，或者具有非平凡的紧致连通 Lie 群光滑作用，就有 $\widehat A(X)=0$。

对于曲率条件，Lichnerowicz 公式 $D^2=\nabla^*\nabla+\frac14S$ 说明，非负且某处严格为正的标量曲率会迫使 Dirac 算子的调和旋量消失。由 Atiyah–Singer 指标定理，Dirac 算子的指标正是 $\widehat A$-亏格，因此它必须为零。

不过，$\widehat A$-亏格是一个有向亏格。反转流形的定向可能改变它的符号，这会妨碍直接使用非保定向同胚。

Lemma 3.2 正好解决这一问题。Novikov 定理保证有理 Pontrjagin 类在同胚下保持不变，而 $\widehat A$-亏格由这些特征类构造。同胚改变定向时，亏格至多改变符号，因此 $\widehat A(X)=0$ 当且仅当 $\widehat A(Y)=0$，只要 $X$ 与 $Y$ 同胚。

于是，一旦能够证明 weak Fano 流形 $M$ 的 $\widehat A$-亏格消失，这一结论便能传递给与它同胚的 Calabi–Yau 流形 $M_0$，而不需要考虑同胚是否保持定向。

### 2.2 Lemma 3.3、Lemma 3.6 与 Theorem 3.7：理解 Calabi–Yau 流形的零亏格

单纯得到 $\widehat A(M_0)=0$ 还不足以完成证明，因为某些 Calabi–Yau 流形确实具有零 $\widehat A$-亏格。作者因此进一步分析这种消失性所要求的几何结构。

Lemma 3.3 给出了第一个联系。对于 Calabi–Yau 流形，$\widehat A$-亏格与 Todd 亏格相等。其原因在于两种亏格的特征类表达式只相差因子 $e^{-c_1/2}$，而这里 $c_1(M_0)=0$。结合 Hirzebruch–Riemann–Roch 定理，得到

$$
\begin{aligned}
\widehat A(M_0)
&=\operatorname{Td}(M_0)\\
&=\chi(M_0,\mathcal O_{M_0})\\
&=\sum_{q=0}^{n}(-1)^q h^{0,q}(M_0).
\end{aligned}
$$

这个等式将 Dirac 算子的指标转换为全纯 Euler 示性数，使 Hodge 理论能够进入证明。

接着，Definition 3.4 区分了两类基本因子：严格 Calabi–Yau 流形（SCY）和超 Kähler 流形。前者在复维数 $d\geq3$ 时单连通，满足 $h^{d,0}=1$，而中间次数的全纯形式消失；后者具有处处非退化的全纯二形式，并且是单连通的。

Lemma 3.6 利用这些 Hodge 数计算 Todd 亏格。复维数为 $d$ 的 SCY 流形 $Y$ 满足 $\operatorname{Td}(Y)=1+(-1)^d$；复维数为 $2m$ 的超 Kähler 流形 $Z$ 满足 $\operatorname{Td}(Z)=m+1$。

因此，奇数复维 SCY 因子的 Todd 亏格为零，而偶数复维 SCY 因子及超 Kähler 因子的 Todd 亏格均非零。

Theorem 3.7，即 Bogomolov–Beauville 分解定理，说明任意 Calabi–Yau 流形经过有限 étale 覆盖后，可以分解为复环面、SCY 流形与超 Kähler 流形的乘积。当原流形单连通时，有限连通覆盖必然平凡，所以这种乘积分解直接发生在原流形上，且不会包含正维复环面因子。

利用亏格对乘积的乘法性，作者得到 Lemma 4.1：

**如果一个单连通 Calabi–Yau 流形 $M_0$ 满足 $\widehat A(M_0)=0$，那么它的乘积分解中必然存在一个奇数复维的严格 Calabi–Yau 因子。**

这是整篇论文前三个主定理共同依赖的结构性结论。

原先的条件仅仅限制一个数值不变量。Lemma 4.1 则表明，这个数值的消失会强制流形出现某种特定的乘积因子。由于该因子具有非零上同调，它最终还会对整个流形的 Betti 数施加限制。

### 2.3 Assertion 4.2 与 Assertion 4.3：从 weak Fano 条件构造特殊线丛

现在假设存在同胚 $M_0\cong M$，其中 $M$ 是 weak Fano 流形。

Assertion 4.2 首先证明 $M$ 是射影且单连通的。由于 $-K_M$ 为 big，$M$ 是 Moishezon 流形；结合 Kähler 性，Moishezon 定理给出射影性。光滑射影流形的 nef 且 big 反典范线丛进一步保证有理连通性，因此 $\pi_1(M)=0$。

同胚使 $M_0$ 也单连通，这为后续使用 Theorem 3.7 创造了条件。

Assertion 4.3 接着证明 $-K_M$ 在 Picard 群中可以被二整除，即存在全纯线丛 $L$，使得 $-K_M=2L$。

这里需要用到 Calabi–Yau 条件和单连通性。因为 $M_0$ 单连通，整数二阶上同调没有挠元；又因为 $c_1(M_0)$ 在实上同调中为零，所以它实际上在整数上同调中也为零。于是其第二 Stiefel–Whitney 类 $w_2(M_0)$，作为 $c_1(M_0)$ 的模二约化，同样为零。

Stiefel–Whitney 类具有同伦不变性，因此 $w_2(M)=0$。对于复流形，这意味着 $c_1(M)$ 在整数二阶上同调中可被二整除。再结合 $M$ 单连通所保证的 Picard 群与相应整数上同调类之间的对应，就得到 $-K_M=2L$。

这一构造使作者获得了一个与反典范线丛密切相关、却适合用于指标计算的线丛 $L$。

### 2.4 Assertion 4.4 与 Assertion 4.5：通过消灭定理得到矛盾

Assertion 4.4 使用 $L$ 证明 $\widehat A(M)=0$。

Hirzebruch–Riemann–Roch 定理给出 $\chi(M,\mathcal O_M(-L))=\widehat A(M)$。因为 $-K_M=2L$，所以 $L$ 仍为 nef 且 big；又因为 $K_M+L=-L$，Kawamata–Viehweg 消灭定理保证 $H^q(M,\mathcal O_M(-L))=0$，其中 $q>0$。

零阶上同调也必须消失。若存在非零有效因子 $D\sim-L$，则由 $L$ 的 nef 性有 $D\cdot L^{n-1}\geq0$；但另一方面 $D\cdot L^{n-1}=-L^n<0$，因为 $L$ 为 nef 且 big。这产生矛盾。

因此全部上同调群都为零，从而 $\chi(M,\mathcal O_M(-L))=0$，即 $\widehat A(M)=0$。

Lemma 3.2 随即将这一结论传递给 $M_0$。由 Lemma 4.1，$M_0$ 的分解中必须出现奇数复维 SCY 因子。

Assertion 4.5 最终利用维数和第二 Betti 数完成证明。

当 $n=4$ 时，奇数复维 SCY 因子的复维数至少为三，而其余允许出现的正维因子的最小复维数为二。由于整个流形的复维数为偶数四，这样的乘积分解无法存在。

当 $n\geq6$ 且为偶数时，奇数复维 SCY 因子不可能独自构成整个流形，因此剩余乘积因子必然也是正维的。每个正维 Kähler 因子都具有非零 Kähler 类，因而贡献非零的二阶上同调。Künneth 公式于是给出 $b_2(M_0)\geq2$，与假设 $b_2(M_0)=1$ 矛盾。

这完成了 Theorem 2.1 的证明。

由 Demailly–Păun 的正性判据，具有准正第一 Chern 类的 Kähler 流形，其第一 Chern 类为 nef 且 big。因此 Corollary 2.2 直接继承 Theorem 2.1 的结论，排除了同样维数和 Betti 数条件下的 Calabi–Yau 流形与这类 Kähler 流形之间的同胚。

## 三、Theorem 2.3：全纯截面曲率怎样进入同一个障碍？

Theorem 2.3 考虑具有准正全纯截面曲率的 Kähler 流形。其结论与 Theorem 2.1 平行：当 Calabi–Yau 流形 $M_0$ 的复维数为偶数 $n\geq4$，且 $n\geq6$ 时满足 $b_2(M_0)=1$，它不可能与具有准正全纯截面曲率的 Kähler 流形同胚。

由于全纯截面曲率和 Ricci 曲率的符号一般不能互相推出，作者无法直接将这个定理归结为 Corollary 2.2。证明需要找到一个能够接受全纯截面曲率条件、并最终触发 $\widehat A$-亏格消失的中间量。

Lemma 5.1 提供了这样的中间量。它利用 Berger 型球面平均公式，说明在一点 $p$ 处，对单位全纯切向量的全纯截面曲率进行平均，可以恢复该点的标量曲率。论文采用的规范下有

$$
\int_{\Sigma_p}H_p(X)\,d\theta(X)
=
\frac{\operatorname{Vol}(\mathbb S^{2n-1})}{n(n+1)}S_g(p).
$$

由于平均系数严格为正，全纯截面曲率处处非负且在某点所有全纯方向上严格为正，就会使标量曲率处处非负且在某点严格为正。因此，准正全纯截面曲率蕴含准正标量曲率。

有了这一联系，证明便能使用 Theorem 3.1 的 Lichnerowicz 部分，但仍需要先确保目标流形满足 Spin 条件。

Assertion 5.3 通过已知的全纯截面曲率结果证明目标 Kähler 流形 $M$ 射影且单连通。具体而言，准正全纯截面曲率推出 $h^{0,2}(M)=0$，再由 Kodaira 嵌入定理得到射影性；另一方面，射影 Kähler 流形的准正全纯截面曲率保证有理连通性，因此 $M$ 单连通。

假设 $M$ 与 $M_0$ 同胚，便可以重用 Assertion 4.3 中关于整数第一 Chern 类和 Stiefel–Whitney 类的论证，得到 $w_2(M)=0$，即 $M$ 是 Spin 流形。

Assertion 5.5 现在同时拥有两个条件：$M$ 为 Spin 流形，并且由 Lemma 5.1 具有准正标量曲率。Theorem 3.1 因而给出 $\widehat A(M)=0$。

Assertion 5.6 不再引入新的消灭定理。它直接调用 Lemma 3.2，将零亏格传递给 $M_0$，然后按 Assertion 4.5 的方式使用 Lemma 4.1，在复维数为四时得到维数矛盾，在更高偶数复维时得到第二 Betti 数矛盾。

因此，Theorem 2.3 与 Theorem 2.1 的证明在最终结构上相同。区别只发生在取得 $\widehat A(M)=0$ 的过程：weak Fano 条件通过半反典范线丛与 Kawamata–Viehweg 消灭定理发挥作用，而全纯截面曲率条件通过标量曲率与 Dirac 算子的消灭定理发挥作用。

## 四、Theorem 2.4 与 Corollary 2.6：从曲率障碍到群作用障碍

Theorem 2.4 将正性条件替换为连续对称性。设 $M$ 是单连通光滑流形，且所有奇数阶 Betti 数均为零。如果 $M$ 具有非平凡的紧致连通 Lie 群光滑作用，那么它不可能与 Calabi–Yau 流形同胚。

这一结果再次使用了 Theorem 3.1，但这一次起作用的是 Atiyah–Hirzebruch 消灭定理。

假设存在同胚 $M\cong M_0$。由于 $M$ 单连通，$M_0$ 也单连通。结合 Calabi–Yau 条件，Assertion 4.3 中的整数上同调论证仍然适用，因而 $w_2(M_0)=0$。由同胚不变性，$w_2(M)=0$，所以 $M$ 是 Spin 流形。

非平凡紧致连通 Lie 群作用与 Spin 条件共同触发 Atiyah–Hirzebruch 定理，得到 $\widehat A(M)=0$。Lemma 3.2 随即给出 $\widehat A(M_0)=0$。

由 Lemma 4.1，$M_0$ 必须包含一个奇数复维 $d$ 的 SCY 因子 $Y$。

这里与 Theorem 2.1 的证明出现了不同的最后一步。由于 $Y$ 是严格 Calabi–Yau 流形，按照定义有 $h^{d,0}(Y)=1$。Hodge 分解因此保证 $H^d(Y;\mathbb C)\neq0$。再由 Künneth 公式，整个乘积流形 $M_0$ 必然满足 $b_d(M_0)>0$。

但 $d$ 是奇数，而 $M$ 的全部奇数阶 Betti 数按假设均为零。同胚不变性使 $M_0$ 也必须满足这些消失条件，于是产生矛盾。

这说明 Lemma 4.1 所提供的奇数复维 SCY 因子，可以产生不同形式的上同调障碍。在 Theorem 2.1 中，它与总复维数的偶性一起迫使第二 Betti 数增加；在 Theorem 2.4 中，它自身的最高次全纯形式直接给出一个非零的奇数阶上同调类。

Corollary 2.6 是 Theorem 2.4 在辛几何中的应用。它断言：Calabi–Yau 流形不可能同胚于具有孤立不动点 Hamilton 圆作用的辛流形。

证明需要检查这种辛流形是否满足 Theorem 2.4 的拓扑条件。Lemma 6.1 正好完成这项工作。

设 $(M,\omega)$ 具有 Hamilton 圆作用，其矩映射为 $f:M\to\mathbb R$。Hamilton 条件意味着生成向量场 $X$ 满足 $\iota_X\omega=df$，而矩映射的临界点恰好是圆作用的不动点。

当不动点孤立时，矩映射是完美 Morse 函数，并且每个临界点的 Morse 指数均为偶数。这是因为临界点附近的辛表示按复权空间分解，每个负权方向贡献两个实维数。

相应的 CW 分解因此只有偶数维胞腔。由于流形连通，它只有一个零维胞腔，也没有一维胞腔，所以 $\pi_1(M)=0$。同时，胞腔链复形的全部边界算子都为零，因为相邻维数中必有一个链群为零。这使整数同调无挠，并保证所有奇数阶 Betti 数消失。

Lemma 6.1 因而使 $M$ 满足 Theorem 2.4 的全部假设，Corollary 2.6 随即成立。

这个推导不需要假设 $M$ 是 Kähler 流形。辛几何中的 Hamilton 对称性先通过 Morse 理论产生拓扑条件，再由这些条件进入 $\widehat A$-亏格和 Calabi–Yau 分解的障碍机制。

## 五、Theorem 2.8：Kähler 双曲性与基本群的冲突

前面三个主定理都依赖于 $\widehat A$-亏格和 Calabi–Yau 的乘积分解。Theorem 2.8 则研究另一种限制：Calabi–Yau 流形能否与 Kähler hyperbolic 流形具有相同的基本群？

作者证明，对于 Calabi–Yau 流形 $M_0$ 和 Kähler hyperbolic 流形 $M$，必有 $\pi_1(M_0)\not\cong\pi_1(M)$，因而两者不可能同伦等价。

Definition 7.1 使用 Gromov 的 Kähler hyperbolicity 概念。设 $\omega$ 是 $M$ 的 Kähler 形式，$p:\widetilde M\to M$ 是万有覆盖。要求提升形式 $p^*\omega$ 可以写成 $d\beta$，其中一形式 $\beta$ 在提升度量下有界。

这个条件允许使用 Gromov 的 $L^2$-Hodge 理论。

Lemma 7.3 断言，复维数为 $n$ 的 Kähler hyperbolic 流形满足 $(-1)^n\chi(M)>0$。特别地，它的 Euler 示性数不为零。

另一方面，Cheeger–Gromov 的 Lemma 7.4 给出了相反的消失结论：如果一个闭光滑流形的基本群是无限 amenable 群，那么其所有 $L^2$-Betti 数均为零。结合 Atiyah 的 $L^2$-指标定理，便得到 $\chi(M)=0$。

因此，只要能证明 Kähler hyperbolic 流形 $M$ 的基本群同时是无限群和 amenable 群，就能由 Lemma 7.3 与 Lemma 7.4 得到矛盾。

Assertion 7.5 正是为了建立这一条件。

假设 $\pi_1(M)\cong\pi_1(M_0)$。由 Theorem 3.7，Calabi–Yau 流形 $M_0$ 具有一个有限 étale 覆盖，它是复环面、SCY 和超 Kähler 因子的乘积。后两类因子单连通，因此这一覆盖的基本群是自由阿贝尔群。

于是 $\pi_1(M_0)$ 含有一个有限指数自由阿贝尔子群，即它是 virtually abelian 群。这样的群是 amenable 的，因此 $\pi_1(M)$ 也 amenable。

接下来证明 $\pi_1(M)$ 无限。

假设它有限，那么万有覆盖 $\widetilde M$ 仍然紧致。由于 $M$ 是 Kähler hyperbolic 流形，提升后的 Kähler 形式满足 $\widetilde\omega=d\beta$。但在紧致无边界流形上，Stokes 定理给出 $\int_{\widetilde M}\widetilde\omega^n=0$，而 Kähler 条件又保证 $\widetilde\omega^n$ 是处处严格正的体积形式。这不可能成立。

因此，$\pi_1(M)$ 必须是无限 amenable 群。

Lemma 7.4 于是迫使 $\chi(M)=0$，但 Lemma 7.3 又要求 $(-1)^n\chi(M)>0$。两者矛盾，Theorem 2.8 得证。

与前面的结果相比，这里的障碍已经发生在基本群层面。作者不需要对整个流形的 Pontrjagin 类或 Hodge 数进行比较。Bogomolov–Beauville 分解只负责提供基本群的 virtually abelian 性，而 Gromov 与 Cheeger–Gromov 的 $L^2$-理论分别对同一个 Euler 示性数施加相互冲突的限制。

## 六、第八节：标量曲率说明了这些障碍的适用边界

前面几个定理排除了特定的 Kähler 曲率条件，但不能由此推断 Calabi–Yau 流形完全禁止正标量曲率。

作者在第八节专门讨论一般黎曼度量的标量曲率符号。

Calabi–Yau 定理保证每个 Calabi–Yau 流形都具有 Ricci 平坦的 Kähler 度量，因此也有零标量曲率度量。另一方面，Kazdan–Warner 的标量曲率规定定理保证，复维数至少为二的 Calabi–Yau 流形还可以承载具有常负标量曲率的黎曼度量。

正标量曲率的情形则与维数和拓扑结构有关。

Proposition 8.1 证明，Calabi–Yau 曲面不可能承载正标量曲率黎曼度量。

由 Theorem 3.7，这样的曲面具有一个有限 étale 覆盖，覆盖空间或者是复二维环面，或者是 K3 曲面。

对于复环面，Schoen–Yau 与 Gromov–Lawson 的结果排除了正标量曲率度量。对于 K3 曲面，由于它是 Spin 流形且满足 $\widehat A(K3)=2\neq0$，Theorem 3.1 的 Lichnerowicz 消灭定理同样排除了正标量曲率。

如果原曲面具有正标量曲率度量，那么把它提升到有限覆盖后，仍将得到正标量曲率度量。这与两类覆盖空间的障碍矛盾，因此 Proposition 8.1 成立。

但 Example 8.2 表明，复维数至少为三时，正标量曲率的存在性会因流形而异。

取椭圆曲线 $E$，复环面 $E^n$ 作为一个例子。由于它是 enlargeable 的 Spin 流形，Gromov–Lawson 的结果排除了正标量曲率度量。

另取射影空间 $\mathbb P^4$ 中的光滑五次超曲面 $X(5)$。它是一个复维数为三、实维数为六的单连通 Calabi–Yau 流形，并且可以承载正标量曲率黎曼度量。对于更高复维数 $n$，乘积 $X(5)\times E^{n-3}$ 仍是 Calabi–Yau 流形；将 $X(5)$ 上的正标量曲率度量与椭圆曲线上的平坦度量相乘，就得到新的正标量曲率度量。

因此，在每个复维数 $n\geq3$，都存在不能承载正标量曲率度量的 Calabi–Yau 流形，也存在能够承载这种度量的 Calabi–Yau 流形。

这一事实限定了前面定理的解释范围。Theorem 2.1 和 Theorem 2.3 排除的是特定的复几何正性结构，而一般黎曼度量的正标量曲率条件较弱，不能与这些结论混为一谈。

## 七、第九节：复曲面上的同伦障碍

附录回到复维数为二的情形。作者分别讨论 Fano 曲面和典范极化曲面与 Calabi–Yau 曲面的同伦型。

Proposition 9.1 证明，Fano 曲面与 Calabi–Yau 曲面不可能同伦等价。

根据 del Pezzo 曲面的分类，Fano 曲面只能是 $\mathbb P^2$、$\mathbb P^1\times\mathbb P^1$，或者是在一般位置的至多八个点处对 $\mathbb P^2$ 作吹起得到的曲面。因此，每个 Fano 曲面都单连通，并且满足 $b_2\leq9$。

另一方面，根据 Enriques–Kodaira 分类，Calabi–Yau 曲面只能属于 K3 曲面、Enriques 曲面、复二维环面和 bielliptic 曲面这四类。

后三类曲面的基本群均非平凡，因此不可能与单连通 Fano 曲面同伦等价。剩余的 K3 曲面虽然单连通，却满足 $b_2(K3)=22$，与 Fano 曲面的 $b_2\leq9$ 相矛盾。

因此，单靠基本群与第二 Betti 数，就足以完成 Proposition 9.1 的证明。

Proposition 9.2 则证明，典范极化曲面与 Calabi–Yau 曲面同样不可能同伦等价。

作者使用的主要工具是 Hirzebruch 符号差公式。对于复曲面 $S$，有 $3\sigma(S)=c_1^2(S)-2c_2(S)$。

设 $S_-$ 是典范极化曲面，$S_0$ 是 Calabi–Yau 曲面，并假设两者同伦等价。

如果同伦等价保持定向，那么它保持符号差与 Euler 示性数。由于复曲面的第二 Chern 数等于 Euler 示性数，上述公式便迫使 $c_1^2(S_-)=c_1^2(S_0)$。但典范极化条件给出 $c_1^2(S_-)>0$，而 Calabi–Yau 条件给出 $c_1^2(S_0)=0$，产生矛盾。

如果同伦等价反转定向，Euler 示性数仍然不变，但符号差改变符号。将这两个关系代入 Hirzebruch 公式，可以推出 $c_1^2(S_-)=4c_2(S_-)$。

另一方面，典范极化曲面满足 Miyaoka–Yau 不等式 $c_1^2(S_-)\leq3c_2(S_-)$。由于 $c_1^2(S_-)>0$，必有 $c_2(S_-)>0$，于是两个关系互相矛盾。

因此，不论是否保持定向，典范极化曲面与 Calabi–Yau 曲面都不可能同伦等价。

## 八、证明结构与方法的意义

论文中的正性结果具有明确的共同结构。

Theorem 3.1 提供了几何条件导致 $\widehat A$-亏格消失的途径；Lemma 3.2 保证这一消失性能够在同胚下传递；Lemma 3.3 将 $\widehat A$-亏格转换为 Todd 亏格；Lemma 3.6 和 Theorem 3.7 则解释 Todd 亏格在 Calabi–Yau 乘积分解中的行为。

这几项结果最终汇集为 Lemma 4.1：单连通 Calabi–Yau 流形的零 $\widehat A$-亏格要求存在奇数复维 SCY 因子。

之后的证明只需依据具体假设选择不同的上同调障碍。Theorem 2.1 利用偶数复维数和 $b_2=1$ 排除这种乘积分解；Theorem 2.3 先利用曲率平均与 Lichnerowicz 定理取得相同的零亏格条件，然后重复上述矛盾；Theorem 2.4 则直接利用 SCY 因子的非零奇数阶上同调，与目标流形的奇数 Betti 数消失条件矛盾。Corollary 2.6 进一步通过 Hamilton 圆作用的 Morse 理论，将辛几何问题归入 Theorem 2.4。

Theorem 2.8 使用了不同的障碍。Bogomolov–Beauville 分解限制 Calabi–Yau 流形的基本群结构，Kähler hyperbolicity 和无限 amenable 基本群则分别要求 Euler 示性数非零与为零，从而排除基本群同构。

这些证明中，$\widehat A$-亏格的使用尤其值得注意。它的消失本身并不足以排除 Calabi–Yau 结构，因为确有零亏格的 Calabi–Yau 流形。作者通过分解定理进一步确定零亏格必须由何种因子产生，再利用因子的上同调性质得到更强的限制。

这种方法可以理解为一种逐层细化的障碍构造：几何条件首先决定指标的取值，指标的取值进一步限制流形的分解结构，而分解结构最终与 Betti 数或维数条件发生冲突。

论文的结果仍有明确边界。Theorem 2.1 与 Theorem 2.3 在较高偶数复维数下依赖于 $b_2=1$；Theorem 2.8 排除的是 Kähler hyperbolicity，而非一切负曲率几何。复维数为三的 Calabi–Yau 流形是否可能与某些 Fano 三维流形同胚，仍然是文中提及的开放问题。

从方法上看，后续可以研究在 $b_2>1$ 时，能否用更精细的指标、特征数或上同调结构替代 Lemma 4.1 最后一步所使用的第二 Betti 数限制。这一方向直接对应当前证明的缺口，但现有结果尚不能判断去掉该假设后主定理是否仍成立。