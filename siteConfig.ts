// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "阿的宝藏之地",
  faviconUrl: "/avatar.jpg",
  authorName: "阿",
  bio: "把数学学习、研究笔记、数据建模项目和 Agent 工程实践放进同一个长期演化的个人站点里。",

  navTitle: "阿",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "宝藏之地",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "https://bu.dusays.com/2026/06/20/6a361fc5c68ff.jpg",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"], // 呼吸流动的颜色组合
  // 修改这里：变成图片数组
  bgImages: ["/blog/static/background.png"],

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",

  // 5. 首页照片墙预览图
  photoWallImage: "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
  cloudMusicIds: ["3313005946", "761594"],
  social: {
    github: "https://github.com/proffitteoy",
    gitee: "",
    google: "",
    email: "84025375@qq.com",
    qq: "84025375",
    wechat: "84025375",
  },
  counts: {
    photos: 128, // 照片墙数量可以手动写死或动态计算
  },
  chatterTitle: "杂谈", // 你可以改成任何你喜欢的名字
  chatterDescription: "保留 Quartz 原版渲染的 misc 笔记。",

  // 👇 【新增】：全局背景弹幕配置
  danmakuList: [
    "在干嘛呢？",
    "有笨蛋嘛？",
    "前方高能反应！",
    "GROMACS 跑起来了吗？",
    "MD 模拟什么时候才能出图啊",
    "Graph Neural Networks 炼丹中...",
    "BUG 修复进度 99%",
    "今天背单词了吗？",
    "Tailwind CSS 拯救前端",
    "写算法中",
    "睡大觉中",
    "到底在干嘛？",
  ],
  buildDate: "2025-10-27T00:00:00+08:00", // 稳定运行起算时间
  footerBadges: [
    {
      name: "Next.js 16.2.1",
      color: "text-sky-500",
      svg: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v10h-2V7h2z"/>',
    },
    {
      name: "React 19.2.4",
      color: "text-cyan-400",
      svg: '<path d="M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 7.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>',
    },
    {
      name: "Tailwind CSS 4",
      color: "text-teal-400",
      svg: '<path d="M6 10c1.2-3.2 3.3-4.8 6.3-4.8 1.8 0 3.2.7 4.4 2.1.8.9 1.6 1.4 2.6 1.4 1.2 0 2.1-.6 2.7-1.8-1.2 3.2-3.3 4.8-6.3 4.8-1.8 0-3.2-.7-4.4-2.1-.8-.9-1.6-1.4-2.6-1.4-1.2 0-2.1.6-2.7 1.8zm-4 7.1c1.2-3.2 3.3-4.8 6.3-4.8 1.8 0 3.2.7 4.4 2.1.8.9 1.6 1.4 2.6 1.4 1.2 0 2.1-.6 2.7-1.8-1.2 3.2-3.3 4.8-6.3 4.8-1.8 0-3.2-.7-4.4-2.1-.8-.9-1.6-1.4-2.6-1.4-1.2 0-2.1.6-2.7 1.8z"/>',
    },
  ],
  friendLinkIssueUrl: "https://github.com/proffitteoy/math-vault/issues/new",
  friendLinkApplyFormat:
    "名称：阿的宝藏之地\n简介：记录项目、音乐、杂谈、友链、关于与博客。\n链接：https://nothing-new.icu\n头像：https://bu.dusays.com/2026/06/20/6a361fc5c68ff.jpg",
  enableLevelSystem: true,
}
