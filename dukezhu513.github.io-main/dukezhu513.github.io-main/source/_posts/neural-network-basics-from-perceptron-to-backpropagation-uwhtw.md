---
title: 神经网络基础：从感知机到反向传播
date: '2025-10-18 01:05:55'
categories:
  - 学习笔记
tags:
  - 机器学习
  - 深度学习
updated: '2025-10-20 00:58:23'
permalink: /post/neural-network-basics-from-perceptron-to-backpropagation-uwhtw.html
comments: true
toc: true
---



# 神经网络基础：从感知机到反向传播

# 1. 神经元模型

神经网络的基本单元是**神经元（Neuron）** ，其数学形式为：

$$
y = f\left( \sum_{i=1}^{n} w_i x_i + b \right) = f(\mathbf{w}^\top \mathbf{x} + b)
$$

其中：

- $\mathbf{x} \in \mathbb{R}^n$ 为输入向量；
- $\mathbf{w} \in \mathbb{R}^n$ 为权重向量；
- $b \in \mathbb{R}$ 为偏置项；
- $f(\cdot)$ 为**激活函数**（Activation Function），用于引入非线性。

该模型本质上是线性变换 $\mathbf{w}^\top \mathbf{x} + b$ 与非线性激活函数的组合。若省略激活函数，则整个网络退化为线性模型。单个神经元模型，也常被称为“感知器”（Perceptron）。

# **2. 神经网络结构**

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20122217-20251019204646-gff9sv9.png)

多个神经元前后相连，就构成了**神经网络。** 一个典型的前馈神经网络由以下三层构成：

- **输入层**（Input Layer）：接收原始特征向量 $\mathbf{x} \in \mathbb{R}^d$；
- **隐藏层**（Hidden Layer(s)）：执行特征提取与非线性变换；层数和每层神经元数量并非越多越好，过多容易导致过拟合，泛化能力差。
- **输出层**（Output Layer）：给出最终的预测结果，比如分类标签或回归值。

设第 $l$ 层的输出为 $\mathbf{h}^{(l)}$，则前向传播过程可表示为：

$$
\mathbf{h}^{(l)} = f^{(l)}\left( \mathbf{W}^{(l)} \mathbf{h}^{(l-1)} + \mathbf{b}^{(l)} \right)
$$

其中 $\mathbf{W}^{(l)}$ 和 $\mathbf{b}^{(l)}$ 分别为第 $l$ 层的权重矩阵与偏置向量。

# 3. 为何需要非线性？——多层感知机（MLP）的动机

若所有层均为线性变换，则无论网络深度如何，整体仍等价于单一线性映射。例如，对两层网络：

$$
\begin{aligned}
\mathbf{h} &= \mathbf{W}_1 \mathbf{x} + \mathbf{b}_1 \\
\mathbf{y} &= \mathbf{W}_2 \mathbf{h} + \mathbf{b}_2 = \mathbf{W}_2 (\mathbf{W}_1 \mathbf{x} + \mathbf{b}_1) + \mathbf{b}_2 = (\mathbf{W}_2 \mathbf{W}_1) \mathbf{x} + (\mathbf{W}_2 \mathbf{b}_1 + \mathbf{b}_2)
\end{aligned}
$$

结果仍为仿射变换。

如果神经网络只有线性变换，那无论堆叠多少层，其效果都等同于一个单层线性模型，这就是所谓的“退化”问题。为了赋予网络强大的表达能力，我们必须在每一层线性计算后加入**激活函数层**。因此，**必须引入非线性激活函数**，才能使网络具备拟合复杂函数的能力。

‍

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20205914-20251019210002-zwaawmx.png)

多层感知机（Multilayer Perceptron, MLP）即是在隐藏层中引入激活函数的前馈神经网络，是现代深度学习模型的基础。

# 4. **激活函数层**

‍

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20211137-20251019225103-i5y2ciw.png)

### (1) Sigmoid 函数

‍

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20211325-20251019221717-znxj33s.png)

‍

$$
\sigma(x) = \frac{1}{1 + e^{-x}}
$$

- 输出范围：$(0, 1)$；
- 常用于二分类输出层；
- 缺点：梯度饱和（梯度消失）；输出非零中心：0.5。

### (2) Tanh 函数

‍

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20211428-20251019224602-ee8hzku.png)

$$
\tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}}
$$

- 输出范围：$(-1, 1)$；
- 零中心，收敛通常快于 Sigmoid；
- 仍存在梯度消失问题。

### (3) ReLU 函数（Rectified Linear Unit）

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20211539-20251019224636-tpdccqz.png)

$$
\text{ReLU}(x) = \max(0, x)
$$

- 计算高效，无指数运算；
- 梯度在 $x > 0$ 时恒为 1，缓解梯度消失；
- 缺点：存在“Dead ReLU”问题（负输入导致神经元永久失活）。

ReLU 及其变体（如 Leaky ReLU、ELU）是当前深度网络隐藏层的默认选择。

