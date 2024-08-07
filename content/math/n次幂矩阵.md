---
obsidian-note-status:
  - colorful:completed
---
我们通过给出一种用矩阵求解Fibonacci数列通项公式的方法来引出一般n次矩阵的求法：
首先表示其递推式：
$$\left(\begin{array}{}a_{n+1}\\a_n\end{array}\right) = \left(\begin{array}{}1 & 1 \\1 & 0 \end{array}\right)\left(\begin{array}{}a_{n}\\a_{n-1}\end{array}\right)$$
则通项可以表示成：
$$\left(\begin{array}{}a_{n+1}\\a_n\end{array}\right) = \left(\begin{array}{}1 & 1 \\1 & 0 \end{array}\right)^n \left(\begin{array}{}1\\0\end{array}\right)$$
所以应当把注意力放在求解n次幂矩阵上，
设$$A=\left(\begin{array}{}1 & 1 \\ 1 & 0\end{array}\right)$$
则对一般的矩阵，先求出其特征根，然后求出向量
在这题中，特征根就是我们熟悉的$\frac{1+\sqrt5}{2}$和$\frac{1-\sqrt5}{2}$
再求出特征向量：$$\alpha_1=\left(\begin{array}{}\frac{1+\sqrt5}{2}\\ 1\end{array}\right) ,\alpha_2=\left(\begin{array}{}\frac{1-\sqrt5}{2}\\ 1\end{array}\right)$$
若我们记$$P=\left(\begin{array}{}\frac{1+\sqrt5}{2} & \frac{1-\sqrt5}{2}\\ 1 &1\end{array}\right)$$
则$$P^{-1}AP=\left(\begin{array}{}\frac{1+\sqrt5}{2} & 0 \\ 0 & \frac{1-\sqrt5}{2}\end{array}\right)$$
两边先取n次幂，然后左乘A右乘A逆便求得。
## 对角化

>[!命题1]
>有两个数列$a_n,b_n$其中$a_1=1,b_1=-1$并且满足递推关系$a_n=a_{n-1}+2b_{n-1},b_n=-a_{n-1}+4b_{n-1}$，试求通项

将数列化为矩阵形式：
$$
\binom{a_n}{b_n}=\left(\begin{array}{cc}
1 & 2 \\
-1 & 4
\end{array}\right)\binom{a_{n-1}}{b_{n-1}}=\left(\begin{array}{cc}
1 & 2 \\
-1 & 4
\end{array}\right)^{n-1}\binom{1}{-1}
$$

根据前文方法，计算出 $\left(\begin{array}{cc}1 & 2 \\ -1 & 4\end{array}\right)^{n-1}=\left(\begin{array}{cc}2^n-3^{n-1} & 2 \cdot 3^{n-1}-2^n \\ 2^{n-1}-3^{n-1} & 2 \cdot 3^{n-1}-2^{n-1}\end{array}\right)$ ，由此即得结论．

>[!命题2]
>求极限$$\displaystyle \lim_{x \to \infty} \left(\begin{array}{}1\over2 & 1 & 1\\ 0 & 1\over3 &2 \\ 0 & 0 & 1\over5 \end{array}\right)^n$$

解法1：
记矩阵为 $\boldsymbol{A}$ ，显然 $\boldsymbol{A}$ 有 3 个不同的特征值 $\frac{1}{2}, \frac{1}{3}, \frac{1}{5}$ ，因此存在可逆矩阵 $\boldsymbol{P}$ ，使得 $\boldsymbol{P}^{-1} \boldsymbol{A} \boldsymbol{P}=\operatorname{diag}\left\{\frac{1}{2}, \frac{1}{3}, \frac{1}{5}\right\}=\boldsymbol{B}$ ．注意到 $\boldsymbol{A}^n=\boldsymbol{P} \boldsymbol{B}^n \boldsymbol{P}^{-1}$ 且 $\boldsymbol{B}^n$ 的极限为零矩阵，故 $\boldsymbol{A}^n$ 的极限也是零矩阵。

