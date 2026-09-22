---
obsidian-note-status:
  - colorful:completed
---

定义为

$$
\Lambda(\theta) = -\int_{0}^{\theta}\log\left|2\sin t\right|\,dt
$$

这是一种对曲面引起的体积变化率的积分：理想四面体的几何会由二面角表示，而Schläfli 体积微分公式会产生对数形式，两者组合起来就是$-\log\left|2\sin t\right|$。

我感觉这个式子不是定义来恰好等于体积的，而是把体积拆成基本部分记作一个记号而已。
# 一些基本性质
## 对称性

观察函数，有不错的对称性并且周期是$\pi$，同时还是奇函数，合起来就是
$$\Lambda(\pi-\theta) = -\Lambda(\theta) $$


## 傅里叶展开


$$\Lambda(\theta) = \frac{1}{2}\sum_{n=1}^{\infty}\frac{sin(2n\theta)}{n^2}$$
我们先考虑$$-log(1-z) = \int_{0}^{z}\frac{1}{1-w}dw = \sum_{n=1}^{\infty}\frac{z^n}{n}$$
我们取$z=re^{2i\theta}$那么取极限$r=1$有$-log(1-e^{2i\theta})=\sum_{n=1}^{\infty}\frac{e^{2in\theta}}{n}$

我们取实部，右侧比较好取，左侧有结论$Re(log(1-z))=log|1-z|$:
$$-log|1-e^{2i\theta}|= \sum_{n=1}^{\infty}\frac{cos(2n\theta)}{n}$$

然后再对两边求一次积分就是展开式


# 对ideal simplex体积的求解


我们考虑理想四边形的投影T，那么他的体积可以表示成积分
$$
\begin{aligned}
V &= \int_{x,y \in T}\int\int_{z \geq \sqrt{1-x^2-y^2}}\frac{dxdydz}{z^3} \\
  &= \text{省略一些过程} \\
  &= \frac{1}{4}[\Lambda(\gamma+\alpha)-\Lambda(\gamma-\alpha)-\Lambda(\frac{\pi}{2}+\alpha)+\Lambda(\frac{\pi}{2}-\alpha)]
\end{aligned}
$$
# 更一般的情况

需要满足
$$\sum_{i=1}^n a_i=\pi \quad Volume(\sum_{a_1,...,a_n})=\sum_{i=1}^n \Lambda(a_i)$$

即只要能满足粘和方程都能通过分解求解（是否存在一种不由理想四面体的作为单位分解元素的体积求解方法？）

