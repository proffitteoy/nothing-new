---
title: 每日三思（4月27日）
date: '2025-04-27 22:22:26'
categories:
  - 每日总结
tags:
  - 数理统计
  - C++
updated: '2025-04-28 00:49:53'
permalink: /post/think-twice-every-day-april-27-z1xvyvw.html
comments: true
toc: true
---



# 每日三思（4月27日）

今天将算法的第二章以及数理统计课程完成了，数理统计总结以及线性代数的重新归纳计划在劳动节期间写好。

## 问题一：map是什么？基础操作是什么样的？

​`map`​ 是一个标准库容器，它包含一组键值对，其中每个键都是唯一的，并且通过键可以快速访问对应的值。`map`​ 相当于映射，可以将任何基本类型（包括STL容器）映射到任何基本类型（包括STL容器）。以下是基础操作：

```c++
//char 是键的类型，int 是值的类型
map<char, int> map1;                        //有序，不允许重复
multimap<char, int> map2;                   //有序，允许重复
unordered_map<char, int> map3;              //无序，不允许重复  经常使用，时间消耗小
unordered_multimap<char, int> map4;         //无序，允许重复
```

1. 增

```c++
// 使用 insert 插入元素
m.insert({1, "Apple"});
m.insert(std::make_pair(2, "Banana"));

// 使用 [] 操作符插入元素
m[3] = "Cherry";  // 如果键 3 不存在，会自动插入
```

2. 删

```c++
// 根据键删除元素
m.erase(2);

// 根据迭代器删除元素
auto it = m.find(3);
if (it != m.end()) {
    m.erase(it);
}
```

3. 查

```c++
auto it = m.find(2);  // 查找键为 2 的元素
if (it != m.end()) {
    std::cout << "Found: " << it->second << std::endl;  // 输出对应的值
} else {
    std::cout << "Not found" << std::endl;
}
```

4. 改

```c++
m[1] = "Apricot";  // 修改键 1 对应的值
```

## 问题二：普通最小二乘法（OLS）是什么？在Python中的实现

**普通最小二乘法（OLS，Ordinary Least Squares）**  是一种用于线性回归分析的统计方法，它通过最小化实际观测值与回归模型预测值之间的差异的平方和来估计回归系数，从而找到最优的回归模型。

### 1. **OLS 目标：最小化平方误差和（SSE）**

**平方误差和（SSE）**  是 OLS 方法的目标函数，代表了模型预测值与真实观测值之间差异的平方和。具体公式如下：

$$
SSE = \sum_{i=1}^{n} (y_i - \hat{y_i})^2
$$

其中：$y_i$ 是观测值（真实值）；$\hat{y_i}$ 是模型的预测值（通过回归方程计算出来的值）。

我们的目标是找到回归系数，使得 SSE 最小化，从而使得预测值与实际观测值之间的误差尽可能小。

### 2. **OLS 解决方案的推导：**

对于多元线性回归问题，假设我们有 $n$ 个观测点和 $p$ 个特征（自变量）。模型可以表示为：

$$
y = X\beta + \epsilon
$$

其中：$y$ 是 $n \times 1$ 的因变量向量；$X$ 是 $n \times p$ 的设计矩阵（包含所有自变量的观测值）；$\beta$ 是 $p \times 1$ 的回归系数向量，我们要估计的未知数；$\epsilon$ 是误差项。

我们希望最小化 SSE，公式如下：

$$
SSE = (y - X\beta)^T (y - X\beta)
$$

为了求解 $\beta$，我们对 $SSE$ 进行最小化（即对 $\beta$ 求导并令其为零）：

$$
\frac{\partial SSE}{\partial \beta} = -2X^T(y - X\beta)
$$

将其设为零，得到：

$$
X^T y = X^T X \beta
$$

解这个方程，我们得到回归系数的最优估计：

$$
\hat{\beta} = (X^T X)^{-1} X^T y
$$

### 3. **摩尔-彭若斯伪逆**

在实际应用中，如果设计矩阵 $X^T X$ 不可逆，或者方程的数量多于未知数（即矩阵 $X$ 的列数多于行数），即：**奇异矩阵** 和 **非方阵，** 我们通常使用 **摩尔-彭若斯伪逆** 来进行估计。

摩尔-彭若斯伪逆（$X^+$）的计算公式为：

$$
\hat{\beta} = X^+ y
$$

其中 $X^+$ 是矩阵 $X$ 的伪逆。

### 4. **偏导数微积分**

在 OLS 的推导过程中，使用偏导数微积分对误差平方和（SSE）进行最小化是标准做法。这是因为我们通过对 $SSE$ 进行求导，找到使其最小化的回归系数，从而得到最优解。

### Python实现举例：

```python
import numpy as np
import statsmodels.api as sm

# 数据准备
X = np.array([1, 2, 3, 4, 5])  # 自变量
y = np.array([1, 2, 1.3, 3.75, 2.25])  # 因变量

# 添加常数项（截距）
X = sm.add_constant(X)  # 添加常数项

# 构建回归模型
model = sm.OLS(y, X)  # 使用 OLS 方法构建回归模型

# 拟合回归模型
results = model.fit()  # 拟合模型并计算回归系数

# 查看回归结果
print(results.summary())  # 输出回归分析结果
```

‍
