---
tags:
  - math
  - 实分析
  - 线性代数
---

> [!note] 命题0
> 考虑一个测度空间$(\mathbb{R}^d,\mathcal{L}(\mathbb{R}^d),m)$，其中$\mathcal{L}$是$\mathbb{R}^d$中的全体Lebesgue可测集合构成的$\sigma-$代数，$m$表示Lebesgue测度。此测度空间上有一个可测集合$E\in \mathcal{L}$,以及一个线性变换$L:\mathbb{R}^d\to \mathbb{R}^d$，那么此集合本身的测度与线性变换以后的测度满足关系:$$m(L(E))=|\det(L)|m(E)$$

### 1. 线性变换会改变可测性吗？

> [!note] 命题1
> 如果$E\in \mathcal{L}$，那么$L(E)\in \mathcal{L}$,也就是说线性变换并不会改变集合的Lebesgue可测性。

这里我们对Lebesgue可测的定义是:

> [!note] Lebesgue可测的定义
> $A\subseteq \mathbb{R}^d$是Lebesgue可测的，如果对任意的$\varepsilon>0$存在一个开集$O_{\varepsilon}$使得$E\subset O_{\varepsilon}$并且：$$m^{*}(O_{\varepsilon}-A)\leq \varepsilon$$其中$m^{*}$表示Lebesgue外测度。那么$A$被成为Lebesgue可测集合，并且其Lebesgue测度就是其外测度，表示为$$m(A)=m^{*}(A)$$

按照定义，我们无非就是知道集合$E$可以被开集$O_{\varepsilon}$从外面逼近，现在我们想要知道是否$L(E)$也有这样的性质。我们意识到，是否能使得$L(E)$继承来自$E$的可测性取决于线性映射$L$的性质,可是线性映射有很多好的性质，为了实现目标，我们应该从哪个性质入手呢？

我们想到$$L(O_{\varepsilon})-L(E)\subset L(O_{\varepsilon}-E)$$并且$m^{*}(O_{\varepsilon}-E)\leq \varepsilon$，以及$$m^{*}\left(L(O_{\varepsilon})-L(E)\right)\leq m^{*}\left( L(O_{\varepsilon}-E)\right)$$那么如果：
1. 如果线性变换后的集合的外测度可以被变换之前的集合的外测度控制起来，从而使得$$m^{*}\left(L(O_{\varepsilon})-L(E)\right)\leq m^{*}\left( L(O_{\varepsilon}-E)\right)\leq C\varepsilon$$
2. 如果$L(O_{\varepsilon})$恰好也是一个开集。
如果以上两件事能同时成立，那么命题1也就解决了。

#### 1.1 利用线性变换的Lipschitz性

对于线性变换$L$，一定存在一个常数$M$使得任意$x,y\in \mathbb{R}^d$满足$$||L(x)-L(y)||\leq M||x-y||$$其中$||\cdot||$是$\mathbb{R}^d$中的欧氏范数。下面我们证明:

> [!note] 命题2
> 对任意$A \subset \mathbb{R}^d$，以及$\mathbb{R}^d$线性变换$L$，那么存在一个与维度$d$有关的常数$C_d$使得线性变换前后的集合的Lebesgue外测度满足$$m^{*}(L(A))\leq C_d m^{*}(A)$$

---

集合$A$，以及任意$\varepsilon>0$而言，存在一个开集$O_{\varepsilon}$由可数个$d$维的开的超立方体构成$A\subset O_{\varepsilon}=\cup_{i\geq 0}Q_{i,\varepsilon}^{0}$并且满足$$\sum_{i\geq 1}|Q_{i,\varepsilon}^{0}|\leq m^{*}(A)+\varepsilon$$
对于每个超立方体而言其体积就是其外测度（Lebesgue外测度就是通过立方体的覆盖的体积来定义的），于是由线性变换的Lipschitz性$$m^{*}(L(Q_{i,\varepsilon}^{0}))\leq 2\sqrt{d}M m^{*}(Q_{i,\varepsilon}^{0})$$因此利用外测度的基本性质$$\begin{aligned}m^{*}(A)&\leq m^{*}(L(O_{\varepsilon}))\\&= m^{*}(L(\cup_{i\geq 0}Q_{i,\varepsilon}^{0}))\\&\leq m^{*}(\cup_{i\geq 0}L(Q_{i,\varepsilon}^{0}))\\&\leq \sum_{i\geq 0}m^{*}(L(Q_{i,\varepsilon}^{0}))\\&\leq 2\sqrt{d}M\sum_{i\geq 0}m^{*}(Q_{i,\varepsilon}^{0}) \\&\leq C_d m^{*}(A)+C_d\varepsilon\end{aligned}$$这对任意的$\varepsilon>0$成立，于是$$m^{*}(L(A))\leq C_d m^{*}(A)$$

