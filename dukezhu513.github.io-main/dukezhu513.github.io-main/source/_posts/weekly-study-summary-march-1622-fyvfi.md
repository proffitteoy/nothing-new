---
title: 周学习总结（3月16日-22日）
date: '2025-03-27 17:18:22'
categories:
  - 学习笔记
tags:
  - 线性代数
  - Python
  - 算法
  - 综述
updated: '2025-03-27 17:19:30'
permalink: /post/weekly-study-summary-march-1622-fyvfi.html
comments: true
toc: true
---



# 周学习总结（3月16日-22日）

## 一、Isomap非线性降维技术

### 1. 介绍

1. Isomap 是一种非线性降维方法，把高维数据展开成低维，同时保留数据原本的“真实距离”（比如弯曲曲面上的最短路径，而不是直线距离）。
2. 例子：![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/%E5%9B%BE%E7%89%87.png)​

    ![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/isomap.png)​

    这是三维空间的“瑞士卷”数据集，Isomap 的作用就是把它摊平（降维），直接计算两点直线距离（欧氏距离）会穿过纸的内部，但真实距离应该是沿着纸面走的路径（测地距离）。但摊平后纸上两点的距离，依然等于揉皱时沿着纸面走的最短路径长度。

    具体实现的原理如下：

    * **邻域选择**：对每个数据点，选择其k个最近邻（k-NN）或ε邻域内的点，构建邻接图。邻域内的点用欧氏距离连接，非邻域点距离设为无穷大。
    * **局部欧氏性**：流形在局部与欧氏空间同胚，因此邻域内的欧氏距离可近似代替局部测地距离。

### 2. **Isomap 的优缺点**

**优点**：

* 能处理非线性数据（如曲面、螺旋结构）；
* 保留全局结构，适合数据可视化。

**缺点**：

* 计算慢（尤其大数据集）；
* 需要手动调参数（如邻居数量 k）；
* 对噪声敏感。

### 3.具体例子：

![Images by Tenenbaum,de Silva,Langford](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/example.png "Images by Tenenbaum,de Silva,Langford")​

有一个对雕像从不同角度拍摄的数据集。通过Isomap的优化算法，我们可以得到上图的二维展开数据图表：二维坐标可解释为横轴为“左右偏转”，纵轴为“上下俯仰”，并与光照方向形成三维可视化。

### 4. **Python 代码示例**

用 `scikit-learn`​ 快速实现：

```python
from sklearn.manifold import Isomap
from sklearn.datasets import make_swiss_roll

# 生成瑞士卷数据
X, _ = make_swiss_roll(n_samples=1000)

# 使用 Isomap 降维到2维
isomap = Isomap(n_neighbors=10, n_components=2)
X_2d = isomap.fit_transform(X)

# 可视化
plt.scatter(X_2d[:, 0], X_2d[:, 1])
plt.show()
```

## 二、线性代数

```python
# import numpy
import numpy as np
```

```python
#创建带有嵌套括号的矩阵
A = np.array([[1,2],[3,4],[5,6]])
#shape可以看到每个维度的数值
A.shape
```

### 

### 1. 矩阵的加法、乘法

1. 矩阵的加法

    如果矩阵的结构相同，矩阵可以相加，单元A添加到对应的单元B。

$$
\begin{bmatrix}
    A_{1,1} & A_{1,2} \\
    A_{2,1} & A_{2,2} \\
    A_{3,1} & A_{3,2} \\
\end{bmatrix}+
\begin{bmatrix}
    B_{1,1} & B_{1,2} \\
    B_{2,1} & B_{2,2} \\
    B_{3,1} & B_{3,2} \\
\end{bmatrix}=
\begin{bmatrix}
    A_{1,1} + B_{1,1} & A_{1,2} + B_{1,2} \\
    A_{2,1} + B_{2,1} & A_{2,2} + B_{2,2} \\
    A_{3,1} + B_{3,1} & A_{3,2} + B_{3,2}
\end{bmatrix}
$$

```python
A = np.array([[1, 2], [3, 4], [5, 6]])
B = np.array([[2, 5], [7, 4], [4, 3]])
C = A + B
```

2. 矩阵的乘法

$$
{A} \times {B} = {C}
$$

$$
{A}=\begin{bmatrix}
    1 & 2 & 3 \\
    4 & 5 & 6 \\
    7 & 8 & 9 \\
    10 & 11 & 12
\end{bmatrix}
$$

和

$$
{B}=\begin{bmatrix}
    2 & 7 \\
    1 & 2 \\
    3 & 6
\end{bmatrix}
$$

得到：

$$
\begin{align*}
&\begin{bmatrix}
    1 & 2 & 3 \\
    4 & 5 & 6 \\
    7 & 8 & 9 \\
    10 & 11 & 12
\end{bmatrix}\times
\begin{bmatrix}
    2 & 7 \\
    1 & 2 \\
    3 & 6
\end{bmatrix}=\\\\
&\begin{bmatrix}
    2 \times 1 + 1 \times 2 + 3 \times 3 & 7 \times 1 + 2 \times 2 + 6 \times 3 \\
    2 \times 4 + 1 \times 5 + 3 \times 6 & 7 \times 4 + 2 \times 5 + 6 \times 6 \\
    2 \times 7 + 1 \times 8 + 3 \times 9 & 7 \times 7 + 2 \times 8 + 6 \times 9 \\
    2 \times 10 + 1 \times 11 + 3 \times 12 & 7 \times 10 + 2 \times 11 + 6 \times 12 \\
\end{bmatrix}\\\\
&=
\begin{bmatrix}
    13 & 29 \\
    31 & 74 \\
    49 & 119 \\
    67 & 164
\end{bmatrix}
\end{align*}
$$

