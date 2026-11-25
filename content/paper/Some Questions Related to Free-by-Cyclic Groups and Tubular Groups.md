
Wu 与 Ye 的这篇论文研究 free-by-cyclic groups 与 tubular groups 的交集。作者首先证明，在单顶点 tubular group 中，CAT(0) 与 free-by-cyclic 两个条件结合起来，足以保证 virtually special。随后，他们利用群作用的几何限制，构造沿循环子群合并后不再 virtually free-by-cyclic 的例子，并证明循环子群可分离性不蕴含 VRC 性质。

论文的前后两部分使用了相近的数学思想。群元素的共轭关系在几何作用中表现为平移长度相等，而这些长度等式能够对群的结构施加限制。第四节利用这种限制构造立方复形，第五节则利用它排除某些群同态的存在。

## 一、从 tubular group 的几何表示到 virtually special

考虑一个只有单个顶点群的 tubular group：

$$
G=\left\langle\mathbb Z^2,s_1,\ldots,s_k
\;\middle|\;
s_iv_is_i^{-1}=w_i,\quad 1\leq i\leq k
\right\rangle,
$$

其中 $v_i,w_i\in\mathbb Z^2$ 是非零向量。

这种表示来自图群理论。顶点群 $\mathbb Z^2$ 是二维环面的基本群，每一对 $v_i,w_i$ 表示环面上的两条闭曲线，而稳定字母 $s_i$ 对应将这两条曲线连接起来的圆柱。

因此，研究这个群的几何性质，可以从环面上的闭曲线及其对应的整数向量入手。

作者希望证明的主要结果是 Theorem 4.5：如果这样的 $G$ 同时是 CAT(0) 和 free-by-cyclic，那么它是 virtually special。

Virtually special 意味着 $G$ 存在有限指数子群，可以嵌入某个右角 Artin 群。对于 tubular group，Woodhouse 的结果将它与有限维 CAT(0) 立方复形上的自由作用联系起来。

这意味着作者需要从原来的群表示中构造立方复形。为此，首先要确定 CAT(0) 与 free-by-cyclic 分别对向量 $v_i,w_i$ 施加了什么限制。

### 从 CAT(0) 得到长度等式

Lemma 2.3 研究了更一般的情形：顶点群为 $\mathbb Z^n$，并且仍通过若干循环子群进行 HNN 扩张。

它证明，这样的群是 CAT(0)，当且仅当存在可逆实矩阵 $A\in GL_n(\mathbb R)$，使每一对边向量都满足 $\|Av_i\|=\|Aw_i\|$。

这个判据来自平坦环面定理。如果 $G$ 能够适当且余紧地等距作用于 CAT(0) 空间，那么其自由阿贝尔子群 $\mathbb Z^n$ 可以在某个欧氏平坦空间上通过平移作用。

选定基后，一个元素 $v\in\mathbb Z^n$ 对应平移向量 $Av$。由于 $v_i,w_i$ 在 $G$ 中共轭，而等距变换的平移长度在共轭下保持不变，所以它们的平移向量必须等长。

反过来，如果存在一个矩阵 $A$，使所有这些长度条件同时成立，便可以把顶点环面赋予相应的欧氏度量，再利用相同长度的闭测地线进行等距粘接，得到所需的非正曲率模型。

因此，CAT(0) 性质可以通过一个共同的欧氏度量来判别。

在二维情形中，Theorem 2.6 又将这个判据简化。

假设 $v_1,w_1$ 线性无关。以它们为基，写 $v_i=x_iv_1+y_iw_1$、$w_i=x_i'v_1+y_i'w_1$。

由于 $Av_1,Aw_1$ 等长，设它们的夹角为 $\theta\in(0,\pi)$。利用余弦公式，所有长度等式便化为

$$
x_i^2+y_i^2+2x_iy_i\cos\theta
=(x_i')^2+(y_i')^2+2x_i'y_i'\cos\theta.
$$

这里所有 $i$ 必须使用同一个 $\theta$。

这样，原先寻找未知矩阵的问题被简化为寻找一个共同角度参数。后面的证明将利用这个二次等式，与 free-by-cyclic 条件产生的线性等式进行比较。

### 从 free-by-cyclic 得到共线条件

Theorem 3.1 研究同一个 tubular group 什么时候是 free-by-cyclic。

根据定义，free-by-cyclic 意味着存在满同态 $f:G\to\mathbb Z$，其核是自由群。

