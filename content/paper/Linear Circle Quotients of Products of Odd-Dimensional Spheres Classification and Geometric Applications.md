

## 一、从圆周作用到稳定切丛：分类不变量的来源

设 $a=(a_1,\ldots,a_{n+1})$、$b=(b_1,\ldots,b_{n+1})$ 为两组整数权重。在 $S^{2n+1}\times S^{2n+1}\subset\mathbb C^{n+1}\times\mathbb C^{n+1}$ 上，考虑由这些权重决定的对角线性圆周作用，并将其轨道空间记为 $M_{a,b}$。

作者希望通过权重判断两个轨道空间何时同伦等价、PL 同胚或微分同胚。三种等价关系所保留的信息不同，因此首先需要确定哪些权重信息能够转化为流形本身的不变量，以及这些不变量能否完全决定相应的分类。

**Proposition 2.1** 给出自由作用的充要条件：任意 $a_i,b_j$ 都满足 $\gcd(|a_i|,|b_j|)=1$。证明直接考察两个球面上仅有一个非零坐标的点。该点的稳定子同时满足 $z^{a_i}=z^{b_j}=1$，所以自由性等价于这些整数两两互素。令 $A(a)=\prod_i a_i$、$B(b)=\prod_j b_j$，便进一步得到 $\gcd(|A(a)|,|B(b)|)=1$。

这个条件随后进入上同调计算。自由作用给出主圆周丛 $S^1\to S^{2n+1}\times S^{2n+1}\to M_{a,b}$，其分类映射 $f:M_{a,b}\to\mathbb{CP}^{\infty}$ 的同伦纤维是两个球面的乘积。由此可以建立 Serre 谱序列。

**Lemma 2.2** 计算其中的关键微分。两个球面因子的基本上同调类 $u,v$ 分别满足 $d_{2n+2}(u)=A(a)x^{n+1}$ 和 $d_{2n+2}(v)=B(b)x^{n+1}$。这一计算来自坐标投影的自然性：单个加权球面的 Borel 构造是相应复表示丛的单位球面丛，其基本类的传递微分正好是该表示丛的 Euler 类。

由于 $A(a)$ 与 $B(b)$ 互素，上述微分从 $\mathbb Z^2$ 到 $\mathbb Z$ 满射，其核是秩一的自由群。**Corollary 2.3** 因此得到

$$
H^*(M_{a,b};\mathbb Z)
\cong
\mathbb Z[x,y]/(x^{n+1},y^2),
\qquad |x|=2,\quad |y|=2n+1.
$$

结合主圆周丛的同伦正合列，还可证明 $M_{a,b}$ 单连通，并且分类映射 $f$ 是 $(2n+1)$-连通的。

这一步揭示了分类的第一个困难：所有轨道空间都有与 $\mathbb{CP}^n\times S^{2n+1}$ 相同的整系数上同调环。权重的差异无法由普通上同调识别，需要保留更多的向量丛信息。

**Proposition 2.4** 给出了所需的信息。将两个球面分别视为圆周复表示 $V_a,V_b$ 的单位球面，利用球面切丛的径向分解，可得 $TP\oplus\varepsilon^2\cong P\times(V_a\oplus V_b)_{\mathbb R}$，其中 $P=S^{2n+1}\times S^{2n+1}$。另一方面，自由圆周作用产生的垂直切向量场给出 $TP\cong p^*TM_{a,b}\oplus\varepsilon^1$。将这两个等变丛同构合并并下降到商空间，得到

$$
TM_{a,b}\oplus\varepsilon^3
\cong
f^*\left(
\bigoplus_iL^{a_i}\oplus\bigoplus_jL^{b_j}
\right)_{\mathbb R}.
$$

其中 $L$ 是 $\mathbb{CP}^{\infty}$ 上的通用复线丛。由 Whitney 乘积公式，$p(TM_{a,b})=\prod_i(1+a_i^2x^2)\prod_j(1+b_j^2x^2)$。因此第 $k$ 个 Pontryagin 类的系数就是所有权重平方的第 $k$ 个初等对称多项式，记为 $\Pi_k(a,b)$。

从自由作用出发，作者至此已经获得了一条明确的转换关系：整数权重决定稳定切丛，而稳定切丛决定 Pontryagin 类。但 Pontryagin 类未必能恢复完整的稳定实向量丛。

为此，作者利用 Corollary 2.3 的连通性，通过障碍理论构造一个映射 $i:\mathbb{CP}^n\to M_{a,b}$，使得 $f\circ i$ 同伦于标准包含 $\mathbb{CP}^n\hookrightarrow\mathbb{CP}^{\infty}$。这个映射称为 *projective stage*。它把流形的稳定切丛限制到实 $K$ 理论可以具体计算的有限复射影空间上。

