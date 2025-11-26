---
obsidian-note-status:
  - colorful:completed
---
## Wirtinger 导数与全纯性

>[!tip]
>Wirtinger 导数的引入标志着复分析视角的转变：我们将复平面 $\mathbb{C}$ 视为由两个**形式上独立**的变量 $z$ 和 $\bar{z}$ 生成的空间。
>
>在这个框架下，全纯函数 (Holomorphic Function) 的几何直观变得异常清晰：**全纯函数是那些“看不见” $\bar{z}$ 的函数**。即，全纯性等价于柯西-黎曼方程 (C-R Equations)，而在代数上，这仅仅意味着 $\frac{\partial f}{\partial \bar{z}} = 0$。这使得复微分运算可以像多项式求导一样简单，完全类比实微积分。

### 1. 定义与算子构造

>[!example] 定义
>**Wirtinger 算子 (Wirtinger Operators)**
>
>基于复变量 $z = x+iy$ 与 $\bar{z} = x-iy$ 的线性变换关系，定义以下微分算子：
>$$ \frac{\partial}{\partial z} := \frac{1}{2} \left( \frac{\partial}{\partial x} - i \frac{\partial}{\partial y} \right) $$
>$$ \frac{\partial}{\partial \bar{z}} := \frac{1}{2} \left( \frac{\partial}{\partial x} + i \frac{\partial}{\partial y} \right) $$

>[!example] 定理
>**全纯性的代数刻画**
>
>设 $f: \Omega \subseteq \mathbb{C} \to \mathbb{C}$ 为 $C^1$ 类函数（即视作 $\mathbb{R}^2 \to \mathbb{R}^2$ 时偏导数连续）。则以下命题等价：
>1.  $f$ 在 $\Omega$ 上全纯（复可导）。
>2.  $f$ 满足柯西-黎曼方程 (Cauchy-Riemann Equations)。
>3.  $f$ 满足 **Wirtinger 方程**：
>    $$ \frac{\partial f}{\partial \bar{z}} = 0 $$
>此时，复导数由 $f'(z) = \frac{\partial f}{\partial z}$ 给出。

---

### 2. 推导与证明

#### 2.1 形式化坐标变换
为了使得算子定义自然浮现，我们首先处理坐标变换的代数结构。
考虑映射 $(x, y) \mapsto (z, \bar{z})$：
$$ z = x + iy, \quad \bar{z} = x - iy $$
逆变换为：
$$ x = \frac{z + \bar{z}}{2}, \quad y = \frac{z - \bar{z}}{2i} $$
计算雅可比矩阵的元素（形式偏导数）：
$$ \frac{\partial x}{\partial z} = \frac{1}{2}, \quad \frac{\partial x}{\partial \bar{z}} = \frac{1}{2} $$
$$ \frac{\partial y}{\partial z} = \frac{1}{2i} = -\frac{i}{2}, \quad \frac{\partial y}{\partial \bar{z}} = -\frac{1}{2i} = \frac{i}{2} $$

#### 2.2 链式法则与算子导出
利用多元微积分的链式法则，将 $\frac{\partial}{\partial z}$ 和 $\frac{\partial}{\partial \bar{z}}$ 展开为实算子 $\frac{\partial}{\partial x}, \frac{\partial}{\partial y}$ 的线性组合。
对于任意可微函数 $f(x, y)$：
$$ \begin{aligned} \frac{\partial f}{\partial z} &= \frac{\partial f}{\partial x} \frac{\partial x}{\partial z} + \frac{\partial f}{\partial y} \frac{\partial y}{\partial z} \\ &= \frac{1}{2} \frac{\partial f}{\partial x} - \frac{i}{2} \frac{\partial f}{\partial y} \\ &= \frac{1}{2} \left( \frac{\partial}{\partial x} - i \frac{\partial}{\partial y} \right) f \end{aligned} $$
同理可得 $\frac{\partial}{\partial \bar{z}}$ 的表达式。这完成了算子的构造性证明。

#### 2.3 柯西-黎曼方程的算子化 (C-R Equations)
考察算子 $\frac{\partial}{\partial \bar{z}}$ 作用于复值函数 $f = u + iv$ 时的具体形式。
$$ \begin{aligned} \frac{\partial f}{\partial \bar{z}} &= \frac{1}{2} \left( \frac{\partial}{\partial x} + i \frac{\partial}{\partial y} \right) (u + iv) \\ &= \frac{1}{2} \left[ \left( \frac{\partial u}{\partial x} - \frac{\partial v}{\partial y} \right) + i \left( \frac{\partial v}{\partial x} + \frac{\partial u}{\partial y} \right) \right] \end{aligned} $$
由此可见：
*   **若 C-R 方程成立**：即 $\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y}$ 且 $\frac{\partial v}{\partial x} = -\frac{\partial u}{\partial y}$，则上式实部与虚部均为 0，故 $\frac{\partial f}{\partial \bar{z}} = 0$。
*   **若 $\frac{\partial f}{\partial \bar{z}} = 0$**：则实部与虚部必须同时为 0，即推导出 C-R 方程。

#### 2.4 全纯性的充分性证明 (从 Wirtinger 到复导数)
这是你提到的核心逻辑：**如何仅从 C-R 方程（即 $\frac{\partial f}{\partial \bar{z}} = 0$）出发，证明 $f$ 是全纯的？**

利用全微分的形式，我们可以给出一个极其简洁的论证：
1.  由于 $f$ 是 $C^1$ 的（实可微），其全微分 $df$ 可以写成 Wirtinger 形式：
    $$ df = \frac{\partial f}{\partial z} dz + \frac{\partial f}{\partial \bar{z}} d\bar{z} $$
2.  若 C-R 方程成立，则由 2.3 节可知 $\frac{\partial f}{\partial \bar{z}} = 0$。此时全微分退化为：
    $$ df = \frac{\partial f}{\partial z} dz $$
3.  考察复导数的定义（差商的极限）：
    $$ \lim_{\Delta z \to 0} \frac{f(z + \Delta z) - f(z)}{\Delta z} = \lim_{\Delta z \to 0} \frac{\Delta f}{\Delta z} $$
    当 $\Delta z \to 0$ 时，代入全微分表达式（忽略高阶小量）：
    $$ \frac{\Delta f}{\Delta z} \approx \frac{\frac{\partial f}{\partial z} \Delta z}{\Delta z} = \frac{\partial f}{\partial z} $$
4.  由于 $\frac{\partial f}{\partial z}$ 存在且与路径无关（因为 $d\bar{z}$ 项消失了），极限存在。
    **结论**：$f$ 在 $z$ 点复可导，且 $f'(z) = \frac{\partial f}{\partial z}$。