作者利用 Button 的判别定理：对于 tubular group，这等价于存在一个到 $\mathbb Z$ 的同态，并且该同态在每个边群上的限制都非零。

由关系 $s_iv_is_i^{-1}=w_i$，以及 $\mathbb Z$ 的交换性，必然得到 $f(v_i)=f(w_i)$。所以所有差向量 $v_i-w_i$ 都属于 $f|_{\mathbb Z^2}$ 的核。

因为这个限制同态非零，其核张成一条有理直线。于是所有差向量必须位于同一条直线上。

此外，这条直线不能包含任何 $v_i$，否则对应边群在 $f$ 下的像就是零。

反过来，如果这些差向量共线，而且这条直线避开所有边向量，就可以沿其互补的整数方向定义一个投影 $\mathbb Z^2\to\mathbb Z$。这个投影使每对 $v_i,w_i$ 的像相同，又在每个边群上非零，从而满足 Button 的判据。

因此，Theorem 3.1 将 free-by-cyclic 性质完全转化为差向量的共线条件。

至此，作者获得了两组能够同时使用的信息：CAT(0) 要求每对边向量在某个共同欧氏度量下等长，free-by-cyclic 则要求所有差向量共线。

但这还不足以直接得到 virtually special。下一步需要将这些条件转化为能够构造 CAT(0) 立方复形的几何数据。

### 从闭曲线的交点数构造立方复形

在二维环面上，两条由整数向量 $u,v$ 表示的闭曲线，其几何交点数由 $|\det(u,v)|$ 给出。

Wise 的 Lemma 4.1 表明，如果能够在顶点环面上选择有限多条闭曲线，使它们与每个圆柱两端粘接曲线的总交点数相等，并且这些曲线生成顶点群的有限指数子群，那么便可以构造一个 CAT(0) 立方复形上的自由作用。

这样的曲线集合称为 equitable set。

其构造方法是将环面上的曲线与圆柱两端的交点连接起来，形成 immersed walls，再通过这些墙构造对偶立方复形。

这里还有一个障碍：Wise 的判据允许得到的立方复形是无限维的。为了得到 virtually special，作者还需要使用 Woodhouse 关于 non-dilated walls 的判据。

当一个 immersed wall 沿着圆柱传播时，每条连接弧都对应一个权重比，由两端的交点数决定。如果沿闭合路径连续传播后，这些权重比能够产生无限多不同的乘积，墙就可能发生 dilation。

如果能让每条连接弧的权重比都等于 $1$，那么所有闭合路径上的乘积也都等于 $1$，墙自然是 non-dilated。

Woodhouse 的结果保证，此时相应的立方复形具有有限维数，并可得到 virtually special。

因此，作者希望找到一组曲线，使它们与每个圆柱两端的交点数分别相等。这样就能把同一条曲线上的交点相互配对，让连接弧的权重比全部等于 $1$。

Theorem 4.2 给出了这种构造。

假设 $v_1,w_1$ 线性无关，取 $z_1=w_1-v_1$、$z_2=w_1+v_1$。

这两个向量线性无关，因此生成顶点群的有限指数子群。而且对第一条边，可以直接验证 $|\det(z_j,v_1)|=|\det(z_j,w_1)|$，其中 $j=1,2$。

所以只要剩余各边也满足 $|\det(z_j,v_i)|=|\det(z_j,w_i)|$，这两条曲线就构成 equitable set，并且可以按照曲线类型连接交点，使所有 immersed walls 都是 non-dilated。

Theorem 4.2 因而证明：在 $v_1,w_1$ 线性无关的条件下，只要 $w_1-v_1$ 与 $w_1+v_1$ 分别满足上述行列式绝对值相等条件，$G$ 就是 virtually special。

选择这两个方向的作用现在已经明确。它们自动处理第一条边，而且能够把构造 non-dilated walls 的问题化为其余边上的两组行列式等式。

接下来需要从 CAT(0) 和 free-by-cyclic 推出这些等式。

### Lemma 4.4：两组条件在这里结合

先考虑存在一对线性无关边向量的情形。重新编号后，假设 $v_1,w_1$ 线性无关。

在适当的有理坐标中，可以令 $v_1=(k_1,0)$、$w_1=(0,k_2)$，并将其他边向量写成 $v_i=(a_i,b_i)$、$w_i=(c_i,d_i)$。

由于 $G$ 是 free-by-cyclic，Theorem 3.1 保证 $v_i-w_i$ 与 $v_1-w_1$ 平行。因此得到