**Lemma 2.6** 引入 Fujii 和 Sanderson 的计算结果。当 $n\not\equiv1\pmod4$ 时，$\mathbb{CP}^n$ 上固定秩的稳定实向量丛由 Pontryagin 类决定；当 $n=4r+1$ 时，$\widetilde{KO}(\mathbb{CP}^{4r+1})$ 还包含一个由 $\mu^{2r+1}$ 生成的二阶扭子群，其中 $\mu=[L_{\mathbb R}]-2$。

因此，在后一种维数中，即使所有 Pontryagin 类相同，稳定实向量丛仍可能相差一个二阶扭元。作者将该扭元的系数记为 $\delta(M)$。

要将它用于分类，还必须证明这个系数在同胚下保持不变。**Proposition 2.7** 为此研究稳定 $J$-同态 $J:\widetilde{KO}(\mathbb{CP}^{4r+1})\to\widetilde J(\mathbb{CP}^{4r+1})$，证明其核与上述二阶扭子群的交只有零元。

证明中使用 Obiedat 的局部化公式。假设非零扭元属于 $\ker J$，则它可以写成 $(\psi^3-1)v$，其中 $\psi^3$ 是 Adams 运算。在去掉扭元的自由商群上，$\psi^3-1$ 具有非零的有理特征值，因此 $v$ 必须属于扭子群。但 $\psi^3$ 在这个二阶扭子群上的作用是恒等映射，从而 $(\psi^3-1)v=0$，产生矛盾。

稳定 $J$-类由 Spivak 正规球面纤维化控制；若同伦等价同时保持有理 Pontryagin 类，两个稳定丛的差便只能落入该扭子群，继而由上述单射性推出差为零。对于同胚，Novikov 定理提供所需的有理 Pontryagin 类不变性。这样便证明了 $\delta(M)$ 是同胚不变量。

**Proposition 2.8** 随后将这个抽象的 $KO$ 不变量写成权重公式。对单个实化线丛 $E_m=(L^m)_{\mathbb R}$，实张量积满足 $E_1\otimes_{\mathbb R}E_m\cong E_{m+1}\oplus E_{m-1}$。由此得到与第一类 Chebyshev 多项式相同的递推关系，进而将 $[E_m]-2$ 展开为 $\mu$ 的整数系数多项式。

取其中 $\mu^{2r+1}$ 的系数模 2，再对全部权重求和，就得到显式不变量 $\Delta_r(a,b)$，并证明 $\delta(M_{a,b})=\Delta_r(a,b)$。

因此，Lemma 2.6 指出的信息缺失由 Proposition 2.7 和 2.8 完全补上。对于这一流形族，Pontryagin 系数 $\Pi_k$ 与特殊维数中的 $\Delta_r$ 恰好确定 projective stage 上的稳定实切丛类。

然而，稳定丛分类仍然不能直接推出流形分类。相同的稳定切丛数据只控制了法丛的一部分信息，流形之间还可能存在正规边缘障碍和手术障碍。

## 二、从稳定法丛到 PL 同胚：Theorem 1.5 的证明

作者接下来使用 Kreck 的 modified surgery theory。其思路是先将两个流形的正规数据放在共同的分类空间中，再证明它们在适当的 PL 正规边缘群中相等，最后利用手术理论将这种边缘关系提升为 PL $h$-cobordism。

设 $M=M_{a,b}$。Projective stage 给出余纤维序列 $\mathbb{CP}^n\to M\to Q_M$，其中 $Q_M$ 是 $2n$-连通的。利用 Lemma 2.6 的满射结论，可以选取 $\mathbb{CP}^{\infty}$ 上的虚实向量丛 $\xi$，使它限制到 $\mathbb{CP}^n$ 后与 $M$ 的稳定法丛一致。

于是，稳定法丛与 $f^*\xi$ 的差来自 $Q_M$ 上的一个类 $\bar\rho_M$。要构造 normal $2n$-type，需要证明这个剩余类可以通过 $BO\langle2n+2\rangle$ 分类。

**Lemma 3.1** 完成了这一步。由于 $P=S^{2n+1}\times S^{2n+1}$ 稳定平行化，$M$ 的稳定法丛拉回到 $P$ 后平凡。又因为 $f\circ p$ 零伦，所以 $\bar\rho_M$ 沿复合映射 $P\to Q_M$ 的拉回也平凡。作者结合 Gysin 序列与 Hurewicz 定理，证明这一复合映射在 $H_{2n+1}$ 上满射，因此 $\bar\rho_M$ 在 $Q_M$ 的最低非平凡同伦维度上没有障碍。由于 $Q_M$ 已经 $2n$-连通，所需的高连通覆盖提升便存在。

