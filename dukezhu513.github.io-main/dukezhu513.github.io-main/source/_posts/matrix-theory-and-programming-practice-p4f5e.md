---
title: 矩阵理论和编程实践
date: '2025-04-07 14:04:56'
categories:
  - 学习笔记
tags:
  - 线性代数
  - Python
  - 机器学习基础
updated: '2025-04-07 14:08:34'
permalink: /post/matrix-theory-and-programming-practice-p4f5e.html
comments: true
toc: true
---



# 矩阵理论和编程实践

近期学完了矩阵的相关知识点，想通过几个问题，将重要知识点和编程串联。

## **问题1：用克拉默法则求解线性方程组**

<span data-type="text" style="font-size: 19px;">解线性方程组：</span>

$$
\left\{  
\begin{aligned} 
&x_1 + 2x_2 - x_3 = 5 \\
&x_1 - x_2 + x_3 = 5 \\
&2x_1 + 3x_2 - x_3 = 1
\end{aligned}
\right.
$$

‍

**解：** 

1. 先计算行列式$d$，并且判断是否$d \neq 0$​$ $

$$
{d}=\left | \begin{matrix}
1 & 2 & 1 \\\\
1 & -1 & 1  \\\\
2 & 3 & -1 \\
\end{matrix} \right | =
\left | \begin{matrix}
0 & 2 & 1 \\\\
0 & -1 & 1  \\\\
3 & 3 & -1 \\
\end{matrix} \right | = 
3\left | \begin{matrix}
2 & 1 \\\\
-1 & 1 \\
\end{matrix} \right | = 
9 \neq 0
$$

2. 计算$d_1、d_2、d_3$

$$
{d_1}=\left | \begin{matrix}
5 & 2 & 1 \\\\
5 & -1 & 1  \\\\
1 & 3 & -1 \\
\end{matrix} \right | =
\left | \begin{matrix}
0 & 0 & 1 \\\\
0 & -3 & 1  \\\\
6 & 5 & -1 \\
\end{matrix} \right | = 
\left | \begin{matrix}
0 & -3 \\\\
6 & 5 \\
\end{matrix} \right | = 
18
$$

$$
{d_2}=\left | \begin{matrix}
1 & 5 & 1 \\\\
1 & 5 & 1  \\\\
2 & 1 & -1 \\
\end{matrix} \right | 
=0
$$

$$
{d_3}=\left | \begin{matrix}
1 & 2 & 5 \\\\
1 & -1 & 5  \\\\
2 & 3 & 1 \\
\end{matrix} \right | =
\left | \begin{matrix}
0 & 3 & 0 \\\\
1 & -1 & 5  \\\\
2 & 3 & 1 \\
\end{matrix} \right | = 
-3\left | \begin{matrix}
1 & 5 \\\\
2 & 1 \\
\end{matrix} \right | = 
27
$$

3. 得出线性方程的唯一解$ $

    唯一解为：$x_1 = \frac{d_1}d,x_2 = \frac{d_2}d,x_3 = \frac{d_3}d$

### **Python:** 

```python
import numpy as np
d = np.array([[1, 2, 1], [1, -1, 1], [2, 3, -1]])
b = np.array([5, 5, 1])
det_d = np.linalg.det(d)

if det_d != 0:
    # 替换各列求d1, d2, d3
    d1 = d.copy(); d1[:,0] = b
    d2 = d.copy(); d2[:,1] = b
    d3 = d.copy(); d3[:,2] = b

    # 求线性方程组的唯一解
    x1 = np.linalg.det(d1)/det_d
    x2 = np.linalg.det(d2)/det_d
    x3 = np.linalg.det(d3)/det_d
    print(f"x1={x1:.1f}, x2={x2:.1f}, x3={x3:.1f}")
else:
    print("无唯一解")
```

### <span data-type="text" style="font-size: 21px;">知识点：</span>

1. 行列式的计算方法（书P51）（7个）：

    * 化三角法
    * 降阶法(选择0最多的行（列）展开，降为低阶)
    * 加边法（*非对角线元素具有相同规律）
    * 拆行（列）法
    * 递归法（找规律）
    * 析因子法
2. 行列式的基本性质（书P38）（6个）：

    * 行列互换，行列式不变
    * 行列式中一行乘$k$，行列式变为原来的$k$倍
    * 行列式中某行元素均为两个元素的和，行列式等于两个行列数的和
    * 行列式某两行相同或者成比例，行列式为0
    * 一行的$k$倍加到另一行，行列式不变
    * 两行互换，行列式反号
3. 克拉默法则（书P58）
4. 行列式的定义

## 问题二：**分块矩阵求逆**

设$m+n$阶方阵$D$为：

$$
{D}= \begin{pmatrix}
A & 0 \\\\
C & B
\end{pmatrix}
$$

其中$A$为$m$阶可逆矩阵，$B$为$n$阶可逆矩阵，证明$D$可逆，并求$D^{-1}$.

‍

**解:** 

1. 因为$A,B $均可逆，则$\begin{vmatrix} A \end{vmatrix} \neq 0 $,$\begin{vmatrix} B \end{vmatrix} \neq 0 $,又$\begin{vmatrix} D \end{vmatrix}= \begin{vmatrix} A \end{vmatrix} \cdot \begin{vmatrix} B \end{vmatrix} $，故$\begin{vmatrix} D \end{vmatrix} \neq 0$，$D$可逆.$ $
2. 设

$$
D^{-1} =
\begin{pmatrix}
X_{11} & X_{12} \\\\
X_{21} & X_{22} \end{pmatrix}
$$

此时$DD^{-1}= E_{m+n}$

$$
\begin{pmatrix} A & O \\ C & B \end{pmatrix}
\begin{pmatrix} X_{11} & X_{12} \\ X_{21} & X_{22} \end{pmatrix}=
\begin{pmatrix} E_m & O \\ O & E_n \end{pmatrix}
$$

$$
\begin{cases}
AX_{11} = E_m \\
AX_{12} = O \\
CX_{11} + BX_{21} = O \\
CX_{12} + BX_{22} = E_n
\end{cases}
$$

3. 由第一、二式可知：

$$
X_{11} = A^{-1}, \quad X_{12} = O \\
$$

 由第三、四式可知：

$$
X_{21} = -B^{-1}CA^{-1}, \quad X_{22} = B^{-1}
$$

故：

$$
D^{-1} = 
\begin{pmatrix} 
A^{-1} & O \\ 
-B^{-1}CA^{-1} & B^{-1} 
\end{pmatrix}
$$

若$C = 0$，则：

$$
D^{-1} = 
\begin{pmatrix} 
A^{-1} & O \\ 
0 & B^{-1} 
\end{pmatrix}
$$

### Python求矩阵的逆

```python
import numpy as np

# 定义矩阵（需为方阵）
D = np.array([[A, 0], [C, B]])

# 求逆矩阵
D_inv = np.linalg.inv(D)
```

### **知识点：** 

1. 矩阵分块
2. 可逆矩阵的性质(书P83页)：

## 问题三：矩阵秩的计算

如何通过初等行变换化为行阶梯形矩阵，并计算秩？矩阵为：

$$
A = 
\begin{pmatrix} 
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 & 9 \end{pmatrix}
$$

‍

**解：** 

1. 通过矩阵的初等行变换得到阶梯形矩阵：

$$
A = 
\begin{pmatrix} 
1 & 2 & 3 \\\\
0 & 1 & 2 \\\\
0 & 0 & 0 \end{pmatrix}
$$

2. 确定矩阵的秩：

    阶梯形矩阵中有2个非零行。所以$R(A)=2R(A)=2$.$ $

### Python将矩阵变换为阶梯形矩阵，并求矩阵的秩

```python
from sympy import Matrix

A = Matrix([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
])

# 计算行阶梯形矩阵并获取秩
rref_matrix, pivots = A.rref()
rank = len(pivots)  # 主元列数即为秩
```

### **知识点：** 

1. 矩阵的秩（书P103）
2. 矩阵的初等变换（书P90）

## 问题四：**如何理解范数的定义及其在不同场景下的应用？**

### **知识点**<span data-type="text" style="font-size: 21px;">：</span>

#### 1. **范数的基本性质**：

非负性、齐次性、三角不等式（适用于向量和矩阵）

#### 2. **向量范数类型**：

* $L^1$范数：（曼哈顿距离）：稀疏性优化（如LASSO回归）

‍

$$
||x||_1=\sum_{i} |x_i|
$$

* $L^2$范数（欧氏距离）：几何长度和正交性（如主成分分析）

$$
||x||_2=(\sum_i x_i^2)^{1/2}\Leftrightarrow \sqrt{\sum_i x_i^2}
$$

* $L^∞$范数（最大值）：误差分析中的最坏情况评估

$$
\sum_i|x_i|^2
$$

#### 3. **矩阵范数**：

* 诱导范数（如谱范数）：反映矩阵的最大奇异值，用于稳定性分析

* Frobenius范数：矩阵元素的平方和开根号，用于低秩近

$$
||A||_F=\sqrt{\sum_{i,j}A^2_{i,j}}
$$

### <span data-type="text" style="font-size: 21px;"> </span>**应用**<span data-type="text" style="font-size: 21px;">：</span>

在机器学习中，$L^1$范数用于特征选择，$L^2$范数用于防止过拟合，Frobenius范数用于矩阵分解（如SVD）.

## 问题五 **：特征向量和特征值如何描述矩阵的线性变换特性？**

### **知识点**<span data-type="text" style="font-size: 21px;">：</span>

1. **定义**：对矩阵AA，若存在非零向量$v$和标量$λ$满足$Av=λv$，则$λ$为特征值，$v$为特征向量
2. **几何意义**：特征向量表示变换后方向不变的轴，特征值表示沿该轴的缩放比例（如旋转矩阵的特征值可能为复数）

1. **物理意义**：在振动分析中，特征值对应系统的固有频率，特征向量为振动模态。**计算**：通过求解$det⁡(A−λI)=0$得到特征值，再解方程组求特征向量

### <span data-type="text" style="font-size: 21px;">Python计算特征值和特征向量：</span>

```python
import numpy as np

# 语法
eigenvalues, eigenvectors = np.linalg.eig(matrix) 
#eigenvalues：一维数组，包含所有特征值（可能是复数）
#eigenvectors：二维数组，每列是对应特征值的特征向量（已归一化为单位长度）
```

## 问题六：如何理解奇异值分解（SVD）以及它和特征值分解的关系

### SVD原理：

**SVD**是一种将任意矩阵分解为三个更简单矩阵相乘的方法。例如，一个复杂的数据表格（矩阵）可以拆解成三个表格的组合：**左特征表**、**核心数值表**和**右特征表**。这三个表格能保留原始数据的核心特征，同时简化计算和存储。公式为：

$$
A=UDV^T
$$

其中：

* **U矩阵**（左奇异矩阵）：由正交单位列向量组成，代表数据在行方向（如用户、文档）的潜在特征。
* D**矩阵**（奇异值矩阵）：对角线上元素为奇异值，按从大到小排列，代表各个潜在特征的重要性强度。
* **V矩阵**（右奇异矩阵）：由正交单位行向量组成，代表数据在列方向（如物品、词语）的潜在特征。

### **Python求****$U、D、V^T$**

```python
U, D, V^T = np.linalg.svd(A)
```

### SVD与特征值分解的比较与关系

#### 1. **适用矩阵类型**

* **特征值分解（EVD）** ：仅适用于**方阵**（$n×n$），且要求矩阵有$n$个线性无关的特征向量

* **奇异值分解（SVD）** ：适用于**任意形状的矩阵**（$m×n$），无论是否为方阵

#### 2. **分解形式**

* **特征值分解**：

  $A = V \Lambda V^{-1}$其中，$V$是特征向量矩阵，$\Lambda$是对角矩阵（元素为特征值）。若$A$是实对称矩阵，则$V$是正交矩阵，此时$A = V \Lambda V^T$
* **奇异值分解**：  
  $A = UDV^T$  
  其中，$U$和$V$是正交矩阵（左、右奇异向量矩阵），$D$是对角矩阵（元素为奇异值）

#### **3. 数学性质**

* **特征值**：

  * 特征值可以是**复数**（如非对称方阵）或实数（对称方阵）
  * 特征向量是矩阵自身空间中的方向，表示线性变换的**缩放比例**
* **奇异值**：

  * 奇异值**始终是非负实数**，是$A^TA$或$AA^T$特征值的平方根
  * 奇异向量（$U$和$V$）分别对应输入空间和输出空间的**正交基**，描述矩阵在不同方向上的伸缩效应

#### **4. 应用场景**

* **特征值分解**：

  * 主成分分析（PCA）的基础，用于数据降维
  * 分析物理系统的稳定性（如振动模态分析。
* **奇异值分解**：

  * 处理非方阵数据，如图像压缩（保留主要奇异值）、推荐系统（矩阵补全）、噪声去除（丢弃小奇异值）
  * 更普适的降维工具（如文本分类中的LSA算法）

#### **5. 核心关系**

* **数学联系**：

  * 若\(A\)是方阵且可进行特征值分解，其**奇异值为特征值的绝对值**
  * SVD可视为对任意矩阵的**广义特征值分解**，通过$A^TA$和$AA^T$间接关联特征值
* **互补性**：

  * 特征值分解关注矩阵本身的**线性变换特性**，而SVD描述矩阵在输入/输出空间中的**正交基变换与伸缩**

## 补充：

本文已涵盖了目前学到的绝大部分知识点，具体的奇异值分解应用实例以及彭罗斯伪逆（The Moore-Penrose Pseudoinverse）、迹（The Trace）的相关知识，请参考[MonitSharma/Numerical-Linear-Algebra: A course on Linear Algebra using Python in Jupyter notebooks](https://github.com/MonitSharma/Numerical-Linear-Algebra?tab=readme-ov-file)

‍