$$
-k_2(a_i-c_i)=k_1(b_i-d_i).
$$

再令 $x_i=a_i/k_1,\ y_i=b_i/k_2$，并对 $w_i$ 定义相应的 $x_i',y_i'$。

刚才的共线条件意味着 $x_i+y_i=x_i'+y_i'$。

另一方面，由于 $G$ 是 CAT(0)，Theorem 2.6 保证这两组坐标满足同一个角度参数下的二次长度等式。

利用 $x^2+y^2=(x+y)^2-2xy$，并消去已经相等的两个坐标和，得到

$$
(1-\cos\theta)x_iy_i
=(1-\cos\theta)x_i'y_i'.
$$

由于 $\theta\in(0,\pi)$，可以消去非零因子 $1-\cos\theta$，最终得到 $a_ib_i=c_id_i$。

这就是 Lemma 4.4 的两个结论。

第一个等式来自 free-by-cyclic 的共线条件，第二个等式来自 CAT(0) 的等长条件。两者分别控制某种加权坐标和与坐标乘积。

### Theorem 4.5：由和与积得到行列式等式

现在计算 Theorem 4.2 所要求的行列式。

对于 $z_1=w_1-v_1$，有 $\det(z_1,v_i)=-k_1b_i-k_2a_i$，以及 $\det(z_1,w_i)=-k_1d_i-k_2c_i$。

Lemma 4.4 的第一个等式立即保证它们相等，因此关于 $z_1$ 的条件成立。

对于 $z_2=w_1+v_1$，需要证明 $k_1b_i-k_2a_i=\pm(k_1d_i-k_2c_i)$。

令 $P=k_1b_i,\ Q=k_2a_i,\ P'=k_1d_i,\ Q'=k_2c_i$。

Lemma 4.4 的两个等式分别给出 $P+Q=P'+Q'$ 和 $PQ=P'Q'$。于是

$$
\begin{aligned}
(P-Q)^2
&=(P+Q)^2-4PQ\\
&=(P'+Q')^2-4P'Q'\\
&=(P'-Q')^2.
\end{aligned}
$$

因此 $P-Q=\pm(P'-Q')$，正好得到 $z_2$ 所要求的行列式条件。

Theorem 4.2 的全部条件由此成立，$G$ 是 virtually special。

如果所有 $v_i,w_i$ 都平行，则可以写成 $v_i=m_iu_i$、$w_i=n_iu_i$，其中 $u_i$ 是本原整数向量。

Lemma 2.3 的 CAT(0) 长度条件给出 $|m_i|=|n_i|$。因此，对任意闭曲线 $z$，都有 $|\det(z,v_i)|=|\det(z,w_i)|$。

选择一组生成 $\mathbb Z^2$ 的闭曲线，就能直接构造 equitable set，而且每条连接弧的权重比都是 $1$，所以所有 immersed walls 都是 non-dilated。

两种情况共同完成了 Theorem 4.5 的证明。

Corollary 4.6 随后结合 Wise 已证明的反方向，得到：对于单顶点 free-by-cyclic tubular group，CAT(0) 当且仅当 virtually special。

整个证明中起决定性作用的是 Lemma 4.4。它将两个原本不同的群性质转化成加权坐标的和与积相等，而这恰好足以验证 Theorem 4.2 所要求的行列式条件。

## 二、从 virtually special 到紧致立方化

Theorem 4.5 保证了 virtually special，但没有保证群能够在某个 CAT(0) 立方复形上自由且余紧地作用。

Lemma 4.7 进一步研究了这种作用。

在顶点群 $\mathbb Z^2$ 中，如果两个边群生成元张成同一条有理直线，就称它们属于同一个平行类。

Lemma 4.7 证明，如果一个顶点上出现至少三个不同的边群平行类，那么该 tubular group 不可能在取有限指数子群后自由、余紧地作用于 CAT(0) 立方复形。

这个障碍在取有限指数子群后依然存在。因为有限指数子群与原边群的交仍然具有相同的有理方向，所以三个不同的平行类不会消失。

在不存在非平衡 Baumslag–Solitar 子群 $BS(m,n)$、其中 $|m|\ne|n|$ 的假设下，Lemma 4.7 进一步证明，每个顶点至多具有两个平行类，也是自由余紧立方化的充分条件。

作者将其应用于自同构 $\Psi(a)=a,\ \Psi(b)=a^mba^m,\ \Psi(c)=a^nca^n$ 所定义的 $G_{m,n}=F_3\rtimes_\Psi\mathbb Z$。