### (4) Softmax 函数（用于多分类输出层）

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20214127-20251019224713-3hc7lbd.png)

$$
\text{Softmax}(z_i) = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}, \quad i = 1, \dots, K
$$

- 将任意实数向量 $\mathbf{z} \in \mathbb{R}^K$ 映射为概率分布；
- 输出满足 $\sum_{i=1}^K \text{Softmax}(z_i) = 1$ 且 $\text{Softmax}(z_i) \in (0,1)$；
- 通常与交叉熵损失联合使用。

# 5 **. Softmax层与训练目标**

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20122312-20251019204732-f86v1ge.png)

### **Softmax层**

**Softmax层**：通常用于多分类任务的输出层。它的作用是将网络最后一层的原始输出（可能是任意实数）**归一化**成一个概率分布。这样，每个输出节点的值都在[0, 1]之间，且所有值之和为1。数值最大的那个节点，就代表了模型预测的类别。

我们使用**损失函数 (Loss Function)** 来量化预测结果与真实标签之间的差距。对于分类任务，常用**交叉熵损失**（Cross-Entropy Loss），预测越准确（概率越接近1），损失值越小。：

$$
\mathcal{L} = -\sum_{i=1}^{K} y_i \log(\hat{y}_i)
$$

其中：

- $\mathbf{y} \in \{0,1\}^K$ 为 one-hot 真实标签；
- $\hat{\mathbf{y}} = \text{Softmax}(\mathbf{z})$ 为模型预测概率。

训练目标是最小化损失函数 $\mathcal{L}$，通过**反向传播**（Backpropagation）与**梯度下降**更新参数 $\{\mathbf{W}^{(l)}, \mathbf{b}^{(l)}\}$。

#### 6 **. 反向传播：让网络自己学习**

有了损失函数，我们就有了优化目标：**最小化损失**。那么如何调整网络中的海量参数（权重W和偏置b）呢？答案就是**反向传播算法 (Backpropagation)** 。

反向传播的核心思想是 **：** 利用**梯度下降法**。想象损失函数是一个“山丘”，我们的目标是找到最低点（全局最小值）。反向传播就像一个登山者，沿着山坡最陡峭的下坡方向（负梯度方向）一步步前进，不断更新W和b的值，直到找到最低点。

**步骤**：从输出层的损失开始，根据链式法则，将误差一层层地反向传递回前面的每一层，从而计算出每一层参数的梯度，并据此更新参数。

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20122348-20251019204809-kp8ei4l.png)

红色箭头清晰地标示了信息流的方向：从输入到输出是“前向传播”，从损失到输入是“反向传播”。

#### **总结**

神经网络的学习之旅，可以概括为以下几个步骤：

1. **前向传播**：数据从输入层进入，经过层层线性变换和激活函数处理，最终到达输出层。
2. **计算损失**：输出层的结果经过Softmax等处理后，与真实标签对比，通过损失函数计算出当前的“错误程度”。
3. **反向传播**：根据损失值，利用梯度下降法，从后往前计算并更新网络中所有的权重和偏置参数。
4. **迭代优化**：重复以上过程，直到损失值足够小，或者达到预设的训练轮数。

# 6.前向传播与反向传播

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-10-19%20122348-20251019204809-kp8ei4l.png)

## （1）神经网络为何需要前向与反向传播

神经网络本质上是一种**参数化的非线性函数逼近器**。其目标是通过调整内部参数（权重与偏置），使得对输入样本的预测尽可能接近真实标签。这一目标的实现依赖两个关键过程：

- **前向传播**（Forward Propagation）：用于计算模型在当前参数下的预测输出；
- **反向传播**（Backpropagation）：用于计算损失函数对所有参数的梯度，从而指导参数更新。

若仅进行前向计算而无法有效更新参数，则网络无法“学习”。早期的感知机模型因缺乏有效的多层参数更新机制而受限。直到 1986 年，Hinton 等人提出**反向传播算法**，才使得多层非线性网络的端到端训练成为可能，由此奠定了现代深度学习的基础。

## （2）前向传播：从输入到预测

前向传播描述数据在网络中的流动过程。设第 $l$ 层的输入为 $\mathbf{h}^{(l-1)}$，其输出为：

$$
\mathbf{z}^{(l)} = \mathbf{W}^{(l)} \mathbf{h}^{(l-1)} + \mathbf{b}^{(l)}, \quad
\mathbf{h}^{(l)} = f^{(l)}(\mathbf{z}^{(l)})
$$

其中：

- $\mathbf{W}^{(l)}$ 为权重矩阵，
- $\mathbf{b}^{(l)}$ 为偏置向量，
- $f^{(l)}$ 为激活函数。

若无激活函数（即 $f^{(l)}$ 为恒等映射），则无论网络深度如何，整体仍等价于单一线性变换：