现在假设 $M_{a,b}$ 与 $M_{a',b'}$ 的全部 $\Pi_k$ 相同，并在需要时具有相同的 $\Delta_r$。由 Lemma 2.6 和 Proposition 2.8，它们在 projective stage 上的稳定法丛相同。**Proposition 3.2** 因而能够选择一个共同的虚丛 $\xi$，再利用 Lemma 3.1 对各自剩余法丛进行提升，构造两个映入同一 normal $2n$-type 的 normal $2n$-smoothings，其底空间同伦等价于 $\mathbb{CP}^{\infty}\times BO\langle2n+2\rangle$。

共同的 normal type 使两个流形的正规边缘类可以在同一个群中比较，但并不保证它们相等。接下来的任务是控制这些类在 Atiyah–Hirzebruch 谱序列中的位置。

**Lemma 4.1** 首先证明相关的 $(4n+1)$ 维正规边缘群是有限群。其理由是 Thom 谱 $MO\langle2n+2\rangle$ 的有理同调只可能出现在四的倍数维度，而基空间 Thom 谱的有理同调位于偶数维度；在奇数总维度 $4n+1$ 上，谱序列不存在自由的有理部分。

有限性在后面用于把逐素数的结论重新合并为整数结论。

为了将正规边缘类压入低过滤层，作者没有直接计算整个边缘群，而是利用原始圆周作用的两个坐标投影。

**Lemma 4.2** 先研究单个加权球面 $S_c^{2n+1}$ 的 Borel 构造 $X_c$。若权重乘积的绝对值为 $k>0$，Gysin 序列表明 $X_c$ 的低维偶数上同调为 $\mathbb Z$，高维偶数上同调为 $\mathbb Z/k$，奇数上同调为零。于是，高维同调中的非零部分受到整数 $k$ 的控制。

回到两个球面的乘积。Proposition 2.1 已保证 $A(a)$ 和 $B(b)$ 互素，所以对于任意素数 $p$，至少可以从两个权重乘积中选取一个不被 $p$ 整除的非零整数。对应的球面坐标投影是 $S^1$-同变映射，因而诱导 Borel 构造之间的映射。

**Proposition 4.3** 因此证明：对每个素数 $p$，分类映射 $f:M\to\mathbb{CP}^{\infty}$ 都可以经过一个空间 $X_p$ 分解，而且 $H_s(X_p;\mathbb Z_{(p)})=0$ 对所有 $s\geq2n+1$ 成立。

这一步是线性圆周商空间在证明中的特殊优势。互素条件允许作者避开每一个素数，而两个坐标投影又提供了实际的同变映射。仅有总空间与球面乘积同伦等价，并不足以保证同样的分解存在。

**Proposition 4.5** 利用这一分解和谱序列的自然性，将 $M$ 的正规边缘类在每个素数局部化之后都限制到过滤层 $F_{2n,2n+1}$。再使用 Lemma 4.1 的有限性，得到整数层面的结论：$[M,\bar\nu_M]\in F_{2n,2n+1}$。

这样，原来可能分布在较高过滤层中的正规边缘类，被限制到了一个固定的低过滤层。作者随即考察从光滑法丛到 PL 法丛的遗忘映射，希望证明这个过滤层在 PL 边缘群中消失。

**Lemma 5.1** 计算高连通 PL bordism 谱在相关奇数维度上的系数群。对于 $n\geq4$，这些群消失，可以通过低于中维的手术把代表元化为 PL 同伦球面，再利用 PL 同伦球面的标准性得到零边缘类。

但这一消失结论不能直接覆盖所有低维情况。特别是 9 维所涉及的一个光滑系数群，需要单独比较它在 PL 范畴中的像。

**Proposition 5.2** 证明 $\Omega_9^{O\langle8\rangle}\to\Omega_9^{PL\langle8\rangle}$ 是零映射。这里利用 Kervaire–Milnor 的结果，将前者的元素表示为具有相应正规结构的同伦 9 球面；遗忘光滑结构后，这些球面都 PL 同胚于标准球面，因此其 PL 边缘类为零。

结合 Lemma 5.1 与 Proposition 5.2，并分别处理 $n=2,3$ 的谱序列过滤层，**Proposition 5.3** 最终证明：对所有 $n\geq2$，光滑正规边缘群到 PL 正规边缘群的遗忘映射在 $F_{2n,2n+1}$ 上为零。

由 Proposition 4.5，两个轨道空间的光滑正规边缘类都属于这个过滤层；由 Proposition 5.3，它们映入 PL 正规边缘群后都为零。**Corollary 5.4** 因而得到，两个具有相同分类不变量的轨道空间，其规范 PL normal smoothings 是 normally bordant 的。

此时只剩下把 normal bordism 改造成 PL $h$-cobordism。

**Proposition 6.1** 为此使用 Kreck 的 modified surgery theorem。通过低于中维的手术，可以先使 bordism 的正规映射达到所需的连通性；剩余障碍集中于中维的二次型。

对于 $n=3$，Kreck 理论中的特殊形式参数由八元数 Hopf 丛的非平凡 $w_8$ 控制，使相应的手术障碍群直接消失。