由前面的 CAT(0) 判据和 Theorem 4.5，所有 $G_{m,n}$ 都是 virtually special。

但它的 tubular 表示包含四个边方向 $a^{-m}t,a^mt,a^{-n}t,a^nt$。当 $|m|\ne|n|$ 时，这些方向至少产生三个不同的平行类，因此无法 virtually freely cocompactly cubulate。

当 $|m|=|n|$ 时，平行类至多只有两个。结合 CAT(0) 性质及 Lemma 4.7 的充分条件，就能得到相应的自由、余紧立方化。

这给出了引言中的 Theorem 1.4：$G_{m,n}$ 对所有整数 $m,n$ 都是 virtually special，但它能够 virtually freely cocompactly cubulate，当且仅当 $|m|=|n|$。

Theorem 4.9 与 Corollary 4.10 则将上述结论推广到由 $\phi(a_0)=a_0$、$\phi(a_i)=a_0^{p_i}a_ia_0^{q_i}$ 定义的群族。

对于这一群族，Theorem 4.9 给出 virtually special 的参数判据，Corollary 4.10 再结合平行类的数量，得到 virtually compact special 的充要条件。

## 三、沿循环子群合并后的 free-by-cyclic 结构

第五节研究的对象发生了变化。

设 $G_1,G_2$ 是 free-by-cyclic groups，分别选择无限阶元素 $a\in G_1$、$b\in G_2$，构造合并自由积 $G_1*_{a=b}G_2$。

作者希望判断，这个新群是否仍然是 free-by-cyclic，或者至少是 virtually free-by-cyclic。

Theorem 5.1 首先给出必要条件。

假设合并后的群是 free-by-cyclic，于是存在满同态 $f:G_1*_{a=b}G_2\to\mathbb Z$，且核是自由群。

若 $f(a)\ne0$，由于 $a,b$ 在合并群中被识别，它们在 $f$ 下具有相同的非零像。限制到两个因子，可以得到相应的自由群半直积分解，并证明 $a,b$ 都是 generalized retractors。

若 $f(a)=0$，合并的循环子群便落在自由核中。考虑自由核在原合并群 Bass–Serre 树上的作用，可以得到一个顶点群为自由群、边群为循环群的图群分解。

由于整个核是自由群，这些循环子群的嵌入必须满足相应的自由因子条件。作者由此证明，$a,b$ 分别位于适当的 free complements 中，并且至少一个是 primitive。

因此，Theorem 5.1 给出了合并后仍为 free-by-cyclic 的两类必要条件。

Lemma 5.2 证明，其中 generalized retractor 条件实际上是充分的：可以在两个因子上构造相容的到 $\mathbb Z$ 的同态，使合并后的同态在边群上非零。于是其自由核在 Bass–Serre 树上的边稳定子平凡，顶点稳定子是自由群，整个核便是自由群的自由积。

然而，另一类涉及 primitive 元素的必要条件并不充分，Example 5.6 提供了反例。

Theorem 5.8 进一步将 Theorem 5.1 推广到有限指数情形。如果合并群是 virtually free-by-cyclic，那么在某个共同正整数幂上，被合并的元素仍须满足相应的虚拟版本条件。

这些结果限制了合并后可能出现的自由群扩张结构。不过，论文最终的反例还使用了更直接的障碍：virtual retract。

### Theorem 5.15：将合并问题归结为 virtual retract

一个循环子群 $\langle a\rangle\leq G$ 称为 virtual retract，是指存在有限指数子群 $H\leq G$，包含 $\langle a\rangle$，并且存在收缩同态 $H\to\langle a\rangle$。

Theorem 5.15 证明，如果 $G$ 是剩余有限的 free-by-cyclic group，而 $\langle a\rangle$ 不是 virtual retract，那么 $G*_{a=t}(F_2\times\mathbb Z)$ 不是 virtually free-by-cyclic。

证明假设合并群具有有限指数 free-by-cyclic 子群 $\Gamma$，并取满同态 $f:\Gamma\to\mathbb Z$，使其核为自由群。

若 $f$ 在 $\Gamma\cap\langle a\rangle$ 上非零，则通过取进一步的有限指数子群，可以使这个循环子群映到整个 $\mathbb Z$。结合剩余有限性及 Minasyan 的 virtual retract 判据，便会推出 $\langle a\rangle$ 是 $G$ 的 virtual retract，与假设矛盾。

