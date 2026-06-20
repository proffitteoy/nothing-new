
ARIMA-LSTM 是一种时间序列混合模型。核心思想是：

> **ARIMA 负责捕捉线性、自相关、趋势差分后的统计结构；LSTM 负责捕捉 ARIMA 没有解释掉的非线性残差结构。**

最常见的结构是：

$$
y_t = L_t + N_t + \varepsilon_t
$$

其中：

$$
\hat y_t^{ARIMA} \approx L_t
$$

然后计算残差：

$$
e_t = y_t - \hat y_t^{ARIMA}
$$

再用 LSTM 去学习残差序列：

$$
\hat e_t^{LSTM} = f(e_{t-1}, e_{t-2}, \dots, e_{t-k})
$$

最终预测为：

$$
\hat y_t = \hat y_t^{ARIMA} + \hat e_t^{LSTM}
$$

也就是：

> **先用 ARIMA 拟合可解释的线性部分，再用 LSTM 修正非线性误差。**

---

## 1. ARIMA 的作用

ARIMA 的作用是处理这类结构：

$$
y_t
=
c
+
\phi_1 y_{t-1}
+
\cdots
+
\phi_p y_{t-p}
+
\theta_1 \varepsilon_{t-1}
+
\cdots
+
\theta_q \varepsilon_{t-q}
+
\varepsilon_t
$$

它适合处理：

- 平稳时间序列；
- 线性自相关；
- 短期惯性；
- 趋势差分后的规律。

例如：

- 销量；
- 价格；
- 流量；
- 金融时间序列中的局部线性成分。

---

## 2. LSTM 的作用

LSTM 的作用是处理 ARIMA 难以处理的部分，例如：

- 非线性波动；
- 复杂周期；
- 突变后的恢复；
- 长期依赖；
- 残差中的隐含模式。

换句话说，LSTM 不直接替代 ARIMA，而是学习 ARIMA 没有解释掉的残差结构。