```python
A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]])
B = np.array([[2, 7], [1, 2], [3, 6]])
C = np.dot(A, B)
#相当于使用Numpy数组的方法 dot() ：
C = A.dot(B)
```

同时，矩阵乘法具有分配率：

$$
{A}({B}+{C}) = {AB}+{AC}
$$

$$
{A}=\begin{bmatrix}
    2 & 3 \\
    1 & 4 \\
    7 & 6
\end{bmatrix}, 
{B}=\begin{bmatrix}
    5 \\
    2
\end{bmatrix}, 
{C}=\begin{bmatrix}
    4 \\
    3
\end{bmatrix}
$$

---

$$
\begin{align*}
{A}({B}+{C})&=\begin{bmatrix}
    2 & 3 \\\\
    1 & 4 \\\\
    7 & 6
\end{bmatrix}\times
\left(\begin{bmatrix}
    5 \\\\
    2
\end{bmatrix}+
\begin{bmatrix}
    4 \\\\
    3
\end{bmatrix}\right)=
\begin{bmatrix}
    2 & 3 \\\\
    1 & 4 \\\\
    7 & 6
\end{bmatrix}\times
\begin{bmatrix}
    9 \\\\
    5
\end{bmatrix}\\\\
&=
\begin{bmatrix}
    2 \times 9 + 3 \times 5 \\\\
    1 \times 9 + 4 \times 5 \\\\
    7 \times 9 + 6 \times 5
\end{bmatrix}=
\begin{bmatrix}
    33 \\\\
    29 \\\\
    93
\end{bmatrix}
\end{align*}
$$

等于

$$
\begin{align*}
{A}{B}+{A}{C} &= \begin{bmatrix}
    2 & 3 \\
    1 & 4 \\
    7 & 6
\end{bmatrix}\times
\begin{bmatrix}
    5 \\
    2
\end{bmatrix}+
\begin{bmatrix}
    2 & 3 \\
    1 & 4 \\
    7 & 6
\end{bmatrix}\times
\begin{bmatrix}
    4 \\
    3
\end{bmatrix}\\\\
&=
\begin{bmatrix}
    2 \times 5 + 3 \times 2 \\
    1 \times 5 + 4 \times 2 \\
    7 \times 5 + 6 \times 2
\end{bmatrix}+
\begin{bmatrix}
    2 \times 4 + 3 \times 3 \\
    1 \times 4 + 4 \times 3 \\
    7 \times 4 + 6 \times 3
\end{bmatrix}\\\\
&=
\begin{bmatrix}
    16 \\
    13 \\
    47
\end{bmatrix}+
\begin{bmatrix}
    17 \\
    16 \\
    46
\end{bmatrix}=
\begin{bmatrix}
    33 \\
    29 \\
    93
\end{bmatrix}
\end{align*}
$$

```python
A = np.array([[2, 3], [1, 4], [7, 6]])
B = np.array([[5], [2]])
C = np.array([[4], [3]])
D = A.dot(B+C)
#等效于
D = A.dot(B) + A.dot(C)
```

$$
{A}=\begin{bmatrix}
    3 & 0 & 2 \\
    2 & 0 & -2 \\
    0 & 1 & 1
\end{bmatrix}
$$

 使用 `numpy`​ 的 `linalg.inv()`​ 来计算A的逆。

```python
A = np.array([[3, 0, 2], [2, 0, -2], [0, 1, 1]])
A_inv = np.linalg.inv(A)
A_inv = np.linalg.inv(A) #使用A乘A的逆等于单位矩阵来判断求的逆是否正确
```

## 三、阅读智人之上（**第一章——第四章）**

**核心观点**：

1. 信息的本质是“联结”，而非单纯反映现实。
2. 故事是人类独有的“信息技术”，通过虚构的联结（如宗教、国家、货币）实现大规模合作。
3. 文件（如文字、记录）扩展了信息存储与管理能力，但官僚制度随之产生，形成“双刃剑”。
4. 人类追求“绝对正确”的认知是幻想，所有认知都受时代、技术、文化局限，且必须接受错误以推动进步。

## 四、综述阅读

本周阅读了《人工智能大模型综述及展望》和《图模互补：知识图谱与大模型融合综述》

总结：

大模型是人工智能领域的重要发展方向，它先后经历了机器学习模型、深度学习模型、预训练模型和大规模预训练模型4个阶段。目前大模型采用深度神经网络架构，难以对模型的训练和推理过程进行跟踪和解释，因此在对可靠性安全性、要求较高的领域存在风险，如自动驾驶、临床医疗。同时大模型的性能提升出现了边际效益递减效应。同时，训练大模型的数据可能会涉及隐私问题。在未来，研究大模型的方向为：大模型原理和能力，优化大模型训练，以及开发围绕大模型训练的硬件、大模型的安全和伦理问题、具身智能。

大模型自身面临解释性不足、知识实时性差、生成结果存在虚假信息等诸多挑战。为了应对这些问题,知识图谱与大模型的融合逐渐成为了研究热点。通过可靠的知识图谱可以让大模型减少幻觉，为大模型提供更加准确、严谨的信息并且实现大模型逐步产生思考。

## 五、算法

学习了枚举法暴力求解。

代码错误调试方法

* 编译错误

  是指在将源代码转换为机器码的过程中，编译器发现了语法或语义上的问题，导致无法生成目标文件。与代码本身有关，大概率是出现打错或者打漏的情况，有行号提示。
* 链接错误

  是指在将多个目标文件（.o 或 .obj）组合成最终可执行文件时，链接器未能找到某些符号（如函数、变量）的定义。报错出现`LNK`​标识。
* 运行中的错误

  通过打断点进行单步调试，在监视的窗口下监控变量，从而找到错误的位置。

  ‍

  ‍
