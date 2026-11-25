
## 一、主定理与证明问题

设 $M^n$ 是一个闭实双曲流形。它已经具有常截面曲率为 $-1$ 的黎曼度量，因此所有负截面曲率度量构成的空间 $\mathcal{MET}^{<0}(M)$ 非空。

与恒等映射同伦的微分同胚组成群 $\mathrm{Diff}_0(M)$。它与正实数乘法群共同作用于度量空间：

$$
(\lambda,\phi)\cdot g=\lambda(\phi^{-1})^*g.
$$

对这一作用取商，得到负曲率度量的 Teichmüller 空间 $\mathcal T^{<0}(M)$。若允许任意黎曼度量，相应的商空间记为 $\mathcal T(M)$。

由于所有黎曼度量构成的空间 $\mathcal{MET}(M)$ 可缩，并且在本文的负曲率背景下相关群作用是自由的，$\mathcal T(M)$ 是 $B\mathrm{Diff}_0(M)$ 的一个模型。于是，$\mathcal T(M)$ 的高阶同伦群可以通过微分同胚群的同伦群研究。

负曲率度量空间包含于全体度量空间，因此有自然的遗忘映射 $F:\mathcal T^{<0}(M)\to\mathcal T(M)$。

从纤维丛的角度看，$\mathcal T(M)$ 分类的是具有纤维同伦平凡化的光滑 $M$-丛；$\mathcal T^{<0}(M)$ 还要求这些丛能够配备沿纤维连续变化的负曲率度量。遗忘映射 $F$ 保留光滑丛的信息，同时去掉其负曲率几何结构。

作者希望证明，某些负曲率纤维丛即使忘掉曲率条件，仍然代表光滑丛分类空间中的无限阶同伦类。

**Theorem 1.1** 给出了这一问题的主要结论。

存在正常数 $c$，使得对于每个维数 $n\ge c$ 的闭实双曲流形 $M^n$，都存在一个有限覆盖 $\widetilde M\to M$，满足：对 $\widetilde M$ 的任意进一步有限覆盖 $\widehat M$，至少有某个 $j\in[n+1,2n]$，使得

$$
F_*^{\mathbb Q}:
\pi_j\mathcal T^{<0}(\widehat M)\otimes\mathbb Q
\longrightarrow
\pi_j\mathcal T(\widehat M)\otimes\mathbb Q
$$

非零。

这个结论同时包含几何实现与拓扑非平凡性。映射的定义域要求同伦类具有负曲率几何实现；映射的像非零则说明相应光滑丛类有无限阶。此前 Farrell–Ontaneda 已经证明负曲率 Teichmüller 空间可以具有非平凡同伦，但相关构造在一般度量 Teichmüller 空间中给出的是有限阶元素。本文将这一结论加强到有理同伦层面。

**Remark 1.2** 指出了主定理的维数特征。Igusa 稳定范围为 $j\le\min\{(n-7)/2,(n-4)/3\}$。作者在另一篇论文中证明，在这一稳定范围内，球面底空间上的负曲率纤维丛只能在 $\pi_j\mathcal T(M)$ 中给出有限阶元素。因此，本文所寻找的无限阶类必须出现在稳定范围之外。

这一限制也影响了证明方法。作者需要在高阶同伦群中寻找新的非零类，同时控制这些类对应的纤维丛能否保持负曲率。

## 二、Theorem 1.3：把负曲率问题转化为 Gromoll 映射的非零性

直接计算 $\mathcal T^{<0}(M)$ 的高阶同伦群十分困难。作者选择从圆盘的微分同胚群出发，把局部构造逐步送入闭流形。

记 $\mathrm{Diff}(D^n,\partial)$ 为在边界附近等于恒等映射的圆盘微分同胚群。给定一条基于恒等映射的光滑环路 $t\mapsto f_t\in\mathrm{Diff}(D^{n-1},\partial)$，可以在 $D^{n-1}\times[0,1]$ 上定义 $(x,t)\mapsto(f_t(x),t)$。

