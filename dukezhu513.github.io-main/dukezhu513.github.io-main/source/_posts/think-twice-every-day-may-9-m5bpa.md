---
title: 每日三思（5月9日）
date: '2025-05-09 23:17:49'
categories:
  - 每日总结
tags:
  - C++
updated: '2025-05-10 13:12:31'
permalink: /post/think-twice-every-day-may-9-m5bpa.html
comments: true
toc: true
---



# 每日三思（5月9日）

## 问题一：昨天学了什么？

昨天将算法第三章的排序与查找全部都完成了，并且对算法比赛的赛题有了大致的了解，重点总结了固定的英文术语。

## 问题二：分别总结一下三种查找方法的特点

1. <span data-type="text" style="font-size: 19px;">二分查找</span>

二分查找只能在有序的数据结构中使用。它的空间利用率高，适合静态数据，在动态插入中删除效率低。

**时间复杂度** ：

* 查找：O(log n)
* 插入/删除：O(n)（因为要保持有序）

2. ​`Map`​​<span data-type="text" style="font-size: 19px;"> 查找</span>

​`Map`​的底层原理是红黑树，把所有需要查找的数据放入`map`​中，会按key的大小进行自动升序排序，但存在需要消耗额外的空间的问题。

**时间复杂度** ：

* 查找、插入、删除：O(log n)

3. ​`unordered_map`​​ <span data-type="text" style="font-size: 19px;">查找</span>

​`unordered_map`​的底层原理是哈希表，无序，适合用于只关心查找速度，不需要顺序的场景。

**时间复杂度** ：

* 平均 O(1)，最坏 O(n)

## 问题三：举个栗子🌰

### 题目：

给定一个长度为 `n`​ 的整型数组 `nums`​，请找出其中那个**出现次数超过数组长度一半的元素**。

* 假设数组非空，并且一定存在这个数。
* 要求时间复杂度尽可能低。

#### 示例：

```cpp
输入: [1,2,3,2,2,2,5,4,2]
输出: 2
```

<span data-type="text" style="font-size: 19px;">一、使用 </span>`map`​​<span data-type="text" style="font-size: 19px;"> 统计</span>

```cpp
int majorityElement(vector<int>& nums) {
    map<int, int> freq;
    for (int num : nums) {
        ++freq[num];
        if (freq[num] > nums.size() / 2)
            return num;
    }
    return -1; // 不会执行到这里
}
```

特点：有序结构，适合调试时查看顺序，时间复杂度：O(n log n)

<span data-type="text" style="font-size: 19px;">二、使用 </span>`unordered_map`​​<span data-type="text" style="font-size: 19px;"> 统计频率（推荐）</span>

```cpp
int majorityElement(vector<int>& nums) {
    unordered_map<int, int> freq;
    for (int num : nums) {
        ++freq[num];
        if (freq[num] > nums.size() / 2)
            return num;
    }
    return -1;
}
```

特点：查找、插入平均 O(1)，效率更高不需要排序，适用于大数据量场景

<span data-type="text" style="font-size: 19px;">三、先排序，再取中间值（使用 </span>`vector + sort + 中间位置判断`​​<span data-type="text" style="font-size: 19px;">）</span>

```cpp
int majorityElement(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    return nums[nums.size() / 2];
}
```

特点：不使用哈希表，节省内存；时间复杂度：O(n log n)；空间复杂度：O(1)（如果允许修改原数组）