若该限制为零，则某个 $a^m=t^m$ 落在自由核中。由于第二个因子含有 $F_2\times\langle t^m\rangle$，自由核中将出现非平凡的 $\mathbb Z^2$ 子群。这也不可能发生在自由群中。

因此，两种情况都被排除。

Theorem 5.15 将原来的合并问题缩减为寻找一个 free-by-cyclic group，其中某个循环子群不是 virtual retract。

### Lemma 5.17 与 Lemma 5.18：用欧氏几何排除 virtual retract

Lemma 5.17 说明，如果一个群具有 VRC 性质，那么对于任意无限阶元素 $g$，都可以构造某个有限维欧氏空间上的等距群作用，使 $g$ 具有非零平移长度。

证明从有限指数收缩 $r:\Gamma\to\langle g\rangle$ 出发。先让 $\langle g\rangle\cong\mathbb Z$ 在实直线上通过平移作用，再利用有限个陪集 $G/\Gamma$，将其诱导为整个 $G$ 的欧氏等距作用。

这个构造同样适用于一个指定的 virtual retract。

Lemma 5.18 将其应用于前面出现的 $F_n$-by-$\mathbb Z$ 群族。

假设 $\langle a_0\rangle$ 是 virtual retract，那么可以得到一个欧氏等距作用，其中 $a_0$ 具有非零平移长度。

由于 $a_0$ 与稳定字母 $t$ 交换，它们生成一个 $\mathbb Z^2$ 子群。利用平坦环面定理，可以将它们的平移向量分别记为 $w,v$，其中 $w\ne0$。

原来的群关系可以写成 $a_i(a_0^{q_i}t)a_i^{-1}=a_0^{-p_i}t$。

因此 $a_0^{q_i}t$ 与 $a_0^{-p_i}t$ 共轭，平移长度相等，必然满足

$$
\|v-p_iw\|=\|v+q_iw\|,
\qquad 1\leq i<n.
$$

所以，如果不存在满足这些等式且 $w\ne0$ 的欧氏向量，那么 $\langle a_0\rangle$ 就不可能是 virtual retract。

作者考虑 $n=3$、$p_1=p_2=0$、$q_1=1$、$q_2=2$。

此时长度条件要求 $\|v\|=\|v+w\|=\|v+2w\|$。

对平方范数展开，可以得到 $2\langle v,w\rangle+\|w\|^2=0$ 和 $4\langle v,w\rangle+4\|w\|^2=0$。

将前一个等式乘以二，再与后一个比较，便得到 $\|w\|^2=0$。

这与 $w\ne0$ 矛盾。

相应的群就是 Gersten group：

$$
G_1=\left\langle a,b,c,t\ \middle|\
tat^{-1}=a,\ 
tbt^{-1}=ba,\ 
tct^{-1}=ca^2
\right\rangle.
$$

因此，Lemma 5.18 证明了 $\langle a\rangle$ 不是 Gersten group 的 virtual retract。

结合 Theorem 5.15，Example 5.19 得到 $G_1*_{a=t}(F_2\times\mathbb Z)$ 不是 virtually free-by-cyclic。

Example 5.20 进一步说明，甚至可以把第二个因子缩小为 $\mathbb Z^2$。

令 $G_2=\langle x,s\mid sx=xs\rangle\cong\mathbb Z^2$，并构造 $G=G_1*_{a=x}G_2$。

这个群仍然是 tubular group。如果它存在有限指数 free-by-cyclic 子群 $H$，那么 $H$ 也具有 tubular group 结构。

由 Button 的判据，存在满同态 $f:H\to\mathbb Z$，并且它在所有边群上都非零。特别地，$f$ 在某个 $\langle a^m\rangle=H\cap\langle a\rangle$ 上非零。

限制到 $H\cap G_1$，再取有限指数子群，可以得到对 $\langle a^m\rangle$ 的收缩。Minasyan 的结果进一步推出 $\langle a\rangle$ 是 $G_1$ 的 virtual retract。

这与 Lemma 5.18 矛盾。

因此 $G_1*_{a=x}\mathbb Z^2$ 不是 virtually free-by-cyclic。

这里需要区分两条证明：Example 5.19 直接依赖 Theorem 5.15，而 Example 5.20 使用 Button 判据与 Lemma 5.18 重新建立矛盾。Theorem 5.8 给出的是一般必要条件，并不是 Example 5.20 最后一步证明所直接调用的定理。