将圆柱识别为 $D^n$，便得到 Gromoll 映射 $\alpha_n:\Omega\mathrm{Diff}(D^{n-1},\partial)\to\mathrm{Diff}(D^n,\partial)$。

它把低一维圆盘上的环路族转化为高一维圆盘上的微分同胚族，并在同伦群上诱导 $\alpha_{n*}:\pi_{i+1}\mathrm{Diff}(D^{n-1},\partial)\to\pi_i\mathrm{Diff}(D^n,\partial)$。

论文使用的是连续两次 Gromoll 映射：

$$
\begin{aligned}
\pi_{i+1}^{\mathbb Q}\mathrm{Diff}(D^{n-1},\partial)
&\xrightarrow{\alpha_{n*}^{\mathbb Q}}
\pi_i^{\mathbb Q}\mathrm{Diff}(D^n,\partial)\\
&\xrightarrow{\alpha_{n+1*}^{\mathbb Q}}
\pi_{i-1}^{\mathbb Q}\mathrm{Diff}(D^{n+1},\partial).
\end{aligned}
$$

**Theorem 1.3** 断言：设 $i\ge n+1$。如果上述两个 Gromoll 同态的有理复合非零，那么对于每个 $n$ 维闭实双曲流形 $M$，经过某个有限覆盖后，遗忘映射在第 $i+1$ 阶有理同伦群上非零，而且这一性质在任意进一步有限覆盖下仍然成立。

这一结果把 Theorem 1.1 分成两个部分。首先，需要证明某些 Gromoll 复合确实非零；其次，需要证明这种非零性足以构造负曲率纤维丛。前一个问题留到第四节处理，后一个问题由第二、三节完成。

设 $y\in\pi_{i+1}^{\mathbb Q}\mathrm{Diff}(D^{n-1},\partial)$，并假设 $\alpha_{n+1*}^{\mathbb Q}\alpha_{n*}^{\mathbb Q}(y)\neq0$。令 $x=\alpha_{n*}^{\mathbb Q}(y)$。

从 $x$ 到所需的负曲率纤维丛，还存在两项需要独立验证的条件。

一项是非零性保持：将 $D^n$ 嵌入 $M$，并把圆盘上的微分同胚在其余部分延拓为恒等后，$x$ 不能在 $\pi_i^{\mathbb Q}\mathrm{Diff}_0(M)$ 中消失。

另一项是几何提升：这个全局微分同胚类必须属于 $F_*$ 的像，才能由负曲率 Teichmüller 空间中的同伦类表示。

这两项条件分别由 Lemma 2.2 和 Lemma 3.1 保证。Gromoll 映射恰好在两处发挥不同作用：第一次映射提供几何提升需要的特殊微分同胚形式，第二次映射用于检测延拓之后的非零性。

### Lemma 2.1：局部同伦类的单射性

作者先处理一个较强的假设。

设 $M^n$ 是闭的、可平行化的非正曲率流形。固定嵌入 $\nu:D^n\hookrightarrow M$，将圆盘微分同胚在圆盘外延拓为恒等，得到 $\iota:\mathrm{Diff}(D^n,\partial)\to\mathrm{Diff}_0(M)$。

**Lemma 2.1** 证明：如果 $i\ge n\ge5$，那么 $\iota_*:\pi_i\mathrm{Diff}(D^n,\partial)\to\pi_i\mathrm{Diff}_0(M)$ 是单射。

这个结论排除了局部到整体构造中的一种可能障碍：一个圆盘微分同胚族在圆盘内部无法收缩，但延拓到整个流形后，可能利用圆盘以外的区域完成收缩。Lemma 2.1 说明，在给定几何和切丛条件下，这种情况不会发生。

证明首先借助 Ferry–Weinberger 的结果。对于闭的高维非正曲率流形，从微分同胚群到拓扑同胚群的自然映射在所需高阶同伦群上满射。利用相应纤维序列的同伦正合性，作者把 $\iota_*$ 的单射性转化为拓扑同胚与微分同胚的商空间之间的单射性问题。

Morlet 光滑化理论进一步把这一问题转化为映射空间问题，其目标空间是 $\mathrm{Top}(n)/O(n)$。

