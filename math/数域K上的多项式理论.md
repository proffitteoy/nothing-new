---
obsidian-note-status:
  - colorful:completed
---

>[!问题1]
> 设 $f(x)$ 是一个 $n$ 次多项式，若当 $k=0,1,\dots,n$时有$f(x)=\frac{k}{k+1}$求$f(n+1)$

令 $g(x)=(x+1) f(x)-x$ ，则$0,10\dots,n$是$g(x)$的根，因此
$$

g(x)=c x(x-1)(x-2) \cdots(x-n) \text {, }

$$
即
$$

(x+1) f(x)-x=c x(x-1)(x-2) \cdots(x-n),

$$

 其中c是一个常数．令 $x=-1$ ，可求出 $c=\frac{(-1)^{n+1}}{(n+1)!}$ ，从而
$$

f(x)=\frac{1}{x+1}\left(\frac{(-1)^{n+1} x(x-1) \cdots(x-n)}{(n+1)!}+x\right)

$$
$$

f(n+1)=\frac{1}{n+2}\left((-1)^{n+1}+n+1\right) .

$$
当 $n$ 是奇数时，$f(n+1)=1$ ；当 $n$ 是偶数时，$f(n+1)=\frac{n}{n+2}$ ．$\square$

>[!问题2]
>$f(x)g(x)$是互素多显示，A是K上的n阶方阵，$f(A)=0$
>求证$g(x)$可逆


$$f(A)v(A)+g(A)u(A)=1$$
$$g(A)v(A)=1$$
$$g^{-1}(A)=u(A)$$

>[!问题3]
>已知$f(x)=x^n+a_1x^{n-1}+\dots+a_{n-1}x+a_n$不可约，
>$\varphi$是k上的线性变换，$a_1\neq0$
>$$\varphi(\alpha_1)=\alpha_2,\varphi(\alpha_2)=\alpha_3,\dots,\varphi(\alpha_n)=-\alpha_n\alpha_1-\alpha_{n-1}\alpha_2-\dots-\alpha_1\alpha_n$$
>证{$\alpha_1,\alpha_2,\dots,\alpha_n$}是V的一组基


证是一组等价于证线性无关
应用反证法：存在n个不全为0的数使得$$c_1\alpha_1+a_2\alpha_2+\dots+c_n\alpha_n=0$$
将$\varphi$作用于上式，则$$c_1I_v+c_2\varphi+\dots+c_n\varphi^{n-1}\alpha_1=0$$
设$$g(x)=c_1I_v+c_2\varphi+\dots+c_n\varphi^{n-1}\alpha_1$$
因为$g(x)\neq0$,$g(\varphi)\alpha_1=0$又有$f(\varphi)\alpha_1=0$
则$f(x)$不可约且$g(x)\neq0$的次数小于n
故$$f(\varphi)v(\varphi)+g(\varphi)u(\varphi)=I_v$$
两边同时乘以$\alpha_1$
$$\alpha_1=\alpha_1f(\varphi)v(\varphi)+\alpha_1g(\varphi)u(\varphi)=0$$
与$\alpha_1 \neq0$矛盾，$\square$