解法2：
前面求特征值特征向量与解法一一致，
构造矩阵$P$
$$P = \begin{pmatrix} 
1 & 6 & 140 \\ 
0 & -1 & -45 \\ 
0 & 0 & 3 
\end{pmatrix} $$
求$P^{-1}$
 $$P^{-1} = \begin{pmatrix} 
1 & 6 & \frac{130}{3} \\ 
0 & -1 & -15 \\ 
0 & 0 & \frac{1}{3} 
\end{pmatrix} $$

计算极限
$$A^n = P \cdot \begin{pmatrix} 
(\frac{1}{2})^n & 0 & 0 \\ 
0 & (\frac{1}{3})^n & 0 \\ 
0 & 0 & (\frac{1}{5})^n 
\end{pmatrix} \cdot P^{-1}$$

当$n \to \infty$，$(\frac{1}{2})^n, (\frac{1}{3})^n, (\frac{1}{5})^n \to 0$，故：
$$\lim_{n \to \infty} A^n = 0 $$

$$\lim_{n \to \infty} \begin{pmatrix} 
\frac{1}{2} & 1 & 1 \\ 
0 & \frac{1}{3} & 2 \\ 
0 & 0 & \frac{1}{5} 
\end{pmatrix}^n = \begin{pmatrix} 
0 & 0 & 0 \\ 
0 & 0 & 0 \\ 
0 & 0 & 0 
\end{pmatrix} $$

## Jordan标准型的应用
上述将求n次幂矩阵对角化后求解的方法不由让人想到类似的知识点，即矩阵的jordan化。事实上这种方法对于求n次幂矩阵也是可行的。
设A是n阶矩阵，P为n阶 可逆矩阵，使得$P^{-1}AP=J=diag\{J_{r_1}(\lambda_1),J_{r_2}(\lambda_2),\dots,J_{r_k}(\lambda_k)\}$为Jordan标准型。则注意到$$J_{r_i}(\lambda_i)={\lambda_i}{I_{r_i}}+J_{r_i}(0)$$
因为他们可交换，故可使用二项式，求得$$J^m = \{J_{r_1}(\lambda_1)^m,J_{r_2}(\lambda_2)^m,\dots,J_{r_k}(\lambda_k)^m\}$$
## 凯莱-哈密顿定理的应用

我们已经看到，通过将矩阵对角化或化为约当标准型，可以有效地计算矩阵的高次幂 $A^n$。然而，在某些情况下，我们可能并不需要显式地求出过渡矩阵 $P$ 和 $P^{-1}$，或者矩阵的谱分解本身比较复杂。这时，凯莱-哈密顿定理为我们提供了一条不同的路径来处理矩阵幂。

**凯莱-哈密顿定理简述：**
对于任意 $n$ 阶方阵 $A$，若其特征多项式为 $p(\lambda) = \det(A - \lambda I) = (-1)^n \lambda^n + c_{n-1}\lambda^{n-1} + \dots + c_1\lambda + c_0$，则矩阵 $A$ 满足其自身的特征方程，即 $p(A) = (-1)^n A^n + c_{n-1}A^{n-1} + \dots + c_1A + c_0I = \mathbf{0}$。

这个定理的核心启示是，任何 $n$ 阶方阵 $A$ 的 $n$ 次幂 $A^n$ 都可以表示为 $A$ 的低于 $n$ 次的幂的线性组合。

>[!核心思想]
利用 $p(A) = \mathbf{0}$ 这个关系式，我们可以将 $A^k$ (其中 $k \ge n$) 表示为 $r_{n-1}A^{n-1} + \dots + r_1A + r_0I$ 的形式，其中系数 $r_i$ 可以通过多项式除法或利用特征值来确定。