于是，需要研究把圆盘内的映射在圆盘外延拓为常值所诱导的同态 $\eta_*$。相应的映射可以由一个塌缩映射描述：

$$
\widehat\eta:(M\times D^{i+1})/\partial\to S^{n+i+1}.
$$

关键在于为 $\widehat\eta$ 构造一个同伦意义下的左逆。由于 $i\ge n$，Whitney 嵌入定理允许将 $M$ 嵌入 $S^{n+i+1}$。可平行化条件使这一嵌入的法丛平凡，因此其管状邻域可写为 $M\times D^{i+1}$。

将管状邻域的补集压缩为一点，得到另一个塌缩映射 $q:S^{n+i+1}\to(M\times D^{i+1})/\partial$。

复合 $\widehat\eta\circ q$ 是球面上的度数为 $1$ 的映射，因此与恒等映射同伦。在映射空间的同伦类上，这意味着 $q^*\widehat\eta^*=\mathrm{id}$，从而 $\widehat\eta^*$ 单射。

回到 Morlet 同构和最初的交换图，便得到 $\iota_*$ 单射，Lemma 2.1 得证。

这个证明中，非正曲率条件用于调用 Ferry–Weinberger 的外部结果；可平行化条件用于建立平凡管状邻域；维数条件则保证所需的高维嵌入以及连接同态的适用性。三者在证明中承担不同作用。

### Lemma 2.2：从可平行化推广到稳定可平行化

实际用于 Theorem 1.3 的双曲流形有限覆盖未必可平行化。作者因此把 Lemma 2.1 推广到稳定可平行化的流形。

一个流形 $M$ 稳定可平行化，是指其切丛 $TM$ 与一个平凡实线丛的 Whitney 和为平凡丛。这个条件自然引出乘积流形 $M\times S^1$：由于 $TS^1$ 平凡，$M\times S^1$ 的切丛也随之平凡。

**Lemma 2.2** 证明：若 $M^n$ 闭、稳定可平行化且具有非正截面曲率度量，$i\ge n+1$，并且某个 $x\in\pi_i^{\mathbb Q}\mathrm{Diff}(D^n,\partial)$ 满足 $\alpha_{n+1*}^{\mathbb Q}(x)\neq0$，那么 $\iota_*^{\mathbb Q}(x)\neq0$。

证明把 Lemma 2.1 应用于 $M\times S^1$，而不是直接应用于 $M$。

与 Gromoll 映射类似，作者考虑从 $\Omega\mathrm{Diff}(M)$ 到 $\mathrm{Diff}(M\times[0,1],\partial)$ 的映射 $\sigma$。它把 $M$ 上的微分同胚环路变成乘积流形上的微分同胚。

另一方面，可以将 $D^{n+1}=D^n\times[0,1]$ 嵌入 $M\times[0,1]$，并通过恒等延拓得到映射 $\tau$。这些构造形成交换图，使 $\sigma_*\circ\iota_*$ 与 $\tau_*\circ\alpha_{n+1*}$ 相容。

再把 $M\times[0,1]$ 放入 $M\times S^1$。由于后者可平行化，并具有乘积非正曲率度量，可以调用 Lemma 2.1，证明从 $\mathrm{Diff}(D^{n+1},\partial)$ 到 $\mathrm{Diff}_0(M\times S^1)$ 的相应延拓同态在所需次数上单射。

由此，$\tau_*$ 在相应同伦群上也单射。若 $\iota_*^{\mathbb Q}(x)=0$，交换图便给出 $\tau_*^{\mathbb Q}\alpha_{n+1*}^{\mathbb Q}(x)=0$。由于 $\tau_*^{\mathbb Q}$ 单射，必有 $\alpha_{n+1*}^{\mathbb Q}(x)=0$，与假设矛盾。

Lemma 2.2 因而成立。

它将第一次 Gromoll 映射得到的局部同伦类与第二次 Gromoll 映射联系起来。只要后者能够检测到非零性，就能保证前者延拓到整个流形之后仍然非零。