对于其他 $n$，障碍群由 $L_{4n+2}(\mathbb Z)\cong\mathbb Z/2$ 控制。作者利用具有 Arf 不变量 1 的 Kervaire–Arf plumbing，将非零 Wall 障碍实现为一个 PL 构造，再通过 bordism 内部的连通和把相反的障碍加到原来的中维二次型上。修正后的手术障碍为零，因此能够得到 PL $h$-cobordism。

由于边界流形单连通，PL $h$-cobordism 定理给出 PL 同胚。

至此完成 **Theorem 1.5** 的充分性：权重对应的 $\Pi_k$ 相同，并且特殊维数中的 $\Delta_r$ 相同，就能通过共同 normal type、低过滤层控制和 modified surgery 构造 PL 同胚。

必要性则由 Proposition 2.4 的 Pontryagin 类公式、Novikov 的有理 Pontryagin 类拓扑不变性以及 Proposition 2.7 的 $KO$ 扭元不变性得到。论文对 $n=1$ 另用 Smale–Barden 的单连通五维流形分类处理，此时唯一需要的 $\Delta_0$ 正好区分 spin 与 non-spin 两种类型。

整条证明说明，在这一特定流形族中，projective stage 上相同的稳定实丛类足以决定 PL 同胚类型；这个充分性依赖于自由线性作用带来的逐素数分解，以及 PL 正规边缘和中维手术障碍的消失。

## 三、13 维的光滑分类：从 PL 同胚到微分同胚

Theorem 1.5 完成的是 PL 分类。若要进一步得到微分同胚，还需控制遗忘光滑结构时丢失的信息。对于 13 维轨道空间，作者按 $\lambda=\sum_i(a_i^2+b_i^2)$ 的奇偶与模 4 同余类，采用两条不同的证明路线。

先考虑 $\lambda$ 为奇数的 non-spin 情形。

**Lemma 7.1** 利用第 5 节已有的过滤层关系，将 13 维轨道空间的光滑正规边缘类进一步限制在 $F_{4,9}$。因此无需计算整个 $\Omega_{13}^{O\langle8\rangle}(\xi_\lambda)$，只需处理这个较低的部分。

**Lemma 7.2** 给出了决定该过滤层的 Atiyah–Hirzebruch 谱序列微分：$d_2:E^2_{6,8}\to E^2_{4,9}$ 由模 2 约化以及 Steenrod 运算 $Sq^2$ 的同调对偶描述。

当 $\lambda$ 为奇数时，稳定法丛的第二 Stiefel–Whitney 类非零。由 Thom 恒等式，作用于 Thom 类的 $Sq^2$ 因而非平凡。**Proposition 7.3** 利用这一事实证明，上述微分满射，从而消去过滤层 $F_{4,9}$ 中的全部二阶部分。剩余部分只能来自 $\Omega_{13}^{O\langle8\rangle}\cong\mathbb Z/3$，并且非零元可以由 exotic 13-sphere 表示。

于是，具有相同 $\lambda$ 的两个 non-spin 13 维轨道空间，其正规边缘类至多相差一个同伦球面的边缘类。结合 Proposition 6.1 在 13 维光滑范畴中的结论，**Theorem 7.4** 得到

$$
M\cong_{\mathrm{Diff}}M'\#\Sigma^{13},
\qquad
\Sigma^{13}\in\Theta_{13}\cong\mathbb Z/3.
$$

这个结论还不是完整分类，因为连通和中的 exotic sphere 可能改变微分结构。

**Lemma 7.5** 利用两个球面上的同时复共轭，构造每个轨道空间的反转定向自微分同胚。复共轭把圆周参数 $z$ 变为 $z^{-1}$，因此可以下降到商空间；它在总空间上保持定向，却反转圆周纤维定向，所以在商空间上反转定向。

**Lemma 7.6** 给出了消去剩余同伦球面的准则：如果两个闭定向流形都具有反转定向自微分同胚，而它们的微分结构只相差一个奇数阶同伦球面的连通和，那么这个差异可以消除。具体地，反转定向把 $\Sigma$ 换成 $-\Sigma$，从而推出 $2[\Sigma]$ 属于相应流形的惯性群；在奇数阶循环群上乘以 2 可逆，因此 $[\Sigma]$ 本身也属于惯性群。

由于 $\Theta_{13}\cong\mathbb Z/3$，Theorem 7.4 中剩余的差异满足这一准则。**Theorem 7.7** 最终证明，两个 non-spin 13 维轨道空间微分同胚，当且仅当它们的 $\lambda$ 相同。

对于 $\lambda\equiv0\pmod4$ 的 spin 情形，上述通过 $d_2$ 消去全部二阶边缘障碍的方法不再适用，作者转而从 PL 分类得到的同胚出发，分析其光滑正规不变量。