考虑多项式 $\lambda^k$。根据带余除法，存在多项式 $q(\lambda)$ 和 $r(\lambda)$（其中 $\deg(r(\lambda)) < \deg(p(\lambda)) = n$）使得：
$$ \lambda^k = q(\lambda)p(\lambda) + r(\lambda) $$
将矩阵 $A$ 代入上式：
$$ A^k = q(A)p(A) + r(A) $$
由于 $p(A) = \mathbf{0}$，我们得到：
$$ A^k = r(A) $$
其中 $r(A) = r_{n-1}A^{n-1} + r_{n-2}A^{n-2} + \dots + r_1A + r_0I$。

>[!命题3]
>设矩阵 $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$，试用凯莱-哈密顿定理计算 $A^4$。

**解：**
首先计算 $A$ 的特征多项式：
$$ p(\lambda) = \det(A - \lambda I) = \det \begin{pmatrix} 2-\lambda & 1 \\ 1 & 2-\lambda \end{pmatrix} = (2-\lambda)^2 - 1 = \lambda^2 - 4\lambda + 4 - 1 = \lambda^2 - 4\lambda + 3 $$
根据凯莱-哈密顿定理，$p(A) = A^2 - 4A + 3I = \mathbf{0}$。
由此可得：
$$ A^2 = 4A - 3I \quad (*)$$
现在我们来计算 $A^3$ 和 $A^4$：
$$ A^3 = A \cdot A^2 = A(4A - 3I) = 4A^2 - 3A $$
将 $(*)$ 代入上式：
$$ A^3 = 4(4A - 3I) - 3A = 16A - 12I - 3A = 13A - 12I \quad (**) $$
接着计算 $A^4$：
$$ A^4 = A \cdot A^3 = A(13A - 12I) = 13A^2 - 12A $$
再次将 $(*)$ 代入上式：
$$ A^4 = 13(4A - 3I) - 12A = 52A - 39I - 12A = 40A - 39I $$
因此，$A^4 = 40A - 39I$。

需要注意的是，当要求的幂次足够大时，这种方法似乎会使问题复杂化。不妨以引例举例：
>[!命题4]
>利用凯莱-哈密顿定理的思想，求解 Fibonacci 矩阵 $A = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}$ 的 $A^n$ 的通项公式。


