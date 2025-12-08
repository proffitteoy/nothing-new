
我真狂点1000次干出来了

实际做法：shift+F12找strings，发现一堆flag
```
.data:005C4B40 aFlagSiwprwdvx7 db 'flag{SIwprwdVx7RXel94nepJ9k1nefBqLBS2}',0
.data:005C4B67                 align 4
.data:005C4B68 ; CHAR Text[]
.data:005C4B68 Text            db 'flag{TIBntXVbdZ4Z9VRtoOQ2wRlvDNIjQ8Ra}',0
.data:005C4B68                                         ; DATA XREF: sub_402790+23↑o
.data:005C4B68                                         ; sub_4027D0:loc_40282A↑o
.data:005C4B8F                 align 10h
.data:005C4B90 aFlagHilcmjfvtk db 'flag{hILCmjfvtk0hjuI0uRoI7URSTtmDBZNi}',0
.data:005C4BB7                 align 4
```
发现只有一个被调用