设 $h:M'\to M$ 是 Theorem 1.5 提供的 PL 同胚。**Lemma 7.9** 利用 $\mathrm{PL}/O$ 的 6-连通性以及 $G/O$ 的低维同伦群消失，证明其光滑正规不变量 $\eta^{\mathrm{Diff}}(h)$ 落在骨架过滤层 $\mathcal F^9[M,G/O]$。

因此需要控制的低维差异已经集中在第九过滤层。

**Lemma 7.12** 计算该过滤层的二阶部分，证明 $\mathcal F^9[M,G/O]_{(2)}\cong\mathbb Z/2$，而 $\mathcal F^{10}[M,G/O]_{(2)}=0$。非零元记为 $\theta_M$，由谱序列中的 $\bar x\bar y\otimes[\nu^3]$ 检测。

作者接着构造一个具有该正规不变量的自同伦等价，以抵消 $h$ 的可能障碍。

具体构造使用 projective stage $i:\mathbb{CP}^3\to M$、Hopf 映射 $H:S^7\to\mathbb{CP}^3$ 和稳定同伦元素 $\nu^2$ 的不稳定代表。先将 $M$ 中一个圆盘压缩，得到 pinch map $M\to M\vee S^{13}$，再把球面因子通过 $S^{13}\to S^7\xrightarrow{H}\mathbb{CP}^3\xrightarrow{i}M$ 映回 $M$。

**Lemma 7.13** 证明所得映射是保持定向的切向自同伦等价。其同伦等价性来自它在整数同调上诱导恒等映射；切向性质则利用 Bott 周期性给出的 $\widetilde{KO}(S^{13})=0$。与此同时，Pontryagin–Thom 构造将其切向正规不变量表示为 Thom 谱附着映射与 $\nu^2$ 的复合。

关键的检测由 **Proposition 7.14** 完成。条件 $4\mid\lambda$ 使相关虚丛的 $w_2,w_4$ 都消失，作者利用 Thom 恒等式和 $Sq^2,Sq^4$ 计算附着映射的稳定分量。复合 $\nu^2$ 后，非零的 $\nu^3$ 分量恰好存活。再通过 Spanier–Whitehead 对偶和 projective stage 嵌入的 Gysin 映射，这一分量对应到 $\mathcal F^9[M,G/O]_{(2)}$ 的生成元 $\theta_M$。

由此证明 **Lemma 7.10**：确实存在一个自同伦等价，其光滑正规不变量的二阶部分就是 $\theta_M$。

现在，如果原来的 PL 同胚具有非零二阶正规不变量，就将它与上述自同伦等价复合。正规不变量的复合公式表明，两个相同的二阶元相加后消失。这样便可以把原问题归约到第九过滤层的二阶部分为零的情况。

**Lemma 7.11** 证明，在这种条件下，剩余正规不变量只能位于最高过滤层，并由 $\pi_{13}(G/O)\cong\mathbb Z/3$ 控制。利用光滑手术正合序列，可以用一个 exotic 13-sphere 的连通和消去它；剩余的 $L_{14}$ 作用也因 $bP_{14}=0$ 而不再产生新的歧义。

最后再次应用 Lemma 7.5 和 7.6 消去奇数阶 exotic sphere，便得到 **Theorem 7.8**：当 $\lambda=\lambda'\equiv0\pmod4$ 时，两个 13 维轨道空间微分同胚。

这一路线也说明了条件 $4\mid\lambda$ 的具体作用。它保证 pinch map 的正规不变量可以检测并消去第九过滤层的非零二阶元。论文的 Remark 7.15 指出，当 $\lambda\equiv2\pmod4$ 时，同一构造的检测分量为零，所以目前的证明不能覆盖这一同余类；这仅是该构造的限制，并不构成剩余情形无法分类的结论。

## 四、9 维的光滑分类：利用顶胞腔附着映射消去手术障碍

9 维 non-spin 情形同样从 Theorem 1.5 的 PL 同胚出发，但作者使用的是光滑手术正合序列，并把关键计算放在流形的 CW 分解上。

**Lemma 8.1** 证明，9 维轨道空间具有形如 $(\mathbb{CP}^2\vee S^5)\cup_\beta e^7\cup_\alpha e^9$ 的 CW 模型。这个分解允许作者单独研究顶胞腔的附着映射 $\alpha$。

当 $\lambda$ 为奇数时，$M$ 非 spin，且 $w_2(M)=\bar x$。由 Wu 公式，$Sq^2(\bar x\bar y)=\bar x^2\bar y\neq0$。这一非零 Steenrod 运算检测顶胞腔附着映射在第七维球面上的分量。

**Lemma 8.2** 因而证明：若将七骨架的六骨架压缩为一点，则 $S^8\xrightarrow{\alpha}M^{(7)}\to S^7$ 表示 $\pi_8(S^7)\cong\mathbb Z/2$ 中的非零元素 $\eta_7$。