---

那么这个结果的一个推论就是，如果集合是零测度的集合，那么经过线性变换以后依旧是零测度的。那么关于命题1，如果集合$E$是Lebesgue可测的，那么由于$m^{*}(O_{\varepsilon}-E)\leq \varepsilon$，因此一定有$$m^{*}\left( L(O_{\varepsilon}-E)\right)\leq C_d\varepsilon$$
#### 1.2 线性变换会是开映射吗？

我们想要实现$$m^{*}\left(L(O_{\varepsilon})-L(E)\right)\leq m^{*}\left( L(O_{\varepsilon}-E)\right)\leq C\varepsilon$$的第一步已经在1.1解决了，但是第二步我们想要确保$L(O_{\varepsilon})$是一个开集，因为如果这样的话那么就说明$L(E)$的可以被开集任意逼近。而这个问题当中，因为$O_{\varepsilon}$本身就是一个开集，要保证$L(O_{\varepsilon})$一定是开集，这就相当于问，$L$作为一个线性变换会不会是一个开映射（把任意开集映射为开集的映射）？

不过我们立刻能想到一个反例：

> [!example] 例子1
> $L_2:\mathbb{R}^2\to \mathbb{R}^2$,其中$L_2(x)=\mathbf{0}$。此处的$\mathbf{0}$是$\mathbb{R}^2$当中的零向量。这当然是一个线性变换，不过这不是一个开映射。因为作为$\mathbb{R}^2$的子集，在欧氏拓扑的意义下，$\{\mathbf{0}\}$自然不是一个开集，因为在欧氏拓扑的意义下，开集需要保证集合的每一个点为圆心能找到一个圆盘(高维中就是球)，包含在此集合内。显然$\{\mathbf{0}\}$并不符合这一点。

然后我们想到，如果加上满射的条件，开映射就是一定的了。

> [!note] 引理1：Banach-Schauder定理
> $f:X\to Y$是Banach空间$X,Y$之间的一个连续满射，那么$f$一定是开映射。

