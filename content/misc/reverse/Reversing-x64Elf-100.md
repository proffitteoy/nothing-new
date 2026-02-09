
### 步骤
查壳：无壳，go语言
反汇编输出![[2db7b3253ae1feeeeb1b801d0c162f30.png]]
很明显和sub_4006FD有关，如下：
![[3f400f5789f340d8033d23d08636cf94.png]]

核心判断是
```
v3[i % 3][ 2*(i/3) ]  -  input[i] == 1
⇒ input[i] = v3[i % 3][ 2*(i/3) ] - 1
```
写成脚本破解：
```
# 原字符串数组
v3 = [
    "Dufhbmf",
    "pG`imos",
    "ewUglpt"
]
password = ""
for i in range(12):
    src_char = v3[i % 3][2 * (i // 3)]  # 取字符
    password += chr(ord(src_char) - 1) # 减1恢复原密码
print(password)
```