这个附着映射的信息直接用于消去光滑正规不变量。

设 $h:M'\to M$ 为 PL 同胚。由于 $\mathrm{PL}/O$ 的连通性，$h$ 的光滑正规不变量限制到七骨架后已经为零。剩余部分只能来自顶胞腔压缩映射所诱导的 $\pi_9(G/O)\to[M,G/O]$。

**Proposition 8.3** 利用 Lemma 8.2 和已知的 $\eta^*:\pi_8(G/O)\to\pi_9(G/O)$ 满射性，证明顶胞腔压缩诱导的映射为零。因此，所有由 PL 同胚产生的光滑正规不变量都为零。

但是，在光滑手术正合序列中，正规不变量为零仍不足以保证对应结构是标准的。此时还存在一个 $L_{10}(e)\cong\mathbb Z/2$ 的作用，需要证明它不能产生新的光滑结构差异。

**Lemma 8.4** 构造一个元素 $u\in[\Sigma M,G/O]$，使它对六维 Kervaire 类 $k_6$ 的拉回非零。构造从 $\Sigma S^5=S^6$ 上的稳定同伦元素 $\nu^2$ 开始，先延拓到悬挂后的七骨架，再利用 Lemma 8.2 提供的 $\eta$ 附着分量和上述满射性，修正顶胞腔处可能出现的延拓障碍。这样得到的映射满足 $u^*(k_6)=\sigma\bar y$。

**Proposition 8.5** 将这个元素代入 Rourke–Sullivan 的手术障碍公式。把 $u$ 拉回到 $M\times S^1$ 后，六维 Kervaire 类变为 $\bar y t$，其中 $t$ 是圆周的一维上同调生成元。由于 $M$ 非 spin，其第二 Wu 类为 $\bar x$，于是公式中决定障碍的配对为

$$
\left\langle
\bar x^2\bar y t,
[M\times S^1]_2
\right\rangle=1.
$$

因此，从 $[\Sigma M,G/O]$ 到 $L_{10}(e)\cong\mathbb Z/2$ 的手术障碍映射满射。

结合 Proposition 8.3，光滑手术正合序列中可能区分两个光滑结构的正规不变量和 $L_{10}$ 歧义都被消去。**Theorem 8.6** 最终证明：两个 non-spin 9 维轨道空间微分同胚，当且仅当它们的 $\lambda$ 相同。

与 13 维的证明相比，这里 non-spin 条件的作用更直接：非零的 $w_2$ 通过 Wu 公式迫使顶胞腔具有非平凡 $\eta$ 分量，而这个附着分量又同时参与正规不变量的消失和最后的手术障碍计算。

## 五、球面丛模型与同伦分类：从 $KO$ 到稳定 $J$-同态

前面的 PL 分类依赖稳定实向量丛信息，而同伦等价通常保留更少的数据。第 9 节通过球面丛模型，将这两种分类精度的差别具体化。

设 $i:\mathbb{CP}^n\to M_{a,b}$ 为 projective stage。作者考虑虚丛类 $[i^*TM_{a,b}]+[\varepsilon^1]-[T\mathbb{CP}^n]$。它的虚秩是 $2n+2$，大于底空间 $\mathbb{CP}^n$ 的维数，因此实向量丛的稳定范围定理保证它可以由一个实际的秩 $2n+2$ 定向向量丛 $\eta_{a,b}$ 表示。

取其单位球面丛 $S(\eta_{a,b})$。由于向量丛的秩大于底空间维数，它具有一个处处非零截面，其单位球面丛的上同调环因而与 $M_{a,b}$ 相同。

另一方面，球面丛的切丛恒等式给出 $TS(\eta_{a,b})\oplus\varepsilon^1\cong_{\mathrm{st}}\pi^*(T\mathbb{CP}^n\oplus\eta_{a,b})$。按照 $\eta_{a,b}$ 的定义，这与 $M_{a,b}$ 在 projective stage 上的稳定切丛数据一致。

于是，第 2 节得到的 Pontryagin 类和 $KO$ 扭元不变量也一致。再利用第 3—6 节的共同 normal type、低过滤层消失和 modified surgery，**Theorem 9.1** 证明 $M_{a,b}\cong_{\mathrm{PL}}S(\eta_{a,b})$。这就是引言中的 Theorem 1.7。

有了球面丛模型，原来的同伦分类可以转化为球面纤维化的纤维同伦分类。稳定 $J$-同态正好记录实向量丛所对应的稳定球面纤维化。

令 $\gamma_{a,b}\in\widetilde{KO}(\mathbb{CP}^n)$ 为 Proposition 2.4 所确定的约化稳定切丛类。由于 $\eta_{a,b}$ 的稳定类与 $\gamma_{a,b}$ 只相差固定的 $T\mathbb{CP}^n$ 项，比较两个球面丛的稳定 $J$-类等价于比较 $J(\gamma_{a,b})$ 与 $J(\gamma_{a',b'})$。

