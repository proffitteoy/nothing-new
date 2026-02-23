---
title: 第八章：树形数据结构（下）
date: '2025-10-09 20:01:30'
categories:
  - 算法学习
tags:
  - C++
updated: '2025-10-10 22:22:31'
permalink: /post/chapter-8-tree-data-structure-part-2-1xrsjf.html
comments: true
toc: true
---



# 第八章：树形数据结构（下）

# 一、二叉搜索树

二叉搜索树是一种特殊的二叉树，它同时满足以下两个条件：

1. 它是一棵二叉树（每个节点最多有两个子节点）；
2. 对于树中任意一个节点，其左子树中所有节点的值都严格小于该节点的值，右子树中所有节点的值都严格大于该节点的值。

## 1. 核心性质

对二叉搜索树进行中序遍历（即按“访问左子树 → 访问根节点 → 访问右子树”的顺序递归遍历），所得到的节点值序列是一个严格递增的有序序列。这一性质是 BST 能高效支持查找、排序等操作的理论基础。

## 2. 插入操作与示例

给定插入序列：7, 6, 11, 5, 9, 12（按顺序依次插入到初始为空的 BST 中）

插入过程如下：

1. 插入 7：树为空，7 成为根节点；
2. 插入 6：6 < 7，作为 7 的左孩子；
3. 插入 11：11 > 7，作为 7 的右孩子；
4. 插入 5：5 < 7 → 向左；5 < 6 → 作为 6 的左孩子；
5. 插入 9：9 > 7 → 向右；9 < 11 → 作为 11 的左孩子；
6. 插入 12：12 > 7 → 向右；12 > 11 → 作为 11 的右孩子。

最终树形结构：

```
        7
       / \
      6   11
     /   /  \
    5   9    12
```

## 3. 插入算法实现方式

有两种常用实现方式：

### **方法一：递归插入**

- 逻辑简洁，直接体现 BST 定义；
- 函数返回插入后子树的根指针；
- 缺点：深度过大时可能栈溢出（但本题 N ≤ 100，安全）。

### **方法二：循环插入（双指针法）**

使用两个指针：

- ​`pCur`：当前正在访问的节点，用于比较和移动；
- ​`pPre`​：`pCur` 的父节点，用于记录待插入位置的父节点。

从根开始，循环比较待插入值与 `pCur->data`：

- 若小于，`pPre = pCur`​，`pCur = pCur->left`​；若大于，`pPre = pCur`​，`pCur = pCur->right`；

- 当 `pCur`​ 为 `nullptr`​ 时，说明已找到插入位置，将新节点作为 `pPre` 的左或右孩子；
- 此时 `pPre` 即为新节点的父亲，可直接输出其值。

该方法避免了递归开销，且能自然获取父节点信息。

# 例题：**判断两序列是否为同一二叉搜索树序列**

给定一个参考序列，可构造一棵二叉搜索树。随后给出 n 个待判断序列，对每个序列判断其构造的二叉搜索树是否与参考序列构造的树完全相同。

## 解题思路

两个序列构造出相同的二叉搜索树，当且仅当它们的插入过程最终形成的树结构一致。  
一种高效方法是：对每个序列，按顺序插入构建 BST，然后获取其前序遍历序列（或结构化表示）。由于 BST 的中序遍历固定为升序，因此前序遍历唯一确定 BST 的结构。  
只需比较参考树与待测树的前序遍历结果是否相同即可。

## 完整代码

```cpp
#include <cstdio>
#include <vector>
#include <cstring>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* insert(TreeNode* root, int x) {
    if (!root) return new TreeNode(x);
    if (x < root->val)
        root->left = insert(root->left, x);
    else
        root->right = insert(root->right, x);
    return root;
}

void preorder(TreeNode* root, vector<int>& res) {
    if (!root) return;
    res.push_back(root->val);
    preorder(root->left, res);
    preorder(root->right, res);
}

int main() {
    int n;
    while (scanf("%d", &n) == 1 && n != 0) {
        char ref[15];
        scanf("%s", ref);
        
        // 构建参考树并获取前序
        TreeNode* refTree = nullptr;
        for (int i = 0; ref[i]; ++i)
            refTree = insert(refTree, ref[i] - '0');
        vector<int> refPre;
        preorder(refTree, refPre);

        // 处理 n 个测试序列
        for (int i = 0; i < n; ++i) {
            char seq[15];
            scanf("%s", seq);
            TreeNode* testTree = nullptr;
            for (int j = 0; seq[j]; ++j)
                testTree = insert(testTree, seq[j] - '0');
            vector<int> testPre;
            preorder(testTree, testPre);

            if (testPre == refPre)
                printf("YES\n");
            else
                printf("NO\n");
        }
    }
    return 0;
}
```

# 二、**C++ 中的优先队列**

优先队列是一种特殊的队列，它不遵循普通队列“先进先出”（FIFO）的原则，而是根据元素的优先级决定谁先出队。在 C++ 中，默认的 `priority_queue` 是一个最大堆（大根堆），即每次出队的是当前队列中值最大的元素。

