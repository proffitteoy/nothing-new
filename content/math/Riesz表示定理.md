---
obsidian-note-status:
  - colorful:completed
---

>[!note] 定理
>希尔伯特空间$\mathcal H$上的一个连续线性算子，存在唯一$g$满足$\ell (f) = (f,g)$，其中$||\ell || = ||g||$

我们在$\mathcal H$的子空间上考虑这个问题，取$$\mathcal S = \{f:\ell (f)=0\}$$如果这个子空间等于$\mathcal H$本身那么易证，若不然我们取$h\in \mathcal S^\perp$,要求$h$标准的.

我们先来验证$\ell (f)=(f,g)$：

直接取一个$$u=\ell (f)h-f\ell (h)$$
这样用$\ell$作用于它就等于0，那么他就属于$\mathcal S$与$h$正交，这样一来我们把$u$和$h$的内积拆开来$$\ell (f)(h,h)-\ell(h)(f,h)=0$$
因为$h$是标准的，那么我们整理一下就有$$\ell (f)=\ell (h)(f,h)=(f,\bar{\ell (h)}h)$$
我们把$bar{\ell (h)}h$记作$g$，那么$$\ell (f) = (f,g)$$
接下来证$||\ell || = ||g||$：

首先根据柯西-施瓦茨不等式有$$|\ell (f)|=|(f,g)|\leq ||f||||g||$$
我们对左右两边同时除以$||f||$,左边再取上极限得
$$||\ell||\leq||g||$$

另一方面上确界又给出了$|\ell|$的另一侧估计：我们取$f=g$则有
$$||\ell||\geq \frac{|\ell(g)|}{||g||}=||g||$$
得证。