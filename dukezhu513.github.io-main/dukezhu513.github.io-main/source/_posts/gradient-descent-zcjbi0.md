---
title: Gradient Descent(梯度下降)
date: '2025-05-23 20:44:54'
categories:
  - 学习笔记
tags:
  - 机器学习  
updated: '2025-05-23 23:47:44'
permalink: /post/gradient-descent-zcjbi0.html
comments: true
toc: true
---



# Gradient Descent

Gradient Descent is not a machine learning algorithm itself, but rather an optimization algorithm and search strategy. In machine learning, we often need to find an "optimal solution"—for example, making model predictions more accurate or minimizing errors. At times like these, **Gradient Descent** acts like a diligent hiker, step by step searching for the fastest path downhill.

I will now introduce the three core elements of gradient descent: the initial point, the gradient, and the learning rate.

# I. Initial Point

Imagine you're standing on top of a mountain in thick fog—you can't see clearly and have to feel your way down step by step. Where do you take your first step from? That's the **initial point**.

> **The initial point is where the search begins.**

In machine learning, the initial point is typically a randomly chosen set of parameter values. However, different starting points may lead you to different "valleys" (i.e., local optima), especially in complex landscapes (non-convex functions). To avoid getting stuck in suboptimal solutions, people often run the algorithm multiple times with different random initializations and compare the results. Therefore, the initial point is an important hyperparameter in gradient descent.

# II. Gradient — Which Direction is the Steepest?

Now imagine you're standing on a mountain and want to get down as quickly as possible. What would you do? Naturally, you'd look around and take a step in the steepest direction downhill.

> **The gradient tells you the direction in which the function increases the fastest — so we move in the opposite direction (negative gradient).**

At its core, the gradient is a vector made up of all the **partial derivatives** of a function. It indicates the direction in which the function value changes most rapidly near a given point.

Suppose you have a function:

$$
f(x_1, x_2, \cdots, x_n)
$$

This function has $n$ variables. Its **gradient** is written as:

$$
\nabla f = \left( \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, \cdots, \frac{\partial f}{\partial x_n} \right)
$$

In machine learning, we often aim to **minimize a loss function** $J(\theta)$, where $\theta = (\theta_1, \theta_2, \cdots, \theta_n)$ represents the model parameters.

- We compute the gradient $\nabla J(\theta)$, which gives us the direction of steepest ascent.
- Then, we update the parameters in the **opposite (negative) direction** of the gradient:

$$
\theta := \theta - \eta \cdot \nabla J(\theta)
$$

Where:

- $\eta$ is the **learning rate**
- $:=$ denotes an update operation (the new value replaces the old one)

In machine learning, the gradient reflects how sensitive the loss function is to changes in the model parameters.

# III. Learning Rate

Now that we know which direction to go (the negative gradient direction), the next question is: **how far should we take each step?**  This is determined by the **learning rate**.

> **The learning rate determines the size of each step you take during parameter updates.**

If the learning rate is too large, it's like taking giant leaps — you might overshoot the valley or even jump back uphill (divergence), failing to converge. On the other hand, if the learning rate is too small, it's like walking very cautiously — you won't make mistakes, but progress will be painfully slow. So, just like choosing the right stride length when hiking downhill, the learning rate must be chosen carefully.

### In practice:

- A common advanced technique is to gradually reduce the learning rate over time — this is known as **learning rate decay**.
- Alternatively, adaptive optimization methods such as **Adam** and **RMSProp** can automatically adjust the learning rate based on training dynamics.

---

# IV. Additional Knowledge: Types of Gradient Descent

In addition to the three core elements, another important factor is: **how much data do we use at each step?**

Think of it like this: when going downhill, are you looking at the whole mountain view (Batch GD), only one point (Stochastic GD), or a small patch of terrain (Mini-batch GD)?

|Name|Description|Pros and Cons|
| ------| ----------------------------------------------------| --------------------------------------------------|
|**Batch Gradient Descent (BGD)**|Uses the full dataset to compute the gradient|Stable but slow|
|**Stochastic Gradient Descent (SGD)**|Updates parameters using only one sample at a time|Fast but noisy|
|**Mini-batch Gradient Descent**|Uses a small batch of data|Balances speed and stability; most commonly used|

# Stopping Criteria

You can’t keep descending forever — there needs to be a stopping point:

1. When the gradient is close to zero (the surface is nearly flat)
2. When a maximum number of iterations has been reached
3. When the change in the loss function becomes very small
