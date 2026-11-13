// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "阿的宝藏之地",
  faviconUrl: "/avatar.jpg",
  authorName: "阿",
  bio: "把数学学习、研究笔记、数据建模项目和智能体工程实践放进同一个长期演化的个人站点里。",

  navTitle: "阿",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "宝藏之地",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "/avatar",

  // 3. 全站背景：只保留一个背景源，首页、普通页面、博客和杂谈统一使用
  useGradient: false,
  themeColors: ["#4266cf", "#805ac8", "#ce4a83", "#168579"], // 蓝色为主，紫／玫红／青绿点缀
  backgroundImage: "/background.png",

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",

  // 5. 歌单与社交链接
  cloudMusicIds: [
    "3313005946",
    "761594",
    "2669802224",
    "3405072664",
    "2693626963",
    "1809646618",
    "3361076230",
    "1859390262",
  ],
  social: {
    github: "https://github.com/proffitteoy",
    email: "84025375@qq.com",
    qq: "84025375",
    wechat: "-84025375",
  },

  // 👇 【新增】：全局背景弹幕配置
  danmakuList: [
    "在干嘛呢？",
    "有笨蛋嘛？",
    "前方高能反应！",
    "分子模拟跑起来了吗？",
    "分子动力学模拟什么时候才能出图啊",
    "图神经网络炼丹中……",
    "漏洞修复进度 99%",
    "今天背单词了吗？",
    "样式工具正在拯救前端",
    "写算法中",
    "睡大觉中",
    "到底在干嘛？",
  ],
  friendLinkIssueUrl: "https://github.com/proffitteoy/nothing-new/issues/new",
  friendLinkApplyFormat:
    "名称：阿的宝藏之地\n简介：为学日益，为道日损\n链接：https://nothing-new.cn\n头像：https://nothing-new.cn/avatar",
}