## 四、循环子群可分离性与 VRC

第五节已经证明，Gersten group 中的 $\langle a\rangle$ 不是 virtual retract。第六节利用这个结论，研究循环子群的可分离性。

一个循环子群 $C\leq G$ 称为 separable，是指对于任意 $g\notin C$，都存在有限指数子群包含 $C$，但不包含 $g$。

若所有循环子群都可分离，则称 $G$ 为 cyclic-subgroup-separable。

VRC 则要求每个循环子群都是 virtual retract。两者都涉及有限指数子群，但 virtual retract 还要求存在收缩同态，因此具有更强的结构约束。

Theorem 6.1 证明，如果有限生成群 $K$ 的所有循环子群都可分离，那么任意半直积 $K\rtimes_\phi\mathbb Z$ 也具有循环子群可分离性。

证明取任意循环子群 $\langle g\rangle$，设 $g=g_0t^m$，再取 $x=x_0t^n\notin\langle g\rangle$。

若 $m\ne0$，则 $g$ 在自然投影到 $\mathbb Z$ 下具有非零像。结合 generalized retractor 的性质以及剩余有限群中 retract 的可分离性，可以将 $x$ 与 $\langle g\rangle$ 分离。

若 $m=0,n\ne0$，自然投影到 $\mathbb Z$ 后再取有限商，就足以区分两者。

最后考虑 $m=n=0$，此时 $g,x\in K$。

由 $K$ 的循环子群可分离性，可以选择有限指数子群 $H\leq K$，使 $g\in H$ 而 $x\notin H$。

为了将这个分离提升到整个半直积，需要保证某个 $t^M$ 保持 $H$。

因为 $K$ 有限生成，固定指数的子群只有有限多个。自同构 $\phi$ 在这些子群上作用，因此存在 $M>0$，使 $\phi^M(H)=H$。

于是 $\langle H,t^M\rangle$ 是整个半直积的有限指数子群，包含 $g$ 而不包含 $x$。

这完成了 Theorem 6.1。

由于有限秩自由群的循环子群可分离，Corollary 6.2 立即得到所有 $F_n$-by-$\mathbb Z$ 群都具有循环子群可分离性。

现在重新考虑 Gersten group。

它是 $F_3$-by-$\mathbb Z$，所以由 Corollary 6.2，所有循环子群都可分离。

但 Lemma 5.18 已经证明，其中的 $\langle a\rangle$ 不是 virtual retract。

因此，Example 6.3 给出了一个 cyclic-subgroup-separable tubular group，却不具有 VRC 性质的反例。

这个反例的两部分证据来自不同章节：第六节建立循环子群可分离性，第五节建立 virtual retract 的障碍。它们共同否定了 Minasyan 提出的相关问题。

## 五、RFRS 与 virtually RFRS

论文最后一节研究另一种有限指数性质。

RFRS 要求群存在一列有限指数正规子群，其交为单位元，而且每个后继子群都包含前一子群到其有理阿贝尔化的自然映射的核。

Virtually RFRS 只要求存在一个有限指数子群满足 RFRS。

Lemma 7.1 从 RFRS 子群列中提取了一个有用的必要条件：给定非平凡子群 $H$ 与有限多个元素 $g_1,\ldots,g_k$，可以选择这些元素的正整数幂，使由它们与 $H$ 生成的子群存在到 $\mathbb Z$ 的满同态，并且这个同态在 $H$ 上非零。

作者随后考虑 $F_2\rtimes_\phi\mathbb Z$，其中 $\phi(a)=ab$、$\phi(b)=ab^2$。

该自同构在 $F_2^{ab}\cong\mathbb Z^2$ 上诱导矩阵

$$
M=
\begin{pmatrix}
1&1\\
1&2
\end{pmatrix}.
$$

其特征值是 $(3+\sqrt5)/2$ 与 $(3-\sqrt5)/2$，均不是单位根。因此任意 $M^n-I$ 都在有理数域上可逆。

这意味着，对于包含 $F_2$ 与 $t^n$ 的子群，任何到 $\mathbb Z$ 的同态在 $F_2$ 上的限制都必须为零。

这与 Lemma 7.1 的必要条件矛盾，因此该群不是 RFRS。

另一方面，利用已有的 CAT(0) 与 virtual specialness 结果，作者证明它是 virtually RFRS。

Example 7.2 由此得到一个 CAT(0) free-by-cyclic group，它是 virtually RFRS，却不是 RFRS。