**Lemma 9.2** 因此得到一般同伦分类判据：两个轨道空间同伦等价，当且仅当它们在 $\widetilde J(\mathbb{CP}^n)$ 中的稳定 $J$-类相等。充分性利用球面丛的 Freudenthal 稳定范围，将相同的稳定球面纤维化提升为实际的纤维同伦等价；必要性则利用同伦等价保持 Spivak 正规球面纤维化，并将其限制到 projective stage。

这一判据与 Theorem 1.5 的差别现在可以精确表达。PL 分类需要 $\gamma_{a,b}$ 在 $\widetilde{KO}(\mathbb{CP}^n)$ 中完全相等；同伦分类只要求这些类经过稳定 $J$-同态之后相等。因此，$\ker J$ 中的差异可以改变 PL 类型，却不改变这一族流形的同伦型。

当 $n=2,3$ 时，$\widetilde{KO}(\mathbb{CP}^n)\cong\mathbb Z$，而 Adams–Walker 的计算给出 $\widetilde J(\mathbb{CP}^n)\cong\mathbb Z/24$。在这两个维数，稳定 $J$-同态就是模 24 约化。

**Theorem 9.3** 因而证明，9 维和 13 维轨道空间同伦等价，当且仅当 $\lambda(a,b)\equiv\lambda(a',b')\pmod{24}$。这分别给出了 Theorem 1.8(i) 和 Theorem 1.9(i)。

**Corollary 9.4** 进一步给出 13 维球面丛模型的一种显式实现。由自由性可以推出 $\lambda\geq4$，再利用 Lagrange 四平方和定理，将 $\lambda-4$ 写为四个整数平方之和。取第一组权重全部为 1、第二组权重为这四个整数，便得到具有相同 $\lambda$ 的自由圆周商空间。第一组权重对应标准 Hopf 作用，因此该商空间本身就是 $\mathbb{CP}^3$ 上某个实化复向量丛的单位球面丛；Theorem 1.5 保证它与原轨道空间 PL 同胚。

第 9 节由此将两种分类联系起来：实 $K$ 理论记录用于 PL 分类的完整稳定丛数据，而稳定 $J$-同态保留其中决定球面纤维同伦型的部分。

## 六、从微分同胚分类到几何结构的多重性

第 10 节将前面得到的光滑分类应用于一类重复权重商空间。

令 $M_{k,l}^{(n)}=M_{(k,\ldots,k),(l,\ldots,l)}$，其中 $k,l$ 为互素正整数。两个球面的 Hopf 纤维化使它成为 $\mathbb{CP}^n\times\mathbb{CP}^n$ 上的主圆周丛，其 Euler 类为 $k\alpha_1+l\alpha_2$。

Wang–Ziller 已经在这些圆周丛上构造了齐性 Einstein 度量。作者需要进一步判断，不同参数所给出的度量能否在同一个光滑流形上产生不同的模空间连通分支。

**Lemma 10.1** 计算体积归一化后的 Einstein 常数。将度量写成 $g_{k,l}=\theta^2+Xg_1+Yg_2$，由 Wang–Ziller 的 Einstein 方程可以将 $X,Y$ 与权重比 $k/l$ 联系起来。

令 $r=X/Y$。方程给出

$$
\frac{k^2}{l^2}
=
\frac{r^2(n+1-nr)}{(n+1)r-n}.
$$

作者证明右侧在允许的区间上严格递减，因此 $k/l$ 唯一决定 $r$。再令 $s=r+r^{-1}$，体积归一化后的 Einstein 常数可以写成一个以 $N=k^2+l^2$ 和 $s$ 为变量的表达式。对于固定的 $N$，这个表达式随 $s$ 严格单调。因此，不同的无序整数对 $\{k,l\}$ 给出不同的归一化 Einstein 常数。

接下来需要让这些不同参数对应到同一个光滑流形。

取 $m$ 个互不相同且模 4 余 1 的素数，令其乘积为 $N_m$。经典平方和公式表明，方程 $N_m=k^2+l^2$ 恰有 $2^{m-1}$ 组满足 $0<k<l$ 的本原整数解。

对于 9 维情形，这些圆周商空间的 $\lambda$ 都等于 $3N_m$，是奇数，因此 Theorem 8.6 保证它们微分同胚。对于 13 维情形，$\lambda=4N_m$，满足 Theorem 7.8 的条件，所以也全部微分同胚。

于是，可以把所有 Wang–Ziller 度量通过微分同胚搬到同一个光滑流形上。Lemma 10.1 已经证明它们具有不同的正 Einstein 常数。