那么也就是说如果线性变换$L$是满射，那么命题1就能得到证明。那么如果$L$是单射呢？参考例子1，我们发现如果我们的线性变换它不是一个满射，那么它必然会把整个$\mathbb{R}^d$映射到$\mathbb{R}^d$的某个更低维度的子空间当中（因为线性映射的维度定理，参考[[第一同构定理#2. 线性空间的第一同构定理]]的Rank-Nullity定理）。而这种更低维度的子空间对于$\mathbb{R}^d$这种更高维度的欧氏空间上定义的Lebesgue测度而言，它实际上是零测度（有相当多的方法证明）。

于是我们现在可以证明命题1：
1. 如果$L$不是满射，那么$L(E)$被包含在某个低于$d$维的$\mathbb{R}^d$的子空间当中，因此是零测度的。零测度的集合都是Lebesgue可测的。
2. 如果$L$是满射，那么有Banach-Schauder定理，$L$是一个开映射。因此由于$E\subset O_{\varepsilon}$于是$L(E)\subset L(O_{\varepsilon})$,此外由命题2$$m^{*}\left(L(O_{\varepsilon})-L(E)\right)\leq m^{*}\left( L(O_{\varepsilon}-E)\right)\leq C\varepsilon$$于是$L(E)$一定是Lebesgue可测的。

### 2. 从内外测度的角度入手证明

整个证明的思路和[[从积分的伸缩公式到由可测变换诱导的新测度]]非常类似，其主要想法可以总结为:

> [!tip] 主要的想法
> 主要想法基于：该性质在超立方体上都是成立的，那么这种性质应该是可以通过Lebesgue外测度的定义推广到Lebesgue测度的意义下成立。具体来说，我们需要给外测度$m^{*}(T(A))$一个上界，以及$m_{*}(T(A))$一个下界，而如果上界和下界是相等的，那么我们就同时证明了可测性以及，命题0当中的式子。

#### 2.1 线性变换后立方体的体积公式

> [!note] 命题2.1
> 欧氏空间$\mathbb{R}^d$当中的超立方体$Q$经过线性变换$L:\mathbb{R}^d\to \mathbb{R}^d$之后的的体积为$$|L(Q)|=|\det(L)||Q|$$

* 欧氏空间当中的超立方体可以用笛卡儿积定义为$d$个区间的积：$Q:=[a_1,b_1]\times \cdots \times [a_d,b_d]$，其体积定义为$$|Q|=\prod_{i\leq d}(b_i-a_i)$$
======(讲一讲基本的有维线性变换其行列式的知识，特别是集合意义，参考LADR)==

#### 2.2 外测度的上界与内测度的下界

* 外测度的上界
首先考虑可测集合$E$的外测度，由定义对于任意的$\varepsilon>0$都存在对$E$的一个由可数个超立方体构成的覆盖$\{Q_{i,\varepsilon}\}_{i\geq 1}$并且满足$$m^{*}(E)\geq \sum_{i\geq 1}|Q_{i,\varepsilon}|-\varepsilon$$同时由$T(E)$的定义，其中任何一个元素都可以表示为$T(x)$的形式，其中$x\in E$。那么由于$\{Q_{i,\varepsilon}\}_{i\geq 1}$覆盖$E$，于是必然$x$包含在某个$Q_{i_0,\varepsilon}$当中，那么自然$T(x)$包含在$\delta Q_{i_0,\varepsilon}$里面。于是$\{T( Q_{i,\varepsilon})\}_{i\geq 1}$构成对$T(E)$的覆盖。于是
$$\begin{aligned}m^{*}(T(E))&\leq m^{*}\left(\cup_{i\geq 1}T( Q_{i,\varepsilon})\right) \\&\leq \sum_{i\geq 1}m^{*}(T( Q_{i,\varepsilon}))\\&= |\det(T)|\sum_{i\geq 1}m^{*}(Q_{i,\varepsilon})\\&\leq  |\det(T)|m^{*}(E)+|\det(T)|\varepsilon\end{aligned}$$由于这个命题对任意的$\varepsilon>0$成立，于是得到$$m^{*}(T(E))\leq |\det(T)| m^{*}(E)$$
* 内测度的下界

一个会用到的关于线性变换的性质：

> [!note] 引理2.2
> $T$是$\mathbb{R}^d$的线性自同构，那么任意两个集合$A,B\subset \mathbb{R}^d$如果$$\text{dist}(A,B)>0\implies \text{dist}(T(A),T(B))>0$$

---

我们考虑线性映射的Lipschitz特性。不过如果利用$T$的Lipschitz性是达不到目的的，因为$$||T(x)-T(y)||\leq M||x-y||$$只能说$\text{dist}(T(A),T(B))$会有一个上界，但这肯定不是当前我们需要的。不过上面的不等式还能倒过来，因为$T$是自同构：$$||x-y||\leq ||T^{-1}|| \cdot ||T(x)-T(y)||$$于是如果$\text{dist}(A,B)>0$那么自然$\text{dist}(T(A),T(B))>0$

---

考虑$m_{*}(E)$,按照定义对于任意$\varepsilon>0$，都存在一个被$E$包含的紧集$K_{\varepsilon}$使得$$m_{*}(E)\leq m^{*}(K_{\varepsilon})+\varepsilon$$而我们又知道，紧集$K_{\varepsilon}$可以表示为可数个几乎不相交(almost disjoint:边界可能相交，但是内部不相交)的闭立方体的并，即$K_{\varepsilon}=\cup_{i\geq 1}Q'_{i,\varepsilon}$。因为立方体之间是几乎不相交的，于是由外测度的性质，$m^{*}(K_{\varepsilon})=\sum_{i\geq 1}m^{*}(Q'_{i,\varepsilon})$（这个性质是Lebesgue外测度的一个特殊的性质，并非所有抽象的外测度都有 ==这部分修改为一个引理，最好给出证明==）。现在，如果$T$是一个满射，那么由引理2.2,$\{T(Q_{i,\varepsilon}')\}_{i\geq 1}$是几乎不相交的一列立方体。于是再次利用Lebesgue外测度的性质$m^{*}(T(K_{\varepsilon}))=\sum_{i\geq 1}m^{*}(T(Q'_{i,\varepsilon}))$，那么由命题2.1关于立方体体积的式子，我们知道$$\begin{aligned}m^{*}(T(K_{\varepsilon}))&=\sum_{i\geq 1}m^{*}(T( Q_{i,\varepsilon}'))\\&= |\det(T)|\sum_{i\geq 1}m^{*}( Q_{i,\varepsilon}')\\&= |\det(T)|m^{*}(K_{\varepsilon}) \\&\geq |\det(T)|m_{*}(E)-|\det(T)|\varepsilon\end{aligned}$$
由于$T$的连续性，$T(K_{\varepsilon})$是一个在$T(E)$内的紧集合。上述不等式是对任意$\varepsilon>0$成立的，于是$$m_{*}(T( E))\geq m^{*}(T(K_{\varepsilon}))\geq |\det(T)|m_{*}(E)$$而如果$T$不是一个满射，那么由于上面不等式的最右边是0，不等式依旧成立。

于是综上所示，集合$T(E)$的Lebesgue外测度与内测度相等，于是$T(E)$Lebesgue可测，并且测度满足命题0中的式子。

### 3. 抽象测度角度的证明

> [!tip] 主要思路
> 我们可以对欧氏空间$\mathbb{R}^d$的任意子集$A$定义一个把子集映射到扩展实数的映射$m\circ T$，而我们的目标就是证明$m\circ T$的性质和Lebesgue测度$m$基本是一样的，只不过是相差一个与$T$有关的常数。而我们立刻想到在$\mathbb{R}^d$上Lebesgue测度就是唯一的Haar测度，这里的唯一性指的是各个不同的Haar测度之间相差一个常数。于是我们只需要证明$m\circ T$是一个Haar测度即可，为了实现这个目标：
> 1. 首先$m\circ T$得是一个外测度。
> 2. 其次这个外测度能构成一个Borel测度。
> 3. 这个Borel测度拥有一定的正规性，以及平移不变性。

关于测度论的基础知识可以参考：[[测度论的基础概念]]。

考虑$T$不是满射的这种情况下，$T(\mathbb{R}^d)$是一个小于$d$维的子空间，那么由于Lebesgue测度的性质，在这种情况下$m(T(A))=0$，同时又因为$\det(T)=0$因此成立命题0。

* 很好理解，因为假设某个集合$E\subseteq \mathbb{R}^m,m<d$,那么根据Lebesgue外测度的定义，我们可以找到可数个$\mathbb{R}^m$当中的单位立方体去覆盖$E$。然而$m$维的单位立方体在$\mathbb{R}^d$的体积意义下是0。这就导致实际上$E$被可数个零测度的集合覆盖，那么由Lebesgue测度的完备性告诉我们，$E$的是Lebesgue可测的，并且测度为0。

于是下面我们都假设$T$是一个满射，或者说是$\mathbb{R}^d$的线性自同构。

#### 3.1 外测度的确定

首先我们参考[[测度论的基础概念#1. 外测度]]，设$\mu:=m\circ T$，我们现在来验证其是否符合外测度的定义：
1. 把空集映射到0：这还算是比较显然，因为$T(\varnothing)=\varnothing$,再由Lebesgue测度的性质，$m(\varnothing)=0$,因此$\mu(\varnothing)=m\circ T(\varnothing)=0$。
2. 单调性：对于任意的$A,B\in \mathcal{P}(\mathbb{R}^d)$，并且$A\subseteq B$，因为$T(A)\subseteq T(B)$,再由Lebesgue测度的单调性，我们知道$$m(T(A))\leq m(T(B))$$因此由定义一定有$\mu(A)\leq \mu(B)$。
3. 可数的次可加性：如果$A_1,\cdots A_i\cdots\in \mathcal{P}(\mathbb{R}^d)$,那么经过线性变换以后我们会得到集合列$T(A_1),\cdots,T(A_i),\cdots$,然后由于Lebesgue测度的次可加性，于是$$m\left(\bigcup_{i\geq 1}T(A_i)\right)\leq \sum_{i\geq 1} m\left(T(A_i)\right)$$而由于$T(\cup_{i\geq 1}T(A_i))\subseteq \bigcup_{i\geq 1}T(A_i)$，再加上Lebesgue测度的单调性，于是得到$$m\left(T\left(\bigcup_{i\geq 1}A_i\right)\right)\leq \sum_{i\geq 1} m\left(T(A_i)\right)$$
综上所述，我们现在确定$\mu:=m\circ T$是一个外测度。

#### 3.2 Borel测度的确定

因为欧氏空间$\mathbb{R}^d$显然是一个度量空间，其中两点之间距离可以用欧氏范数定义为$$d(x,y):=||x-y||$$于是我们可以用[[测度论的基础概念#2.3 度量空间中判断外测度是否为Borel测度的方法]]中的“关于度量空间当中Borel测度的Caratheodory判别”。使用这个判别，我们需要判断，对于距离大于0的两个集合$A,B\subset \mathbb{R}^d$是否满足$$\mu(A\cup B)=\mu(A)+\mu(B)$$也就是说是否有$$m(T(A\cup B))=m(T(A))+m(T(B))$$同时考虑到因为$m$作为Lebesgue测度的性质，如果我们可以证明,在某种意义下：$$\text{dist}(A,B)>0\implies \text{dist}(T(A),T(B))>0$$那么一定有$T(A)\cap T(B)=\varnothing$,于是证明就结束了，而这就是引理2.2。于是再利用Lebesgue测度$m$的性质，我们就能得到$$m(T(A\cup B))=m(T(A))+m(T(B))$$
于是综上所述$\mu:=m\circ T$是一个Borel测度，记为$(\mathbb{R}^d,\mathcal{F},\mu)$，其中$\mathcal{F}$是对$\mathcal{B}(\mathbb{R}^d)$的一个完备化，其实也就是$\mathcal{L}(\mathbb{R}^d)$。

#### 3.3 验证其为Haar测度

首先我们需要验证测度$\mu$具有Haar测度的那些正则性以及平移的不变性，过程中可以利用$m$的正则性,因为Lebesgue测度本身就是一个Haar测度。

* 关于正则性(是否是Radon测度)的验证:
1. 内正则性：我们需要证明对任意$A\in \mathcal{F}$任意的$\varepsilon>0$都存在一个包含在$A$中的紧子集$K_{\varepsilon}$使得$\mu(K_{\varepsilon})>\mu(A)-\varepsilon$。我们可以这样构造：首先对于Lebesgue测度$m$而言，它是具有内正则新的。因此对任意$A\in \mathcal{F}$任意的$\varepsilon>0$都存在一个包含在$A$中的紧子集$K_{\varepsilon}'$使得$$m(K_{\varepsilon}')>m(A)-\varepsilon$$同时注意$T$是一个连续的满射，因此存在一个紧集合$K_{\varepsilon}$使得$T(K_{\varepsilon})=K_{\varepsilon}'$于是$$\mu(K_{\varepsilon})=(T(K_{\varepsilon}))>m(A)-\varepsilon$$因此得到了$\mu$的的内正则性。
2. 外正则性：我们需要证明对任意$A\in \mathcal{F}$任意的$\varepsilon>0$都存在一个包含$A$的开集$U_{\varepsilon}$使得$\mu(U_{\varepsilon})<\mu(A)+\varepsilon$。这一步的逻辑非常类似于内正则性的证明，主要是利用Lebesgue测度的外正则性，以及连续映射的性质。
3. 局部有限性：首先对于任意的紧集$K$,由于$T$是一个连续映射，因此紧集的像$T(K)$同样是紧的，而Lebesgue测度是具有局部有限性的，于是$$\mu(K)=m(T(K))<+\infty$$

* 关于平移不变性的验证：
我们需要验证是否对$A\in \mathcal{F}$,以及任意的$h\in \mathbb{R}^d$都有$$\mu(A+h)=\mu(A)$$而这很好验证，因为$T(A+h)=T(A)+T(h)$,其中$T(h)$是$\mathbb{R}^d$中的一个固定的元素。而由于Lebesgue测度是一个Haar测度，当然具有平移不变性，而我们可以证明$T(A)\in \mathcal{F}$,于是由于Lebesgue测度的平移不变性$$m(T(A)+T(h))=m(T(A))=\mu(A)$$
最有由于Haar测度的唯一性（同一个局部紧的拓扑群上不同的(左或者右)Haar测度之间相差一个正实数），于是存在一个与$T$有关的正实数$C_T$使得$$\mu=C_T m$$
#### 3.4 该系数是线性变换行列式的绝对值

现在我们需要说明$C_T=|\det(T)|$。

一些基本的观察：
1. 如果$T$不是满射，也就是说$T$在$\mathbb{R}^d$的某个基下的矩阵表示不是一个满秩的矩阵，这意味着$T(\mathbb{R}^d)$是Lebesgue零测度的。这样的话$\mu(T(A))=0,\forall A\in \mathcal{L}(\mathbb{R}^d)$.于是此时$C_T=0$。
2. 如果$T$是正交变换，我们选择特定的一个对象，比如$\mathbb{R}^d$当中的单位立方体$Q$。那么因为$$C_T=\frac{m(T(Q))}{m(Q)}$$而正交变换不改变立方体的体积，而立方体的体积就是其Lebesgue测度，于是此时$C_T=1$。
3. 