**Remark 2.3** 指出，由 Farrell–Hsiang 的结果，在 Igusa 稳定范围内无法满足 Lemma 2.2 所要求的 Gromoll 非零性条件。因此，这套证明天然地依赖于稳定范围之外的同伦信息。

## 三、Lemma 3.1：如何让非零同伦类具有负曲率实现

经过 Lemma 2.2，作者已经能够保证局部微分同胚类延拓后仍然非零。接下来需要证明，同一个类还可以从负曲率 Teichmüller 空间提升。

这正是 **Lemma 3.1** 的作用。

设 $x\in\pi_i\mathrm{Diff}(D^n,\partial)$ 属于 $\alpha_{n*}$ 的像。Lemma 3.1 断言，存在 $r>0$，使得当闭实双曲流形 $(M,g)$ 在某点具有至少为 $3r$ 的单射半径时，可以选择圆盘嵌入 $\nu:D^n\hookrightarrow M$，使 $\iota(\nu)_*(x)$ 属于 $F_*:\pi_{i+1}\mathcal T^{<0}(M)\to\pi_{i+1}\mathcal T(M)$ 的像。

这一引理给出的是一个充分条件：由 Gromoll 映射产生的特殊局部同伦类，可以在含有足够大测地球的双曲流形中实现为负曲率纤维丛。

证明利用以下同伦正合序列中的一段：

$$
\pi_{i+1}\mathcal T^{<0}(M)
\xrightarrow{F_*}
\pi_i\mathrm{Diff}_0(M)
\xrightarrow{\Gamma_{g*}}
\pi_i\mathcal{MET}^{<0}(M),
$$

其中轨道映射 $\Gamma_g$ 由 $\Gamma_g(\phi)=(\phi^{-1})^*g$ 给出。

按照正合性，一个微分同胚群中的同伦类属于 $F_*$ 的像，当且仅当它经过 $\Gamma_{g*}$ 后为零。

因此，Lemma 3.1 的证明目标变成：选择适当的嵌入 $\nu$，使代表 $\iota(\nu)_*(x)$ 的微分同胚族拉回双曲度量后，在负曲率度量空间中零伦。

这里每个拉回度量本身都具有负曲率，但这并不能直接说明整个参数化度量族可以在负曲率空间内部收缩。收缩必须始终保持负截面曲率，这需要额外的几何构造。

### Theorem 3.2：Farrell–Ontaneda 的负曲率收缩定理

论文在此调用 Farrell–Ontaneda 的一个外部结果，并将其表述为 **Theorem 3.2**。

考虑球面环带 $S^{n-1}\times[1,2]$，以及其中由球面同痕产生、在边界附近保持恒等的特殊微分同胚。记这些微分同胚组成的集合为 $G$。

Theorem 3.2 说明：给定任意紧集 $K\subset G$，存在足够大的半径 $r$，使得当闭实双曲流形 $N$ 在某点具有大于 $3r$ 的单射半径时，将 $K$ 中的环带微分同胚放入相应测地球，再通过轨道映射拉回双曲度量，所得映射 $K\to\mathcal{MET}^{<0}(N)$ 与常值映射同伦。

这一结果允许对一个紧参数族同时进行负曲率收缩。紧性在这里不可省略，因为所需的测地球半径必须对整个参数族统一选择。

### Lemma 3.1 的证明

由于 $x$ 属于 $\alpha_{n*}$ 的像，可以取映射 $f:S^i\to\Omega\mathrm{Diff}(D^{n-1},\partial)$，使 $\alpha_n\circ f$ 代表 $x$。

将 $D^{n-1}$ 视为 $S^{n-1}$ 的北半球，便可把 $D^n=D^{n-1}\times[1,2]$ 中的微分同胚放入球面环带。记相应延拓为 $j$。

由于 Gromoll 映射保持最后一个坐标不变，$j\circ\alpha_n\circ f$ 所得到的微分同胚族恰好属于 Theorem 3.2 所考虑的 $G$。

参数空间 $S^i$ 紧致，因此该族的像 $K=(j\circ\alpha_n\circ f)(S^i)$ 是 $G$ 的一个紧子集。

