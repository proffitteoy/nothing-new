---
title: 第七章：树形数据结构（上）
date: '2025-09-10 17:23:18'
categories:
  - 算法学习
tags:
  - C++
updated: '2025-09-11 00:40:57'
permalink: /post/chapter-7-tree-data-structure-part-1-1ldk3f.html
comments: true
toc: true
---



# 第七章：树形数据结构（上）

## 一. C++ 内存模型与 `new` 运算符

C++ 中对象分为：

- **栈区**：局部变量，自动释放
- **堆区**：用 `new` 动态分配，需手动 `delete`​

​`TreeNode* root = new TreeNode(1);` → 在堆中创建节点

必须理解指针与对象生命周期的关系

```cpp
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
```

## 二. 完全二叉树的顺序存储

从上往下，从左往右，填入数组（顺序存储）

![](http://127.0.0.1:50675/assets/network-asset-20200920221638903-20250902001329-jasljjo.png)

仅适用于 **完全二叉树**

使用数组存储，下标关系如下：

若父节点下标为 `i`，则：

- 左子：`2*i + 1`​
- 右子：`2*i + 2`​
- 父亲：`(i-1)/2`​

优点：节省空间，无需指针；缺点：非完全树浪费空间

**优先级队列其实是一个堆，堆就是一棵完全二叉树，同时保证父子节点的顺序关系**

## 三. 树的链式存储与层序建树

### 链式存储结构：

```cpp
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
```

### 层序建树（按层次输入）

输入格式：如 `1 2 3 4 # 5 # # # #`（`#` 表示空节点）

使用队列模拟逐层构建

```cpp
TreeNode* buildTree(vector<string>& nodes) {
    if (nodes.empty() || nodes[0] == "#") return nullptr;
    
    TreeNode* root = new TreeNode(stoi(nodes[0]));
    queue<TreeNode*> q;
    q.push(root);
    
    int i = 1;
    while (!q.empty() && i < nodes.size()) {
        TreeNode* node = q.front(); q.pop();
        
        if (i < nodes.size() && nodes[i] != "#") {
            node->left = new TreeNode(stoi(nodes[i]));
            q.push(node->left);
        }
        i++;
        
        if (i < nodes.size() && nodes[i] != "#") {
            node->right = new TreeNode(stoi(nodes[i]));
            q.push(node->right);
        }
        i++;
    }
    return root;
}
```

## 四. 树的遍历

|类型|访问顺序|实现方式|
| ------| --------------------| -------------|
|前序|根 → 左 → 右|递归 / 栈|
|中序|左 → 根 → 右|递归 / 栈|
|后序|左 → 右 → 根|递归 / 栈|
|层序|从上到下，从左到右|队列（BFS）|

### 前序遍历：

```cpp
void preorderTraversal(TreeNode* root, vector<char>& res) {
    if (!root) return;
    res.push_back(root->val);         // 根
    preorderTraversal(root->left, res);  // 左
    preorderTraversal(root->right, res); // 右
}

// 封装接口
vector<char> preorder(TreeNode* root) {
    vector<char> res;
    preorderTraversal(root, res);
    return res;
}
```

### 中序遍历：

```cpp
void inorderTraversal(TreeNode* root, vector<char>& res) {
    if (!root) return;
    inorderTraversal(root->left, res);  // 左
    res.push_back(root->val);           // 根
    inorderTraversal(root->right, res); // 右
}

vector<char> inorder(TreeNode* root) {
    vector<char> res;
    inorderTraversal(root, res);
    return res;
}
```

### 后序遍历：

```cpp
void postorderTraversal(TreeNode* root, vector<char>& res) {
    if (!root) return;
    postorderTraversal(root->left, res);  // 左
    postorderTraversal(root->right, res); // 右
    res.push_back(root->val);             // 根
}

vector<char> postorder(TreeNode* root) {
    vector<char> res;
    postorderTraversal(root, res);
    return res;
}
```

### 层序遍历（BFS）：

```cpp
vector<vector<char>> levelOrder(TreeNode* root) {
    vector<vector<char>> res;
    if (!root) return res;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();
        vector<char> level;
        for (int i = 0; i < size; ++i) {
            TreeNode* node = q.front(); q.pop();
            level.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        res.push_back(level);
    }
    return res;
}
```

## 五. 二叉树中两个节点之间的最短路径长度

### 题目分析：

**给定信息：一棵由** **​`n`​**​ **个结点构成的二叉树（编号 1~n），根为 1 号点。每条边长度为 1。输入方式是：每行给出一个节点的子节点编号（若无子节点则为**  **​`-1`​**​ **）。进行** **​`m`​**​ **次查询，每次询问两个节点之间的最短路径长度。**

即：

对于每个查询 `(u, v)`，输出从 `u` 到 `v` 的最短路径长度。

### 解题思路：

在树结构中，任意两点间的最短路径是唯一的，且经过它们的 **最近公共祖先（LCA）** 。其中的路径长度公式为：

```
dist(u, v) = depth[u] + depth[v] - 2 * depth[LCA(u, v)]
```

所以我们需要解决四个问题：

1. ​**建树**：读入每个节点的孩子，同时设置“父亲指针”
2. ​**查路径**：对每次查询，从两个节点分别“往上走”，走到根，记录路径
3. ​**找祖先**：从根往回比，找到最后一个相同的节点 → 这就是“最近公共祖先（LCA）”
4. ​**算距离**：两个节点分别到 LCA 的步数相加 → 就是它们之间的最短路径长度

### 完整代码：

```cpp
#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <vector>
using namespace std;

struct TreeNode {
    int num;
    TreeNode* left;
    TreeNode* right;
    TreeNode* parent;
};

int main() {
    int t;
    scanf("%d", &t);
    for (int i = 0; i < t; ++i) {
        int n, m;

        //读入 n, m，初始化节点数组
        scanf("%d%d", &n, &m);

        vector<TreeNode*> nodeArr(n + 1);
        for (int j = 1; j <= n; ++j) {
            nodeArr[j] = new TreeNode;
            nodeArr[j]->num = j;
            nodeArr[j]->left = NULL;
            nodeArr[j]->right = NULL;
            nodeArr[j]->parent = NULL; // 初始化
        }

        nodeArr[1]->parent = NULL;

        //构建树的父子关系
        for (int j = 1; j <= n; ++j) {
            int left, right;
            scanf("%d%d", &left, &right);
            if (left != -1) {
                nodeArr[j]->left = nodeArr[left];
                nodeArr[left]->parent = nodeArr[j];
            }
            if (right != -1) {
                nodeArr[j]->right = nodeArr[right];
                nodeArr[right]->parent = nodeArr[j];
            }
        }

        //处理每个查询
        for (int j = 0; j < m; ++j) {
            int lhs, rhs;
            scanf("%d%d", &lhs, &rhs);

            //Step 1：从 lhs 往上走到根，记录路径
            vector<int> lvec;
            TreeNode* p = nodeArr[lhs];
            while (p != NULL) {
                lvec.push_back(p->num);
                p = p->parent;
            }

            //Step 2：从 rhs 往上走到根，记录路径
            vector<int> rvec;
            p = nodeArr[rhs];
            while (p != NULL) {
                rvec.push_back(p->num);
                p = p->parent;
            }

            //Step 3：从根开始（路径尾部）往前找“最后一个共同祖先”
            int l = lvec.size() - 1;
            int r = rvec.size() - 1;

            while (l >= 0 && r >= 0 && lvec[l] == rvec[r]) {
                --l;
                --r;
            }

            printf("%d\n", l + r + 2);
        }
    }
    return 0;
}
```

## 六. 二叉树的遍历进阶

**题目：根据一个 前序遍历字符串（用**  **​`#`​** ​ **表示空节点），重建二叉树，然后输出它的 中序遍历结果。**

### 示例解析

输入：

```
abc##de#g##f###
```

我们一步步还原这棵树：

前序遍历：`a b c # # d e # g # # f # # #`​

建树过程（递归）：

1. ​`a` 是根
2. 左子树：`b c # #` → `b` 有左孩子 `c`，`c` 无左右孩子
3. 右子树：`d e # g # # f # # #` → 复杂一点，但可以递归处理

最终树结构：

```
      a
     / \
    b   d
   /   / \
  c   e   f
     /
    g
```

中序遍历：`c b a g e d f`​

输出：`c b a g e d f `（每个字符后都有空格）

### 解题思路：

1. 使用 **递归方法** 从字符串构建二叉树
2. 用一个全局索引 `i`（或引用）跟踪当前读到的位置
3. 遇到 `#` 返回 `NULL`​
4. 否则创建节点，递归构建左右子树
5. 最后对树进行中序遍历，输出结果

### 完整代码

```cpp
#include <iostream>
#include <cstring>
using namespace std;

struct TreeNode {
    char data;
    TreeNode* left;
    TreeNode* right;
    TreeNode(char x) : data(x), left(nullptr), right(nullptr) {}
};

// 递归建树函数
TreeNode* buildTree(int& i, const char* str) {
    if (str[i] == '#') {
        ++i;
        return nullptr;
    }
    TreeNode* node = new TreeNode(str[i]);
    ++i;
    node->left = buildTree(i, str);
    node->right = buildTree(i, str);
    return node;
}

// 中序遍历输出（左 → 根 → 右）
void inorder(TreeNode* root) {
    if (!root) return;
    inorder(root->left);
    cout << root->data << " ";
    inorder(root->right);
}

int main() {
    char str[101];
    while (cin >> str) {
        int i = 0;
        TreeNode* root = buildTree(i, str);
        inorder(root);
        cout << endl;
    }
    return 0;
}
```

## 七. 重建二叉树

题目：给定一棵二叉树的 **前序遍历** 和 **中序遍历** 字符串，重建这棵树，然后输出它的 **后序遍历**。

输入：

多组测试数据，每组两行：

第一行：前序遍历（如 `ABC`）

第二行：中序遍历（如 `BAC`）

输出：

每组输出一行：后序遍历结果（如 `BCA`）

### 示例：

```
输入：
ABC
BAC

输出：
BCA
```

前序：`A B C` → 根是 A，然后左子树、右子树

中序：`B A C` → 左子树是 B，根是 A，右子树是 C

所以树结构是：

```
    A
   / \
  B   C
```

后序遍历：`B C A` → 输出 `BCA`​

### 解题思路：

**利用前序找根，中序分左右，递归建树，最后后序输出。**

```cpp
#include <stdio.h>
#include <string>
using namespace std;

struct TreeNode {
    char data;
    TreeNode* left;
    TreeNode* right;
    // 构造函数（可选）
    TreeNode() : data(0), left(nullptr), right(nullptr) {}
};

//重建二叉树
TreeNode* Rebuild(string preOrder, string inOrder) {
    if (preOrder.size() == 0) {
        return nullptr;  // 或 NULL
    }

    char rootData = preOrder[0];  // 根节点是先序的第一个字符
    TreeNode* pNew = new TreeNode;
    pNew->data = rootData;

    // 在中序中找到根的位置
    size_t pos = inOrder.find(rootData);
    if (pos == string::npos) {
        // 安全检查：没找到根（理论上不会发生）
        delete pNew;
        return nullptr;
    }

    // 分割中序：左子树 inOrder.substr(0, pos)，右子树 inOrder.substr(pos+1)
    // 分割先序：跳过第一个（根），前 pos 个是左子树，剩下是右子树
    string leftIn = inOrder.substr(0, pos);
    string rightIn = inOrder.substr(pos + 1);

    string leftPre = preOrder.substr(1, pos);           // 左子树长度 = pos
    string rightPre = preOrder.substr(pos + 1);         // 剩下的部分

    // 递归构建左右子树
    pNew->left = Rebuild(leftPre, leftIn);
    pNew->right = Rebuild(rightPre, rightIn);

    return pNew;
}

//后序遍历函数
void PostOrder(TreeNode* proot) {
    if (proot == nullptr) {
        return;
    }
    PostOrder(proot->left);
    PostOrder(proot->right);
    printf("%c", proot->data);
}

int main() {
    char preStr[30];
    char inStr[30];

    while (scanf("%s %s", preStr, inStr) != EOF) {
        string preOrder(preStr);
        string inOrder(inStr);

        TreeNode* proot = Rebuild(preOrder, inOrder);
        PostOrder(proot);
        printf("\n");
    }

    return 0;
}
```

## 八. 总结：

|模块|核心内容|关键词|
| -------------| ---------------------------------------| ------------------------|
|1. 内存模型|栈 vs 堆，`new` 与指针管理|​`new`, `delete`, 指针生命周期|
|2. 存储方式|顺序存储（完全二叉树）、链式存储|数组下标公式、父子指针|
|3. 层序建树|按层次输入，队列构建|​`#` 表示空，队列模拟|
|4. 四种遍历|前/中/后序（递归+迭代）、层序（BFS）|DFS vs BFS，栈 vs 队列|
|5. 最短路径|两节点距离 = 深度和 - 2×LCA深度|LCA、向上跳、路径记录|
|6. 串建树|前序字符串 + `#` → 重建树 → 中序输出|递归建树、引用索引 `i`​|
|7. 双序重建|前序 + 中序 → 重建树 → 后序输出|分治、递归、`substr`​|

### 1. 树的本质是递归结构

几乎所有树操作（遍历、建树、求深度、找LCA）都可以用 **递归** 解决，递归的三要素是：终止条件、当前处理、递归调用。

### 2. 前序 = 根 + 左 + 右；中序 = 左 + 根 + 右；后序 = 左 + 右 + 根

### 3. 路径问题 → 找 LCA

树中任意两点路径唯一，必过 LCA，我们先计算距离：`dist(u,v) = depth[u] + depth[v] - 2 * depth[LCA]`，随后记录路径，再从根回溯找分叉点

### 4. 字符串建树 → 用引用索引 `i`​

- ​`int& i` 保证递归共享位置，顺序读取不重不漏

## 九. 代码模板

### 1. 树节点定义（通用）

```cpp
struct TreeNode {
    int val; // 或 char data
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
```

### 2. 层序建树（输入含 `#`）

```cpp
TreeNode* buildTree(vector<string>& nodes) {
    if (nodes[0] == "#") return nullptr;
    TreeNode* root = new TreeNode(stoi(nodes[0]));
    queue<TreeNode*> q; q.push(root);
    int i = 1;
    while (!q.empty() && i < nodes.size()) {
        TreeNode* cur = q.front(); q.pop();
        if (i < nodes.size() && nodes[i] != "#") {
            cur->left = new TreeNode(stoi(nodes[i])); q.push(cur->left);
        }
        i++;
        if (i < nodes.size() && nodes[i] != "#") {
            cur->right = new TreeNode(stoi(nodes[i])); q.push(cur->right);
        }
        i++;
    }
    return root;
}
```

### 3. 两节点最短路径（LCA路径法）

```cpp
int dist(TreeNode* u, TreeNode* v) {
    vector<int> pathU, pathV;
    while (u) { pathU.push_back(u->num); u = u->parent; }
    while (v) { pathV.push_back(v->num); v = v->parent; }
    int i = pathU.size()-1, j = pathV.size()-1;
    while (i>=0 && j>=0 && pathU[i]==pathV[j]) { i--; j--; }
    return i + j + 2;
}
```

### 4. 前序串建树（含 `#`）

```cpp
TreeNode* build(int& i, string& s) {
    if (s[i]=='#') { ++i; return nullptr; }
    TreeNode* n = new TreeNode(s[i++]);
    n->left = build(i, s);
    n->right = build(i, s);
    return n;
}
```

### 5. 前序+中序重建树

```cpp
TreeNode* rebuild(string pre, string in) {
    if (pre.empty()) return nullptr;
    char rootVal = pre[0];
    int pos = in.find(rootVal);
    TreeNode* root = new TreeNode(rootVal);
    root->left = rebuild(pre.substr(1, pos), in.substr(0, pos));
    root->right = rebuild(pre.substr(pos+1), in.substr(pos+1));
    return root;
}
```