> 举例：插入序列 3, 1, 4, 2，出队顺序为：4 → 3 → 2 → 1

## 1. 优先队列的本质 —— 堆（Heap）

从数据结构角度看，优先队列的底层实现是堆，而堆是一棵完全二叉树，并满足堆序性质：

大根堆：每个节点的值 ≥ 其左右子节点的值（根节点最大）；小根堆：每个节点的值 ≤ 其左右子节点的值（根节点最小）

```
       根
      /   \
     左     右
    / \     / \
   ... ... ... ...
```

从形状上来看是完全二叉树（从上到下、从左到右填满），同时，数值上满足堆序：大根堆 ⇒ 根 > 左，根 > 右；小根堆 ⇒ 根 < 左，根 < 右。

## 2. 存储方式：数组顺序存储

虽然逻辑上是树形结构，但实际物理存储采用数组，利用完全二叉树的下标规律：

设父节点下标为 `i`（从 0 开始）：

- 左子节点下标 = `2*i + 1`
- 右子节点下标 = `2*i + 2`
- 父节点下标 = `(i - 1) / 2`

优点：无需指针，节省空间，访问高效。

## 3. C++ 标准库中的 `priority_queue`

头文件：`#include <queue>`

基本定义：

```cpp
std::priority_queue<Type>
```

其中 `Type`​ 必须支持 `<`​ 运算符（用于比较大小），例如 `int`​, `double`​, 或自定义类型（需重载 `<`）。

默认行为：最大堆（大根堆）

常用接口：

|成员函数|功能说明|
| ----------| -------------------------------------|
|​`push(x)`|插入元素 x 到队列中，自动调整堆结构|
|​`pop()`|删除队首元素（即最大值）|
|​`top()`|获取队首元素（最大值），不删除|
|​`empty()`|判断队列是否为空|
|​`size()`|返回当前队列中元素个数|

# 例题：**复数集合的优先队列操作**

维护一个复数集合，支持两种操作：`Pop`​：若集合非空，输出模值最大的复数（格式 `a+ib`​），并将其删除，然后输出当前集合大小 `SIZE = x`​；若为空，输出 `empty`​。​​`Insert a+ib`​：将复数 `a+ib`​ 加入集合，并输出当前集合大小 `SIZE = x`。

**特殊规则**

- 复数模值用平方 \(a<sup>2 + b</sup>2\) 比较，避免浮点运算。
- 若模值相等，选择虚部 \(b\) 较小的复数优先输出。
- 输入中 \(a, b\) 均为非负整数。

## 解题思路

C++ 的 `priority_queue`​ 默认实现为最大堆，堆顶元素是“最大”的。对于自定义类型（如复数），必须通过重载 `<`​ 运算符来定义“大小”关系。本题的关键在于理解 `priority_queue`​ 的比较逻辑：它认为，如果表达式 `A < B`​ 为真，则 `B`​ 比 `A`​ “大”，因此 `B`​ 应该排在堆顶。换言之，`operator<`​ 的作用是定义“在什么情况下左边的元素小于右边的元素”，而 `priority_queue` 会据此将“更大”的元素（即优先级更高的元素）置于顶部。

本题的优先级规则是：模值平方大的优先；模值平方相同时，虚部 \(b\) 小的优先。因此，在重载 `operator<`​ 时，应使优先级低的复数被视为“更小”。具体而言，对于两个复数 `lhs`​ 和 `rhs`​，当满足以下任一条件时，`lhs < rhs`​ 应返回 `true`：

1. ​`lhs`​ 的模值平方小于 `rhs` 的模值平方；
2. 两者模值平方相等，但 `lhs`​ 的虚部大于 `rhs` 的虚部。

这样，`priority_queue` 就能正确地将优先级最高的复数放在堆顶。

## **完整代码**

```cpp
#include <cstdio>
#include <queue>
#include <cstring>
using namespace std;

struct Complex {
    int re, im;
    Complex(int r, int i) : re(r), im(i) {}
};

bool operator<(const Complex& lhs, const Complex& rhs) {
    long long modL = 1LL * lhs.re * lhs.re + 1LL * lhs.im * lhs.im;
    long long modR = 1LL * rhs.re * rhs.re + 1LL * rhs.im * rhs.im;
    if (modL != modR) 
        return modL < modR;   // 模值小的“更小”
    return lhs.im > rhs.im;   // 模值相等时，虚部大的“更小”
}

int main() {
    int n;
    while (scanf("%d", &n) == 1) {
        priority_queue<Complex> pq;
        char cmd[20];
        for (int i = 0; i < n; ++i) {
            scanf("%s", cmd);
            if (strcmp(cmd, "Pop") == 0) {
                if (pq.empty()) {
                    printf("empty\n");
                } else {
                    Complex top = pq.top();
                    pq.pop();
                    printf("%d+i%d\n", top.re, top.im);
                    printf("SIZE = %zu\n", pq.size());
                }
            } else {
                int a, b;
                scanf("%d+i%d", &a, &b);
                pq.push(Complex(a, b));
                printf("SIZE = %zu\n", pq.size());
            }
        }
    }
    return 0;
}
```