矩阵 $A$ 的大小为 $d=2$。其特征多项式为 $p(\lambda) = \lambda^2 - \lambda - 1$。
我们设 $A^n = r_1(n)A + r_0(n)I$。
$A$ 的特征值为 $\phi = \frac{1+\sqrt{5}}{2}$ 和 $\psi = \frac{1-\sqrt{5}}{2}$。
根据 $\lambda_i^n = r_1(n)\lambda_i + r_0(n)$，我们得到方程组：
$$
\begin{cases}
\phi^n = r_1(n)\phi + r_0(n) & (1) \\
\psi^n = r_1(n)\psi + r_0(n) & (2)
\end{cases}
$$
$(1) - (2)$ 得：
$$ \phi^n - \psi^n = r_1(n)(\phi - \psi) $$
由于 $\phi - \psi = \sqrt{5}$，所以：
$$ r_1(n) = \frac{\phi^n - \psi^n}{\sqrt{5}} $$
这正是 Fibonacci 数列的第 $n$ 项 $F_n$。
将 $r_1(n)$ 代入 $(1)$：
$$ r_0(n) = \phi^n - r_1(n)\phi = \phi^n - \left(\frac{\phi^n - \psi^n}{\sqrt{5}}\right)\phi $$
$$ r_0(n) = \frac{\sqrt{5}\phi^n - \phi^{n+1} + \phi\psi^n}{\sqrt{5}} $$
利用 $\phi\psi = -1$，则 $\phi\psi^n = (\phi\psi)\psi^{n-1} = -\psi^{n-1}$。
$$ r_0(n) = \frac{\sqrt{5}\phi^n - \phi^{n+1} - \psi^{n-1}}{\sqrt{5}} $$
我们知道 $F_{n-1} = \frac{\phi^{n-1} - \psi^{n-1}}{\sqrt{5}}$。为了将 $r_0(n)$ 与 $F_{n-1}$ 联系起来，我们注意到 $\phi^2 = \phi+1$ 和 $\psi^2 = \psi+1$。
从 $r_0(n) = \psi^n - r_1(n)\psi$ (将 $r_1(n)$ 代入 (2) 并整理) 可能会更简洁：
$r_0(n) = \psi^n - \frac{\phi^n - \psi^n}{\sqrt{5}}\psi = \frac{\sqrt{5}\psi^n - \phi^n\psi + \psi^{n+1}}{\sqrt{5}}$
利用 $\phi\psi = -1$:
$r_0(n) = \frac{\sqrt{5}\psi^n - (-\psi^{-1})\psi^n + \psi^{n+1}}{\sqrt{5}} = \frac{\sqrt{5}\psi^n + \psi^{n-1} + \psi^{n+1}}{\sqrt{5}}$ (这一步似乎复杂了)
让我们回到 $r_0(n) = \phi^n - r_1(n)\phi$。
因为 $r_1(n) = F_n$，所以 $r_0(n) = \phi^n - F_n\phi$。
我们期望 $r_0(n) = F_{n-1}$。
即要证明 $\phi^n - F_n\phi = F_{n-1}$。
$\phi^n - \frac{\phi^n - \psi^n}{\sqrt{5}}\phi = \frac{\phi^{n-1} - \psi^{n-1}}{\sqrt{5}}$
$\sqrt{5}\phi^n - (\phi^n - \psi^n)\phi = \phi^{n-1} - \psi^{n-1}$
$\sqrt{5}\phi^n - \phi^{n+1} + \phi\psi^n = \phi^{n-1} - \psi^{n-1}$
$\phi^{n-1}(\sqrt{5}\phi - \phi^2 - 1) + \psi^{n-1}(\phi\psi + 1) = 0$
$\phi^{n-1}(\sqrt{5}\phi - (\phi+1) - 1) + \psi^{n-1}(-1 + 1) = 0$
$\phi^{n-1}(\sqrt{5}\phi - \phi - 2) = 0$
$\phi^{n-1}((\sqrt{5}-1)\phi - 2) = 0$
$(\sqrt{5}-1)\frac{1+\sqrt{5}}{2} - 2 = (\sqrt{5}-1)\frac{1+\sqrt{5}}{2} - 2 = \frac{(\sqrt{5})^2 - 1^2}{2} - 2 = \frac{5-1}{2} - 2 = \frac{4}{2} - 2 = 2-2 = 0$。
所以 $r_0(n) = F_{n-1}$ 成立。
因此，$A^n = F_n A + F_{n-1}I$。
$$ A^n = \frac{\phi^n - \psi^n}{\sqrt{5}} \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix} + \frac{\phi^{n-1} - \psi^{n-1}}{\sqrt{5}} \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} $$
$$ A^n = \frac{1}{\sqrt{5}} \begin{pmatrix} \phi^n - \psi^n + \phi^{n-1} - \psi^{n-1} & \phi^n - \psi^n \\ \phi^n - \psi^n & \phi^{n-1} - \psi^{n-1} \end{pmatrix} $$
利用 $\phi^{n-1} + \phi^n = \phi^{n-1}(1+\phi) = \phi^{n-1}\phi^2 = \phi^{n+1}$ (同样适用于 $\psi$)：
$$ A^n = \frac{1}{\sqrt{5}} \begin{pmatrix} \phi^{n+1} - \psi^{n+1} & \phi^n - \psi^n \\ \phi^n - \psi^n & \phi^{n-1} - \psi^{n-1} \end{pmatrix} = \begin{pmatrix} F_{n+1} & F_n \\ F_n & F_{n-1} \end{pmatrix} $$