$$
\mathbf{y} = \mathbf{W}^{(L)} \cdots \mathbf{W}^{(1)} \mathbf{x} + \text{常数项}
$$

此类模型无法拟合非线性可分问题（如异或、环形分布等）。因此，**激活函数的引入是神经网络具备表达能力的关键**，它使网络能够将输入映射到高维非线性空间，在该空间中原本不可分的数据变得线性可分。

对于 $K$ 类分类任务，输出层通常采用 Softmax 激活函数：

$$
\hat{y}_k = \frac{e^{z_k^{(L)}}}{\sum_{j=1}^{K} e^{z_j^{(L)}}}, \quad k = 1, \dots, K
$$

该变换将原始输出归一化为概率分布，便于后续损失计算与类别预测。

## （3） 损失函数：量化预测误差

训练的目标是最小化模型预测与真实标签之间的差距。以均方误差（MSE）为例：

$$
E = \frac{1}{2} \sum_{k=1}^{K} (\hat{y}_k - d_k)^2
$$

其中 $d_k$ 为真实标签（one-hot 编码），$\hat{y}_k$ 为模型预测值。因子 $\frac{1}{2}$ 用于简化求导结果。

由于损失函数 $E$ 是关于网络参数 $\{\mathbf{W}^{(l)}, \mathbf{b}^{(l)}\}$ 的高度非线性函数，通常无解析解，需借助**数值优化方法**（如梯度下降）迭代求解。为此，必须高效计算 $\frac{\partial E}{\partial w_{ji}}$ 等偏导数——这正是反向传播的核心任务。

## （4）反向传播：基于链式法则的梯度计算

### 4.1 动机

若直接对 $E$ 关于每个参数求偏导，计算复杂度随网络规模指数增长。反向传播通过**动态规划思想**与**链式法则**，将梯度计算分解为局部可复用的子问题，实现高效、自动的梯度推导。

### 4.2 链式法则推导（以两层网络为例）

定义变量：

- 隐藏层神经元 $j$ 的加权输入：$x_j = \sum_i w_{ji} y_i + b_j$

- 隐藏层输出：$y_j = f(x_j)$，$f$ 为可导激活函数（如 Sigmoid）
- 输出层预测：$\hat{y}_k$
- 真实标签：$d_k$
- 损失函数：$E = \frac{1}{2} \sum_k (\hat{y}_k - d_k)^2$

目标：计算 $\frac{\partial E}{\partial w_{ji}}$。

根据链式法则：

$$
\frac{\partial E}{\partial w_{ji}} = \frac{\partial E}{\partial x_j} \cdot \frac{\partial x_j}{\partial w_{ji}}
$$

**第一步：局部导数**

$$
\frac{\partial x_j}{\partial w_{ji}} = y_i
$$

**第二步：全局误差信号**

$$
\frac{\partial E}{\partial x_j} = \frac{\partial E}{\partial y_j} \cdot f'(x_j)
$$

其中：

$$
\frac{\partial E}{\partial y_j} = \sum_k \frac{\partial E}{\partial \hat{y}_k} \cdot \frac{\partial \hat{y}_k}{\partial y_j}
= \sum_k (\hat{y}_k - d_k) v_{kj}
$$

（假设输出层为线性：$\hat{y}_k = \sum_j v_{kj} y_j + c_k$）

因此：

$$
\frac{\partial E}{\partial x_j} = \left[ \sum_k (\hat{y}_k - d_k) v_{kj} \right] \cdot f'(x_j)
$$

**最终梯度：**

$$
\frac{\partial E}{\partial w_{ji}} = \left[ \sum_k (\hat{y}_k - d_k) v_{kj} \right] \cdot f'(x_j) \cdot y_i
$$

### 4.3 误差向前层传递

为支持更深网络，需将误差继续向前传递：

$$
\frac{\partial E}{\partial y_i} = \sum_j \frac{\partial E}{\partial x_j} \cdot w_{ji}
$$

该式表明：前一层神经元的误差信号是其所有下游神经元误差的加权和。

# 总结

神经网络的学习能力源于其**非线性表达能力**与**端到端参数优化机制**的结合。单个神经元本质上是带偏置的线性变换，但通过堆叠多层并引入可导的激活函数（如 ReLU、Sigmoid、Tanh），网络能够将输入映射到高维非线性空间，从而解决线性不可分问题。这种结构即为多层感知机（MLP），是现代深度学习模型的理论基石。

训练过程依赖两个核心流程：

- **前向传播**完成从输入到预测的计算，并通过 Softmax 等输出层生成概率分布；
- **反向传播**则利用链式法则，高效计算损失函数对所有参数的梯度，为优化算法（如梯度下降）提供更新依据。

其中，链式法则的逐层分解机制，使得即使面对数百万参数，梯度仍能以线性时间复杂度完成计算。这一设计不仅解决了早期感知机无法训练多层结构的瓶颈，也构成了当今所有深度学习框架（如 PyTorch、TensorFlow）自动微分系统的数学基础。
