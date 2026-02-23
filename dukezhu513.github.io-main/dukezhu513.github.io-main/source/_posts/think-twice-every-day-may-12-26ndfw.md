---
title: 每日三思（5月12日）
date: '2025-05-13 07:31:18'
categories:
  - 每日总结
tags:
  - C++
  - 机器学习  
updated: '2025-05-13 07:52:50'
permalink: /post/think-twice-every-day-may-12-26ndfw.html
comments: true
toc: true
---



# 每日三思（5月12日）

# 问题一：今天学了什么内容？

今天学习了C++中的string，还有机器学习中神经网络的激活函数以及正向传播和反向传播。

# 问题二：`string`​ 是什么？怎么用？

​`string`​ 是标准库中用于表示和操作字符串 （即字符序列）的一个类，用于替代传统的 C 风格字符串（以` char[]`​ 或 `char*`​ 表示的字符串），具有更高的安全性、易用性和功能性。

具体用法结合示例如下所示：

```c++
#define _CRT_SECURE_NO_WARNINGS
#include<string>
#include<iostream>
using namespace std;
int main() {
	string str1 = "Hello,";
	string str2 = "World!";
	string str3;
	str3 = "hello,";//string支持= 赋值
	str3 = str2;
	//string支持 == 判断内容是否相同
	bool isSame = false;
	isSame = (str3 == str2);
	//string支持 + 连接
	str3 = str1 + str2;
	//string支持 用 < <= > >=比较大小
	bool isLarger = false;
	isLarger = (str1 > str2);

	//string非常像 vector<char>
    string str4 = "abcdef";
	char ch;
	ch = str4[0];
	ch = str4[1];
	str4.push_back('g'); //列表末尾增加g
	str4.pop_back() //删除最后一个

		string::iterator it;  //迭代器
	for (it = str4.begin();it != str4.end; ++it) {
		printf("*it = %c\n", *it);
	}

	it = str4.begin();
	str4.insert(it, 'A');//插入A
	it = str4.begin();
	str4.erase(it);//删除第一个（A）

	//string 对比vector 拓展了insert 和earse 的用法
	//string 使用整数下标， 插入删除多个字符
	str4.insrt(0, "xyz");//整数下标，字符串常量、
	str4.erase(0, 3);//；两个整数下标的删除范围[0,3)

	//string获取子串
	string str5;
	str5 = str4.substr(0, 3)

	//string字符串匹配
		string str6 = "howdoyoudo";
	int pos = str6.find("do", 9);
	if (pos == string::npos) {
		printf("do is not found!\n")
	}

	//int\float 化为 string
	int i = 1234;
	string str7 = to_string(i);
	float f = 3.14;
	str7 = to_string(f);
	string str8 = "3.14159";
	f = stof(str8);
	str = "314159";
	i = stoi(str8);

	//string的输入输出
	//1.继续用scanf和printf
		char arr[100];
	scanf("%s", arr);//先读到字符数组
	string str9;
	str9 = arr;//再转成string

	printf("str9 = %s\n", str9.c_str());//输出的话要使用 c_str

	//（不推荐）2.用C++的cin和cout
	string str10;
	cin >> str10;
	cout << "str10 =" << str10 << "\n";   //cin和cout性能差；格式麻烦
	return 0;
}

```

## string的优点

* **自动管理内存** ：无需手动申请或释放内存；
*  **丰富的成员函数** ：支持查找、替换、拼接、插入、删除等操作；
*  **异常安全** ：大多数操作都具有异常安全保证；
*  **兼容 STL 容器** ：可以像容器一样使用迭代器、排序、查找等功能；
*  **跨平台兼容性强** ：比 C 风格字符串更容易移植。

# 问题三：什么是反向传播？为什么需要反向传播？

## 一、什么是反向传播？

**反向传播** 是神经网络中用来\*\*自动调整参数（权重和偏置）\*\*的一种方法。它是训练神经网络的核心机制之一。

你可以把它想象成一个“老师批改作业”的过程：

* **前向传播（Forward Propagation）**  ：你做了一张数学卷子（输入数据），然后交上去；
* **反向传播（Backpropagation）**  ：老师把卷子批改完后告诉你哪道题错了、错得多严重，并指导你下次怎么做对。

在神经网络中：

输入数据 → 经过层层计算得到输出（前向传播），然后比较输出与正确答案，到误差（loss），再把误差从输出层“传回去”到输入层，计算每个参数对误差的影响大小。根据这些影响大小，使用优化器（如梯度下降）来更新参数，这样下一次预测就会更准确一些。

## 二、为什么需要反向传播？

### 1. **让神经网络学会自己改正错误**

没有反向传播，神经网络就像一个只会“猜答案”的学生，不知道自己哪里错了，也无法进步。有了反向传播，网络就知道哪些参数应该增大、哪些应该减小，从而一步步靠近正确的答案。

###  2. **自动学习特征表达**

深度神经网络之所以强大，是因为它可以自动从原始数据中提取有用的信息（比如图像中的边缘、纹理等），这依赖于不断调整各层参数的过程。反向传播就是这个“自动调整”的关键工具。

### 3. **实现端到端的学习**

反向传播让我们可以从输入直接学到输出，中间所有层都可以自动调整，不需要人为设计规则。输入一个西瓜照片，输出这是一个西瓜，中间每一层自动学会识别西瓜的边缘、形状、瓜蒂形状、纹理等特征

这就是所谓的**端到端学习（End-to-end Learning）**  ，而反向传播是实现它的关键技术。
