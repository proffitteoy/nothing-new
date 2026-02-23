---
title: Home Credit Default Risk信贷违约预测实践
date: '2025-12-01 08:28:33'
categories:
  - 学习笔记
tags:
  - Kaggle
  - 数据分析
updated: '2025-12-02 23:47:48'
permalink: /post/home-credit-default-riskcredit-default-prediction-practice-z1tdqhv.html
comments: true
toc: true
---



# Home Credit Default Risk信贷违约预测实践

本次竞赛的核心任务是利用历史贷款数据预测申请人未来的还款表现，具体来说是一个二元分类问题：预测申请人是否会按时还款（标签为0）或是存在违约风险（标签为1）。

在初步数据探索与预处理阶段，我针对发现的关键数据问题采取了以下具体的解决措施：

1. **处理高比例缺失值**： 数据集中存在大量缺失值。我直接利用了LightGBM算法，它能够在训练过程中内部处理缺失值，无需事先进行复杂的插补。这是一种高效且实用的方法，避免了因插补不当引入噪声的风险。
2. **应对目标类别不平衡**： 训练集中存在明显的类别不平衡现象（按时还款 vs 违约）。在后续建模实践中，我通过调整模型参数来应对这一问题。例如，在使用逻辑回归或随机森林等模型时，可以通过设置 `class_weight='balanced'` 参数，让模型自动调整各类别的权重，给予少数类（违约样本）更高的关注度，从而提升模型对 minority class 的识别能力。
3. **编码分类变量**： 针对原始数据中的字符串类型分类变量，我实施了：

    - ​**标签编码（Label Encoding）** ​：首先，遍历所有特征，对于那些`dtype == object`​且唯一值类别数小于等于2的特征（例如`CODE_GENDER`​可能只有'M'和'F'），我使用了`sklearn.preprocessing.LabelEncoder`进行了标签编码，将其转换为数值（0, 1）。
    - ​**独热编码（One-Hot Encoding）** ​：对于剩余的、具有多个类别的`object`​类型特征，则应用了`pandas.get_dummies()`函数执行了独热编码。这一步骤将每个多元分类特征转换为多个二元的指示变量（dummy variables），使得模型能够无偏见地处理这些信息。
    - ​**数据对齐（Alignment）** ​：由于独热编码可能导致训练集和测试集的特征列不一致（例如某个类别只在训练集出现），我还特别调用了`app_train.align(app_test, join='inner', axis=1)`函数，确保训练集和测试集拥有完全相同的特征列，保证了模型输入的一致性。
4. **处理异常值**： 在分析`DAYS_EMPLOYED`​特征时，我发现了一个特定的异常值（365243），代表不可能的就业天数。有趣的是，这些异常值对应的客户违约率反而更低。为了充分利用这一信息，我没有简单地删除或用均值替代这些值，而是采取了更具创造性的特征工程方法：基于此创建一个布尔型的新特征： `DAYS_EMPLOYED_ANOMALY`，专门用来标记该样本是否具有这个特殊值。这样既保留了原始异常值的信息，又增加了一个可能对模型预测有帮助的强特征。

我通过这个比赛完整实践了一个机器学习流程：从数据探索、预处理到模型构建与优化，受益匪浅，打算下一步进行正式比赛的尝试。更加细节的部分我放在了Kaggle的Notebook中：https://www.kaggle.com/code/dukezhu/home-credit-default-risk-notebook

参考Notebook:

- [Start Here: A Gentle Introduction](https://www.kaggle.com/code/willkoehrsen/start-here-a-gentle-introduction)

‍