为了进一步区分模空间的连通分支，作者使用 Böhm–Wang–Ziller 的有限性结果：在固定紧致齐性流形上，对于任意正的标量曲率下界，单位体积齐性 Einstein 度量只可能具有有限多个 Einstein 常数。

如果两个具有不同正 Einstein 常数的度量属于同一个连通分支，由标量曲率函数的连续性，该分支必须实现两个常数之间的整个区间。这会产生无限多个具有统一正下界的 Einstein 常数，与有限性结果矛盾。

**Corollary 10.2** 因此证明，上述固定的 9 维和 13 维光滑流形，其单位体积齐性 Einstein 度量模空间都至少有 $2^{m-1}$ 个连通分支。

同一批整数参数还可以用于构造 Sasakian 结构。

当 $k,l>0$ 时，Euler 类 $k\alpha_1+l\alpha_2$ 可以由正的整 Kähler 形式表示。Boothby–Wang 构造因而在对应的主圆周丛上给出正则 Sasakian 结构。

设 $\mathcal D_{k,l}$ 为其接触分布。由于接触分布作为复向量丛同构于底空间切丛的水平拉回，**Proposition 10.3** 计算得到 $c_1(\mathcal D_{k,l})=(n+1)(l-k)x$，其中 $x$ 是 $H^2(M_{k,l}^{(n)};\mathbb Z)\cong\mathbb Z$ 的一个生成元。

这个公式提供了区分不同接触结构的工具。若两个接触结构 contactomorphic，则相应微分同胚对 $H^2\cong\mathbb Z$ 的作用只能是乘以 $\pm1$，从而要求 $|l-k|=|l'-k'|$。

但对于固定的 $N_m=k^2+l^2$ 和正整数 $0<k<l$，差 $l-k$ 已经唯一决定整数对。因为写成 $l=k+d$ 后，$N_m=k^2+(k+d)^2$ 随 $k$ 严格递增，所以不同的本原平方和表示不可能具有相同的正差值。

因此，由不同 $(k,l)$ 构造的接触结构两两不接触同胚。**Corollary 10.4** 得到，在上述每一个固定光滑流形上，都存在至少 $2^{m-1}$ 个底层接触结构两两不接触同胚的正则 Sasakian 结构。

将 Corollary 10.2 与 10.4 合并，便得到 **Theorem 1.10**：

$$
\begin{aligned}
\#\pi_0\mathcal E_h(M_m^9)&\geq2^{m-1},\\
\#\pi_0\mathcal E_h(M_m^{13})&\geq2^{m-1},
\end{aligned}
$$

并且两个流形各自都具有至少 $2^{m-1}$ 个两两不接触同胚的正则 Sasakian 接触结构。

由于 $m$ 可以任意增大，这些几何结构的数量在相应的 9 维 non-spin 流形族与 13 维 spin 流形族中没有统一上界。

## 七、证明结构中的方法论

论文的三项主要分类结果实际上建立在同一批稳定丛数据上。

Theorem 1.5 证明，在这一流形族中，projective stage 上的稳定实向量丛类完全决定 PL 同胚类型。其困难在于从相同的不变量构造实际的同胚，作者通过逐素数分解、正规边缘过滤层和 modified surgery 消除了这一实现障碍。

Theorem 1.8 和 1.9 的同伦部分则通过 Theorem 9.1 的球面丛模型与 Lemma 9.2 的稳定 $J$-判据完成。在 9 维和 13 维，模 24 的条件明确描述了同伦分类相较于 PL 分类所遗忘的信息。

对于微分同胚分类，13 维 non-spin 情形将剩余歧义压缩为三阶 exotic sphere，再利用反转定向自微分同胚消去；13 维 $\lambda\equiv0\pmod4$ 情形通过 pinch map 消去第九过滤层中的二阶正规不变量；9 维 non-spin 情形则由非平凡的顶胞腔 $\eta$ 分量消去正规不变量，再利用 Kervaire 类计算消去 $L_{10}$ 障碍。

这些结果使不同权重的圆周商空间能够在光滑范畴中被识别。第 10 节随后利用平方和分解制造大量不同的几何实现，并使用 Einstein 常数与接触分布的第一 Chern 类证明它们确实不同。

因此，整篇论文的证明可以理解为连续的两次信息处理：分类阶段将权重数据转换为足以识别流形的不变量，并证明不存在阻碍分类实现的剩余障碍；几何应用阶段则保留权重中能够区分具体度量或接触结构的信息，在同一个光滑流形上得到数量不断增长的几何结构。

这里尤其值得注意的是 Proposition 4.3。它所使用的逐素数分解依赖原始线性圆周作用的同变坐标投影，因而说明了几何构造本身如何参与消除拓扑分类中的障碍。论文中的 $KO$ 理论、谱序列和手术理论能够组合成完整分类，正是因为这些工具所需的关键条件最终可以从原始作用的具体结构中获得。