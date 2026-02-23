---
title: 基于 Hexo 和 GitHub Pages 搭建博客并实现思源笔记一键发布
date: '2025-03-18 15:37:43'
categories:
  - 知识管理
tags:
  - Hexo
  - Github
  - 思源笔记

updated: '2025-03-18 15:57:43'
permalink: >-
  /post/build-a-blog-based-on-hexo-and-github-pages-and-realize-oneclick-release-of-siyuan-notes-z1ji8uo.html
comments: true
toc: true
---



# 基于 Hexo 和 GitHub Pages 搭建博客并实现思源笔记一键发布

## 一、新建 [Github](https://so.csdn.net/so/search?q=Github&spm=1001.2101.3001.7020) 仓库

1. 创建一个 github 仓库,点击 `Create repository`​
2. 需要特别注意的是仓库名字是 `Github用户名.github.io `​ 这个格式

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-03-18%20100348-20250318144133-d5j5osy.png)

3. 注意记得勾选 `Add a README file`​，为了方便后续查看 GitHub Pages 的域名和部署分支，然后点击创建
4. 创建后，点击 `setting`​
5. 查看这个分支，这里为 `main`​ 分支，后面写[配置文件](https://so.csdn.net/so/search?q=%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6&spm=1001.2101.3001.7020)需要用到，然后 `https://dukezhu513.github.io`​ 就是后续我们访问的域名，目前也可以访问，只是只能显示出你的仓库名，即我的 `dukezhu513.github.io`![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-03-18%20100533-20250318144133-6nm63zh.png)

## 二、安装Node.js、Git和Hexo

1. 安装 `node.js`​ ，官网链接： [Node.js — Download Node.js®](https://nodejs.org/zh-cn/download)
2. 本次是基于 `git`​ 进行部署，所以安装一个 `git`​，链接: [https://git-scm.com/downloads](https://git-scm.com/downloads)
3. 安装这两个，一般都会自动配置 `path`​，配置这个目的是可以在任何路径下使用 `git 和 node.js`​，如果没有配置环境变量，可以去配置一下。测试安装是否成功

```bash
# win + r 调出 cmd 命令行窗口，然后按照示例输入
# 如果出现版本号，说明已经安装成功了
C:\Users\duke>node -v
v18.16.1

C:\Users\duke>git --version
git version 2.39.0.windows.2
```

4. ​`git`​ 还需要配置相应的环境， 实现 `git`​ 和 `github`​ 之间的交互，如使用 `git`​ 拉取 `github`​ 项目、配置相应的密钥等等，推荐一个配置学习的链接：[使用git拉取github项目-CSDN博客](https://blog.csdn.net/qq_59509843/article/details/139632151)
5. 新建一个文件夹用来存博客，如我创建的仓库名和`github`​仓库名一致，完整路径就是 `D:\dukezhu513.github.io`​ ，建议路径中不要包含中文字符
6. 创建完后，进入这个创建的文件夹，然后鼠标右击，点击 `Open Git Bash here`​，进入一个命令行界面，然后输入 `npm install -g hexo-cli`​ ，将 Hexo 命令行工具安装到系统的全局环境中

```bash
# 示例
$ npm install -g hexo-cli
```

7. 待安装完毕，输入以下指令，将会新建一个 `myblogs`​ 文件夹，并且安装 Hexo 项目所需的依赖项

```bash
# 创建一个新的 Hexo 项目
$ hexo init myblogs
$ cd myblogs

# 安装 Hexo 项目所需的依赖项
$ npm install
```

8. 继续在 Git Bash 中执行指令 `hexo server`​

```bash
hexo server
```

执行完毕后，打开本地浏览器，访问 `http://localhost:4000/`​，出现以下界面，说明本地部署成功了

4. 继续在 Git Bash 中执行指令 `hexo server`​

```bash
$ hexo server
```

执行完毕后，打开本地浏览器，访问 `http://localhost:4000/`​，出现以下界面，说明本地部署成功了

![在这里插入图片描述](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-5c80c7a7d7874511a18d3a3b722274c2-20250317140310-yudc3wm.png)

## 四 、将本地博客部署到 Github 上

1. 打开博客目录，即我的 `D:\DukeZhu513.github.io\myblogs`​，找到 `_config.yml`​ 文件，然后使用记事本或者其他软件打开，这里我用 `vscode`​ 打开
2. 在末尾处加以下代码

```yml
# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: git
  repo: git@github.com:DukeZhu513/dukezhu.github.io.git
  branch: main
```

这个代码是指，使用 `git`​ 方式部署，`repo`​ 的选择按照如下图片示例

‍

而那个 `branch`​ 填写的就是分支，就是上述第三步建仓库时候，`pages`​ 部分查看的分支，需要一致

上面这种图片是我已经部署上去了，所以后面会看到有文件，而没有部署之前，即你们现在的界面，就是空的，只有一个 `READMD.md`​ 文件

3. 在当前博客目录安装 git 插件，即 `D:\DukeZhu513.github.io\myblogs`​，使用 `git bash`​ 执行这个命令

```bash
npm install hexo-deployer-git --save
```

4. 最后依次执行

```bash
hexo clean      # 清理 Hexo 缓存：
hexo generate   # 重新生成静态文件
hexo deploy     # hexo deploy
```

如果设置了密钥，输入密钥即可，若最终出现 `Deploy done`​ 就说明部署成功了，此时就可以使用域名访问了，`https://用户名.github.io`​ ，如果界面没改变，等个一两分钟即可

5. 如果最后一步报错:

```bash
Please make sure you have the correct access rights and the repository exists. 
FATAL Something's wrong. Maybe you can find the solution here:https://hexo.io/docs/troubleshooting.html 
Error: Spawn failed 
    at ChildProcess.<anonymous> (D:\DukeZhu513.github.io\myblogs\node_modules\hexo-deployer-git\node_modules\hexo-util\lib\spawn.js:51:21) 
    at ChildProcess.emit (node:events:519:28) 
    at cp.emit (D:\DukeZhu513.github.io\myblogs\node_modules\cross-spawn\lib\enoent.js:34:29) 
    at ChildProcess._handle.onexit (node:internal/child_process:294:12) 
```

> 解决方案

1. 首先检查上述配置过程中是否出错，即 `_config.yml`​ 文件是否出错
2. 检查 `git`​ 是否能够连接 `github`​

```bash
git ls-remote https://github.com/DukeZhu513/dukezhu513.github.io.git
```

3. 如果不能连接，再测试 `SSH`​ 连接情况

```bash
ssh -T git@github.com

# 如果报错
ssh: connect to host github.com port 22: Connection timed out
```

* 说明这个 SSH 连接超时，解决方案就是换个端口号
* 按照以下进行添加或者更改，更改电脑用户目录下的 `config`​ 文件，我的是 `C:\Users\Dukezhu\.ssh\config`​，以记事本打开或者其他方式打开

```bash
# 如果有这行数据，更改和添加对应的参数，如果没有，直接添加到末尾处
Host github.com
  Hostname ssh.github.com
  Port 443
```

* 更改后，注意需要刷新使其生效，有对应的命令，粗暴的方式就是重新启动即可
* 生效后，测试连接情况

```bash
ssh -T git@github.com
# 我的成功示例 
# Hi dukezhu513! You've successfully authenticated, but GitHub does not provide shell access.

ping github.com
# 显示一系列数字，即 IP

# 如果都能成功，配置基本就可以了
# 此时再执行
hexo clean      # 清理 Hexo 缓存：
hexo generate   # 重新生成静态文件
hexo deploy     # hexo deploy
```

## 五 、基本使用

1. 进入博客主目录，然后逐步进入 `source\_posts`​，我的就是 ` D:\dukezhu513.github.io\myblogs\source\_posts`​
2. 然后新建一个 `命名.md`​ 文件，用记事本或者 Vscode 打开，如果有支持 markdown 格式的笔记软件的话，可以对应打开

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-03-18%20103256-20250318144134-pxbld0v.png)

3. 然后按照这样的格式，填写文章标题、发布日期、标签、种类、关键词等等，标题和时间是必需的，其余看自己需求，标签像我这样写就是同级标签

![在这里插入图片描述](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-d645149abd3f408b83de91fdbae5e5d5-20250317140311-gsh04yl.png)  
4. 这个使用 `---`​ 包括起来的内容称之为 `Front-matter`​，即前置信息，用于给 Hexo 渲染该 md 文档，除了这三项，还有很多的配置项可以自己添加：

|配置项|意义|
| ------------| ----------------------|
|title|网页文章标题|
|date|文章创建时间|
|comments|文章评论功能是否启动|
|tags|文章标签|
|categories|文章分类|
|keywords|文章关键字|

5. Hexo主题更换

    1. 我用的是Fluid，主题推荐:[https://blog.lixiaomu.fun/posts/43857/](https://blog.lixiaomu.fun/posts/43857/)

## 六、结合思源笔记“一键发布”

1. 在插件集市中安装发布工具
2. 在左上角的发布工具进行发布设置
3. 鉴权Token需要到`github`​进行申请，发布工具为Markdown，图床选择PicGO

![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-03-18%20104140-20250318144134-pf7nu7q.png)  
​![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-03-18%20104951-20250318144134-kr5f067.png)

注意：有效期请设置永久有效，权限最低要给`workflow 更新 GitHub Actions 工作流程`​

4. 在进行常规发布前，先把`gitHub`​仓库的原始文件夹全部清空，不能有`.html`​文件![](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-03-18%20110108-20250318144134-1g8zitf.png)
5. [https://hexo.io/zh-cn/docs/github-pages](https://hexo.io/zh-cn/docs/github-pages)参考这个来进行 [GitHub Actions](https://docs.github.com/zh/actions) 部署 GitHub Pages，同时要在仓库page中`source`​更改为`Github Actions`​
6. 进行常规发布，看看是否正常

## 七、搭建图床

为什么要搭建图床：在博客写文章或者搭建自己的网站时，需要往里面加入图片。但是在本地的图片别人是看不到的，需要一个个去复制粘贴。如果用阿里云OSS或者腾讯云COS来搭建一个图床，问题就迎刃而解了。

1. 本人选用阿里云OSS云服务

    * 登录 [阿里云官网](https://account.aliyun.com/login/login.htm?oauth_callback=https://oss.console.aliyun.com/index)，可以用支付宝扫码登录
    * 登录之后创建 Bucket  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-oZ0CBrT-20250318111023-6a69t04.png)
    * 「Bucket 名称」任取 (取完之后**复制**下来，等下要用)，地域选择离你最近的那个，其他的设置保持默认。  
      （PS：如果想使用香港免费额度的话，就是下图的“地域”选取香港即可，其余的步骤都一样）  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-UQrqmah-20250318111023-m8es8dy.png)
    * 创建完成后会跳转到如下界面，**复制**下「外网访问-Endpoint（地域节点）」  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-zdKuxKj-20250318111023-fovbpvq.png)

    ### 2.创建子账户

    * 这时候我们只有主账户，权限很高，风险也很大。同步不需要这么大的权限，所以接下来创建一个子账户接管部分权限。鼠标移动到右上角的头像位置，点击 「AccessKey 管理」  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-PjGH7yf-20250318111023-400s68m.png)
    * 接下来会弹出一个安全提示的窗口，点击「开始使用子用户 AccessKey」

    ![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-u0zGWCs-20250318111023-uh9ryzs.png)

    * 然后「创建用户」  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-szohrIY-20250318111023-2hbyr9u.png)
    * 「登录名称」和「显示名称」任取，但是注意：「**Open API 调用访问**」要勾选上  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-0CnMgRd-20250318111023-gkyaues.png)
    * 点击确定之后，会显示  AccessKey ID 和 AccessKey Secret 的信息，两个都**复制**一下

      * 注意：AccessKey Secret 信息**只会显示这一次**，请妥善保管
    * 在创建完子账户之后，需要给子账户授予OSS权限
    * 鼠标移动到右上角头像处，点击「访问控制」-「用户」-「添加权限」![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-Voizihy-20250318111023-1f4lfoe.png)
    * 选中AliyunOSSFullAccess，然后确定即可![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-P4oZQOm-20250318111023-xj7cvv5.png)

    #### 3.给子账户添加Bucket权限

    * 返回初始的 Bucket 界面，在「权限控制」-「Bucket 授权策略」中「新增授权」  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-BxQGW9E-20250318111023-jvz2wpo.png)
    * 在授权界面，「授权资源」-「整个 Bucket」；「授权用户」-「子账号」-选择刚刚创建的子账号；「授权操作」-「完全控制」  
      ​![image.png](https://mysynotebook.oss-cn-hongkong.aliyuncs.com/img/network-asset-image-QhLtzXZ-20250318111023-r0ew9hi.png)

    ##### 4.开通套餐包

    * 按步骤操作下来之后我们已经获得了相应的权限，同时复制了所需的所有信息，就是这四个：Bucket 名称、Endpoint（地域节点）、AccessKey ID 和 AccessKey Secret

    ##### 5.思源填入对应信息

    * 打开思源，「设置」-「云端」，填入对应的信息即可

      * Endpoint 对应 Endpoint（地域节点）
      * Access Key 对应 AccessKey ID
      * Secret Key 对应 AccessKey Secret
      * Bucket 对应 Bucket 名称
      * Region 参考[这里](https://help.aliyun.com/zh/oss/user-guide/regions-and-endpoints?spm=a2c4g.11186623.0.0.20555b4enZQnaJ#section-plb-2vy-5db)的Region ID进行填写
      * Timeout (s) 保持默认的 30
      * Addressing 保持默认的 Virtual-hosted-style 选项
      * TLS Verify 保持默认的 Verify

    ## 特别要点：在阿里云的控制台选择Bucket，修改Bucket的读写设置至少为公共读
2. 进行常规发布进行测试

## 八、图床配置

[思源笔记配合插件实现HEXO文章快速发布 - Shepherd010](https://shepherd010.github.io/post/siyuan-notes-and-plugin-realize-the-rapid-release-of-hexo-articles-za8u7r.html)

## 总结

通过本文的步骤，可以轻松搭建一个基于 Hexo 和 GitHub Pages 的个人博客，并结合思源笔记实现“一键发布”功能。同时，通过配置阿里云 OSS 和 PicGo 图床，解决了图片上传和管理的难题。这套方案不仅简单易用，而且完全免费，非常适合个人博客的搭建和维护。

‍