Theorem 3.2 现在可以应用于 $K$。选取足够大的测地球，并将这些环带微分同胚延拓到 $M$，便得到代表 $\iota(\nu)_*(x)$ 的微分同胚族。该定理保证其经过 $\Gamma_g$ 后零伦。

于是 $\Gamma_{g*}\iota(\nu)_*(x)=0$。由前面的同伦正合列，$\iota(\nu)_*(x)\in\operatorname{im}F_*$，Lemma 3.1 得证。

至此，第二节和第三节已经分别建立了所需的两种性质。Lemma 2.2 保证类的非零性；Lemma 3.1 保证同一个类具有负曲率实现。

### Theorem 1.3 的证明

假设两个 Gromoll 映射的有理复合非零。选取 $y\in\pi_{i+1}^{\mathbb Q}\mathrm{Diff}(D^{n-1},\partial)$，使 $\alpha_{n+1*}^{\mathbb Q}\alpha_{n*}^{\mathbb Q}(y)\neq0$。

由于所考虑的是有理化同伦群，可以乘以适当的正整数，将 $y$ 转化为一个整同伦类的有理像。设其整系数代表为 $\bar y$，令 $x=\alpha_{n*}(\bar y)$。

接下来选择双曲流形的有限覆盖，使其同时满足 Lemma 2.2 和 Lemma 3.1 的前提。

首先，闭实双曲流形存在稳定可平行化的有限覆盖；论文在这里引用 Sullivan 和 Okun 的相关结果。其次，通过进一步取有限覆盖，可以获得足够大的测地球，从而满足 Lemma 3.1 的半径要求。

对这样得到的有限覆盖 $\widetilde M$，Lemma 3.1 保证 $\iota_*(x)$ 属于遗忘映射 $F_*$ 的像。另一方面，由于 $\alpha_{n+1*}^{\mathbb Q}(x)\neq0$，Lemma 2.2 保证 $\iota_*^{\mathbb Q}(x)\neq0$。

因此，$F_*^{\mathbb Q}$ 的像中存在一个非零类。

进一步的有限覆盖仍然稳定可平行化，而且可以保持所需的大测地球条件。对这些覆盖重复同样的论证，就得到 Theorem 1.3 的全部结论。

Theorem 1.3 已经完成几何部分的证明。此时只剩下一个具体的同伦论问题：两个连续 Gromoll 映射的复合是否确实能够在高阶有理同伦群上非零？

## 四、Theorem 4.1 与 Lemma 4.2：用 Pontryagin 类检测 Gromoll 映射

作者在第四节引入 Michael Weiss 关于 $B\mathrm{Top}(2m)$ 的有理 Pontryagin 类的结果。

记 $\mathrm{Top}(m)$ 为 $\mathbb R^m$ 的自同胚群，$B\mathrm{Top}(m)$ 为其分类空间。随着维数增加，自然包含 $\mathrm{Top}(m)\hookrightarrow\mathrm{Top}(m+1)$ 诱导一系列稳定化映射。

这些空间中的有理 Pontryagin 类可以用来检测某些高阶有理同伦类。

### Theorem 4.1：Weiss 的非零检测结果

**Theorem 4.1** 是论文引用的外部定理。

存在正常数 $c_1,c_2$，使得对所有满足 $m\ge c_1$、$k>0$、$k<5m/4-c_2$ 的整数 $m,k$，有理 Pontryagin 类 $p_{m+k}\in H^{4m+4k}(B\mathrm{Top}(2m);\mathbb Q)$ 能够在 $\pi_{4m+4k}^{\mathbb Q}(B\mathrm{Top}(2m))$ 上取到非零值。

这里的非零性是指，将同伦类经 Hurewicz 同态送入同调群之后，与 Pontryagin 类进行 Kronecker 配对，可以得到非零有理数。

因此，Weiss 的定理提供了能够由特征类检测的非零有理同伦类。它没有直接涉及负曲率度量，也没有直接研究圆盘微分同胚群。作者需要通过光滑化理论将这一检测结果转移到 Gromoll 映射上。

