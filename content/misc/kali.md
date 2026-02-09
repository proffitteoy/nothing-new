
## hashcat
破哈希密码的玩意
第一次做破的是7z格式的压缩包密码，通过kali里面的字典/usr/share/wordlists/rockyou.txt.gz实现，这里的字典同样是压缩形式的
主机传到虚拟机时文件格式损坏，注意要直接上传虚拟机。
我直接尝试在虚拟机上创建压缩包，然后执行以下流程：

使用
```kali
7z2john 文件名
如果是zip则是：
zip2john
```
然后利用字典攻击：
```kali
hashcat -m 11600 '$7z$0$19$0$$16$7a78c302eec50d46522c064f47191306$4155558434$112$98$7a5158bcbec8ee3d65236427de1b92d3a539dc4053873b0988fd2d1226b4d2a5298f0e7c11957b1baff8dfca8278d0948be095470cc57fbc669b7c3fe63188fcc37eaf3acf8969a9028f0f1d6ac390f1e4b41bb6320e09263a370cc0d702fadfa7b5450875925a439c625c0d1a783757' /usr/share/wordlists/rockyou.txt.gz
```
-m 后面的值需要用hashcat --help 来查询，''里面的是需要破译的哈希值，最后跟破译的字典地址


## netdiscover
ip地址扫描
```kali
sudo netdiscover -r 192.168.80.0/24
```
前三位内网地址，加.0/24

## nmap
```kali
nmap -O -sV IP
```
扫描端口，服务器版本，不一定要在同一网段
除此之外可以直接扫指定端口
```kali
nmap -p n1,n2...IP
```



## sqlmap
```kali
sqlmap -u "https:" -D "数据库名" -T "数据表" -dump
```