### Lemma 4.2：将 Gromoll 映射转化为稳定化映射

**Lemma 4.2** 证明：若 $n\ge2c_1+2$，$i\equiv-n+2\pmod4$，并且 $n\le i<\frac72n-11-4c_2$，那么 $\alpha_{n+1*}^{\mathbb Q}\circ\alpha_{n*}^{\mathbb Q}$ 非零。

证明首先利用 Morlet 同构，将圆盘微分同胚群的相关有理同伦群与 $\mathrm{Top}(\ell)/O(\ell)$ 的有理同伦群对应起来。

在这一对应下，连续两次 Gromoll 映射与 $\mathrm{Top}(n-1)/O(n-1)\to\mathrm{Top}(n)/O(n)\to\mathrm{Top}(n+1)/O(n+1)$ 的标准稳定化相容。这里的相容性依赖 Burghelea 关于 Gromoll 映射与稳定化的结果。

接着考虑由 $\mathrm{Top}(\ell)/O(\ell)\to BO(\ell)\to B\mathrm{Top}(\ell)$ 给出的同伦纤维序列。

由于 $i\ge n$，对 $\ell=n-1,n,n+1$，所需次数上的 $BO(\ell)$ 有理同伦群为零。因此，同伦正合列中的连接同态成为同构。

借助这些同构，两个 Gromoll 映射复合的非零性可以转化为标准稳定化映射 $B\mathrm{Top}(n-1)\to B\mathrm{Top}(n)\to B\mathrm{Top}(n+1)$ 在第 $i+n+2$ 阶有理同伦群上的非零性。

现在 Weiss 的定理可以进入证明。

作者选择适当整数 $m,k$，满足 $2m\le n-1$ 以及 $4m+4k=i+n+2$，并使其处于 Theorem 4.1 的适用范围。由 Weiss 的结论，存在 $z\in\pi_{i+n+2}^{\mathbb Q}B\mathrm{Top}(2m)$，使对应 Pontryagin 类与 $z$ 的 Hurewicz 像配对非零。

由于 $2m\le n-1$，可以将 $z$ 沿稳定化映射送入 $B\mathrm{Top}(n+1)$。

设 $\beta$ 表示从 $B\mathrm{Top}(2m)$ 到 $B\mathrm{Top}(n+1)$ 的复合稳定化映射。Pontryagin 类的自然性给出：

$$
\langle\beta^*p,\operatorname{hur}(z)\rangle
=
\langle p,\operatorname{hur}(\beta_*z)\rangle.
$$

左侧由 Weiss 定理非零，因此右侧也非零，从而 $\beta_*z\neq0$。

这证明标准稳定化的复合在相应有理同伦群上非零。再通过 Morlet 同构及前面的交换图，便得到 $\alpha_{n+1*}^{\mathbb Q}\alpha_{n*}^{\mathbb Q}\neq0$，Lemma 4.2 得证。

这一证明将两个原本不同的问题联系起来：圆盘微分同胚群中的 Gromoll 映射通过光滑化理论对应于拓扑向量丛分类空间中的稳定化，而后者的非零性可以由 Pontryagin 类配对检测。

### Theorem 1.1 的证明

现在可以将 Lemma 4.2 代入 Theorem 1.3。

对于充分大的 $n$，选择满足 Lemma 4.2 的同余条件及上界条件的整数 $i$，同时要求 $i\ge n+1$。例如，$n$ 为奇数时可以选择 $i=n+4$，$n$ 为偶数时可以选择 $i=n+2$；在维数充分大时，这些选择符合 Lemma 4.2 的要求。

Lemma 4.2 保证两个 Gromoll 映射的有理复合非零，于是 Theorem 1.3 给出遗忘映射在第 $i+1$ 阶有理同伦群上的非零性。

上述选择还满足 $n+1\le i+1\le2n$，因此该同伦次数恰好落入 Theorem 1.1 要求的区间。

作者取 $c=\max\{2c_1+2,(25+8c_2)/3\}$，由此完成主定理的证明。

